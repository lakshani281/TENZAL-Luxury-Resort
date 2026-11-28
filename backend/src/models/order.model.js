const crypto = require('crypto');
const db = require('../config/db');

/**
 * Valid state machine transitions for in-room dining orders.
 * Terminal states: 'Delivered', 'Cancelled' (no transitions out).
 */
const VALID_STATUS_TRANSITIONS = Object.freeze({
  'Pending': Object.freeze(['In Kitchen', 'Cancelled']),
  'In Kitchen': Object.freeze(['Out for Delivery', 'Cancelled']),
  'Out for Delivery': Object.freeze(['Delivered']),
  'Delivered': Object.freeze([]), // Terminal
  'Cancelled': Object.freeze([]), // Terminal
});

/**
 * All allowed statuses matching PostgreSQL chk_orders_status_valid constraint.
 */
const ALL_STATUSES = Object.freeze(['Pending', 'In Kitchen', 'Out for Delivery', 'Delivered', 'Cancelled']);

/**
 * Format raw order rows into a clean, typed Order entity.
 *
 * @param {Object} orderRow - Primary row from orders table
 * @param {Array} [detailRows=[]] - Line item rows from order_details table
 * @param {Array} [historyRows=[]] - Audit rows from order_status_history table
 * @returns {Object|null}
 */
function formatOrder(orderRow, detailRows = [], historyRows = []) {
  if (!orderRow) return null;

  return {
    order_id: orderRow.order_id,
    order_code: orderRow.order_code,
    room_number: orderRow.room_number,
    room_name: orderRow.room_name,
    customer_id: orderRow.customer_id,
    special_note: orderRow.special_note,
    subtotal: parseFloat(orderRow.subtotal),
    service_charge: parseFloat(orderRow.service_charge),
    total_amount: parseFloat(orderRow.total_amount),
    status: orderRow.status,
    estimated_delivery_minutes: orderRow.estimated_delivery_minutes,
    created_at: orderRow.created_at,
    updated_at: orderRow.updated_at,
    items: detailRows.map((d) => ({
      order_detail_id: d.order_detail_id,
      order_id: d.order_id,
      item_id: d.item_id,
      item_name: d.item_name,
      unit_price: parseFloat(d.unit_price),
      quantity: d.quantity,
      line_total: parseFloat(d.line_total),
      created_at: d.created_at,
    })),
    status_history: historyRows.map((h) => ({
      history_id: h.history_id,
      order_id: h.order_id,
      previous_status: h.previous_status,
      new_status: h.new_status,
      changed_by_user_id: h.changed_by_user_id,
      change_reason: h.change_reason,
      created_at: h.created_at,
    })),
  };
}

/**
 * Generate a unique, human-friendly order code.
 * Example format: ORD-20261108-7F3A2B (19 characters, well within VARCHAR(30))
 *
 * @returns {string}
 */
function generateOrderCode() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Order Model
 * Handles database operations for in-room dining orders, order details,
 * and order status history across PostgreSQL transactions.
 */
class OrderModel {
  /**
   * Generates a unique order code.
   *
   * @returns {string}
   */
  static generateCode() {
    return generateOrderCode();
  }

  /**
   * Creates an order with its details and initial status history inside a single transaction.
   * Includes safe, limited retry (up to 3 attempts) in case of rare order_code unique constraint collisions.
   *
   * @param {Object} data
   * @param {string} [data.orderCode] - Unique order code (generated if omitted or regenerated on collision)
   * @param {string} data.roomNumber - Verified room number (e.g. 'Room 3')
   * @param {string} data.roomName - Verified room name
   * @param {string|null} [data.customerId=null] - Optional guest/customer identifier
   * @param {string|null} [data.specialNote=null] - Special delivery / dietary instructions
   * @param {string} data.subtotal - Formatted numeric string (e.g. '24100.00')
   * @param {string} data.serviceCharge - Formatted numeric string (e.g. '2410.00')
   * @param {string} data.totalAmount - Formatted numeric string (e.g. '26510.00')
   * @param {number} data.estimatedDeliveryMinutes - Estimated delivery turnaround
   * @param {Array<Object>} data.items - Snapshotted order details
   * @returns {Promise<Object>} Created order with full relations
   */
  static async create({
    orderCode,
    roomNumber,
    roomName,
    customerId = null,
    specialNote = null,
    subtotal,
    serviceCharge,
    totalAmount,
    estimatedDeliveryMinutes = 30,
    items,
  }) {
    const maxRetries = 3;
    let currentOrderCode = orderCode || generateOrderCode();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const client = await db.pool.connect();

      try {
        await client.query('BEGIN');

        // 1. Insert master orders record (status strictly 'Pending')
        const orderInsertSql = `
          INSERT INTO orders (
            order_code,
            room_number,
            room_name,
            customer_id,
            special_note,
            subtotal,
            service_charge,
            total_amount,
            status,
            estimated_delivery_minutes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', $9)
          RETURNING *;
        `;
        const orderParams = [
          currentOrderCode,
          roomNumber,
          roomName,
          customerId,
          specialNote,
          subtotal,
          serviceCharge,
          totalAmount,
          estimatedDeliveryMinutes,
        ];
        const { rows: orderRows } = await client.query(orderInsertSql, orderParams);
        const createdOrder = orderRows[0];
        const orderId = createdOrder.order_id;

        // 2. Insert all order_details snapshots
        const insertedDetails = [];
        for (const item of items) {
          const detailInsertSql = `
            INSERT INTO order_details (
              order_id,
              item_id,
              item_name,
              unit_price,
              quantity,
              line_total
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
          `;
          const detailParams = [
            orderId,
            item.item_id,
            item.item_name,
            item.unit_price,
            item.quantity,
            item.line_total,
          ];
          const { rows: detailRows } = await client.query(detailInsertSql, detailParams);
          insertedDetails.push(detailRows[0]);
        }

        // 3. Insert initial Pending order_status_history record
        const historyInsertSql = `
          INSERT INTO order_status_history (
            order_id,
            previous_status,
            new_status,
            changed_by_user_id,
            change_reason
          ) VALUES ($1, NULL, 'Pending', $2, 'Order placed by guest via in-room dining mobile app')
          RETURNING *;
        `;
        const { rows: historyRows } = await client.query(historyInsertSql, [orderId, customerId]);

        // 4. Commit transaction
        await client.query('COMMIT');

        return formatOrder(createdOrder, insertedDetails, historyRows);
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          // Safe handling: ignore rollback error if connection was dropped
        }

        // Detect PostgreSQL unique constraint violation on order_code (error code '23505')
        const isOrderCodeCollision =
          error.code === '23505' &&
          (error.constraint === 'orders_order_code_key' ||
            (error.detail && error.detail.includes('order_code')) ||
            (error.message && error.message.includes('orders_order_code_key')));

        if (isOrderCodeCollision && attempt < maxRetries) {
          currentOrderCode = generateOrderCode();
          continue;
        }

        throw error;
      } finally {
        client.release();
      }
    }
  }

  /**
   * Find order by primary key (order_id) with line items and status history.
   *
   * @param {number} orderId
   * @returns {Promise<Object|null>}
   */
  static async findById(orderId) {
    const orderSql = `SELECT * FROM orders WHERE order_id = $1;`;
    const detailsSql = `SELECT * FROM order_details WHERE order_id = $1 ORDER BY order_detail_id ASC;`;
    const historySql = `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY history_id ASC;`;

    const { rows: orderRows } = await db.query(orderSql, [orderId]);
    if (orderRows.length === 0) return null;

    const { rows: detailRows } = await db.query(detailsSql, [orderId]);
    const { rows: historyRows } = await db.query(historySql, [orderId]);

    return formatOrder(orderRows[0], detailRows, historyRows);
  }

  /**
   * Find order by unique human-friendly order code.
   *
   * @param {string} orderCode
   * @returns {Promise<Object|null>}
   */
  static async findByCode(orderCode) {
    const orderSql = `SELECT * FROM orders WHERE order_code = $1;`;
    const { rows: orderRows } = await db.query(orderSql, [orderCode]);
    if (orderRows.length === 0) return null;

    const orderId = orderRows[0].order_id;
    const detailsSql = `SELECT * FROM order_details WHERE order_id = $1 ORDER BY order_detail_id ASC;`;
    const historySql = `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY history_id ASC;`;

    const { rows: detailRows } = await db.query(detailsSql, [orderId]);
    const { rows: historyRows } = await db.query(historySql, [orderId]);

    return formatOrder(orderRows[0], detailRows, historyRows);
  }

  /**
   * Find safe, minimal order tracking projection by unique order code.
   * Returns ONLY public progress fields (order_code, status, estimated_delivery_minutes,
   * created_at, and item_count).
   *
   * STRICT PRIVACY GUARANTEE:
   * Does NOT select or expose room numbers, room names, guest customer IDs,
   * special delivery notes, pricing totals, item names, dish prices, or internal audit logs.
   *
   * @param {string} orderCode - Validated order code (e.g. 'ORD-20261121-7F3A2B')
   * @returns {Promise<Object|null>}
   */
  static async findTrackingByCode(orderCode) {
    const queryText = `
      SELECT 
        o.order_code,
        o.status,
        o.estimated_delivery_minutes,
        o.created_at,
        COALESCE(COUNT(d.order_detail_id), 0)::int AS item_count
      FROM orders o
      LEFT JOIN order_details d ON o.order_id = d.order_id
      WHERE o.order_code = $1
      GROUP BY o.order_id, o.order_code, o.status, o.estimated_delivery_minutes, o.created_at;
    `;
    const { rows } = await db.query(queryText, [orderCode]);
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      order_code: row.order_code,
      status: row.status,
      estimated_delivery_minutes: row.estimated_delivery_minutes,
      created_at: row.created_at,
      item_count: typeof row.item_count === 'number' ? row.item_count : parseInt(row.item_count, 10) || 0,
    };
  }

  /**
   * Find safe, minimal order tracking projections for multiple order codes in a single query.
   * Returns ONLY the approved five public fields per order:
   * (order_code, status, estimated_delivery_minutes, created_at, item_count).
   *
   * STRICT PRIVACY GUARANTEE:
   * Does NOT select or expose room numbers, room names, guest customer IDs,
   * special delivery notes, pricing totals, item names, dish prices, or internal audit logs.
   *
   * @param {Array<string>} orderCodes - Array of validated order codes (1 to 10 codes)
   * @returns {Promise<Array<Object>>}
   */
  static async findBatchTrackingByCodes(orderCodes) {
    if (!Array.isArray(orderCodes) || orderCodes.length === 0) {
      return [];
    }

    const queryText = `
      SELECT 
        o.order_code,
        o.status,
        o.estimated_delivery_minutes,
        o.created_at,
        COALESCE(COUNT(d.order_detail_id), 0)::int AS item_count
      FROM orders o
      LEFT JOIN order_details d ON o.order_id = d.order_id
      WHERE o.order_code = ANY($1::text[])
      GROUP BY o.order_id, o.order_code, o.status, o.estimated_delivery_minutes, o.created_at
      ORDER BY o.created_at DESC;
    `;

    const { rows } = await db.query(queryText, [orderCodes]);

    return rows.map((row) => ({
      order_code: row.order_code,
      status: row.status,
      estimated_delivery_minutes: row.estimated_delivery_minutes,
      created_at: row.created_at,
      item_count: typeof row.item_count === 'number' ? row.item_count : parseInt(row.item_count, 10) || 0,
    }));
  }

  /**
   * All allowed statuses matching PostgreSQL constraint.
   */
  static get ALL_STATUSES() {
    return ALL_STATUSES;
  }

  /**
   * State machine valid transitions lookup map.
   */
  static get VALID_STATUS_TRANSITIONS() {
    return VALID_STATUS_TRANSITIONS;
  }

  /**
   * Atomically transitions an order's status and records an audit log entry.
   *
   * Enforces:
   * - Strict state machine transition rules.
   * - Terminal state protection ('Delivered' and 'Cancelled' cannot be transitioned).
   * - Meaningful cancellation reason requirement when cancelling from 'In Kitchen' (min 5 chars).
   * - Concurrency protection via row-level locking (SELECT ... FOR UPDATE).
   * - ACID transaction atomicity across orders and order_status_history tables.
   * - Nullable changed_by_user_id (no untrusted client identities accepted).
   *
   * @param {Object} params
   * @param {number} [params.orderId] - Order database ID (if provided)
   * @param {string} [params.orderCode] - Unique order code (if provided)
   * @param {string} params.nextStatus - Target status to transition into
   * @param {string} [params.changeReason] - Reason for status change (required if cancelling from In Kitchen)
   * @param {string|null} [params.changedByUserId=null] - Optional staff/user ID (nullable)
   * @returns {Promise<Object>} Transition result
   */
  static async transitionStatus({
    orderId,
    orderCode,
    nextStatus,
    changeReason = null,
    changedByUserId = null,
  }) {
    if (!orderId && !orderCode) {
      const err = new Error('Either orderId or orderCode must be provided to transition status.');
      err.code = 'INVALID_ARGUMENT';
      throw err;
    }

    if (!nextStatus || typeof nextStatus !== 'string' || !ALL_STATUSES.includes(nextStatus.trim())) {
      const err = new Error(`Invalid target status "${nextStatus}". Allowed statuses: ${ALL_STATUSES.join(', ')}.`);
      err.code = 'INVALID_STATUS';
      throw err;
    }

    const targetStatus = nextStatus.trim();
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Lock the order row exclusively to prevent concurrent transition race conditions
      const lockSql = orderId
        ? `SELECT order_id, order_code, status FROM orders WHERE order_id = $1 FOR UPDATE;`
        : `SELECT order_id, order_code, status FROM orders WHERE order_code = $1 FOR UPDATE;`;
      const lockParam = orderId ? [orderId] : [orderCode.trim().toUpperCase()];

      const { rows: lockRows } = await client.query(lockSql, lockParam);

      if (lockRows.length === 0) {
        const err = new Error(`Order not found for status transition.`);
        err.code = 'ORDER_NOT_FOUND';
        throw err;
      }

      const lockedOrder = lockRows[0];
      const currentStatus = lockedOrder.status;
      const targetOrderId = lockedOrder.order_id;
      const resolvedOrderCode = lockedOrder.order_code;

      // 2. Enforce Terminal State Rule ('Delivered' and 'Cancelled' are terminal)
      if (currentStatus === 'Delivered' || currentStatus === 'Cancelled') {
        const err = new Error(
          `Cannot transition order ${resolvedOrderCode}: "${currentStatus}" is a terminal state and cannot be modified.`
        );
        err.code = 'TERMINAL_STATE';
        err.currentStatus = currentStatus;
        throw err;
      }

      // 3. Check State Transition Whitelist
      const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedTransitions.includes(targetStatus)) {
        const err = new Error(
          `Invalid status transition for order ${resolvedOrderCode}: Cannot transition from "${currentStatus}" to "${targetStatus}". Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none (terminal)'}.`
        );
        err.code = 'INVALID_TRANSITION';
        err.currentStatus = currentStatus;
        err.nextStatus = targetStatus;
        throw err;
      }

      // 4. Require Meaningful Cancellation Reason when cancelling from 'In Kitchen'
      const trimmedReason = typeof changeReason === 'string' ? changeReason.trim() : '';
      if (currentStatus === 'In Kitchen' && targetStatus === 'Cancelled') {
        if (!trimmedReason || trimmedReason.length < 5) {
          const err = new Error(
            'A meaningful cancellation reason (minimum 5 characters) is required when cancelling an order that is already In Kitchen.'
          );
          err.code = 'REASON_REQUIRED';
          throw err;
        }
      }

      // Format default reason if omitted for standard progress transitions
      const validatedReason = trimmedReason.length > 0
        ? trimmedReason.slice(0, 255)
        : `Status transitioned from ${currentStatus} to ${targetStatus}`;

      // Validate changedByUserId (keep nullable, max 64 chars)
      const validatedChangedBy =
        typeof changedByUserId === 'string' && changedByUserId.trim().length > 0
          ? changedByUserId.trim().slice(0, 64)
          : null;

      // 5. Update orders table status & updated_at
      const updateOrderSql = `
        UPDATE orders
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $2
        RETURNING *;
      `;
      const { rows: updatedRows } = await client.query(updateOrderSql, [targetStatus, targetOrderId]);
      const updatedOrder = updatedRows[0];

      // 6. Insert audit log record in order_status_history
      const historyInsertSql = `
        INSERT INTO order_status_history (
          order_id,
          previous_status,
          new_status,
          changed_by_user_id,
          change_reason
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const historyParams = [
        targetOrderId,
        currentStatus,
        targetStatus,
        validatedChangedBy,
        validatedReason,
      ];
      const { rows: historyRows } = await client.query(historyInsertSql, historyParams);
      const createdHistory = historyRows[0];

      // 7. Commit atomic transaction
      await client.query('COMMIT');

      return {
        order_id: targetOrderId,
        order_code: resolvedOrderCode,
        previous_status: currentStatus,
        status: targetStatus,
        updated_at: updatedOrder.updated_at,
        history: {
          history_id: createdHistory.history_id,
          previous_status: createdHistory.previous_status,
          new_status: createdHistory.new_status,
          changed_by_user_id: createdHistory.changed_by_user_id,
          change_reason: createdHistory.change_reason,
          created_at: createdHistory.created_at,
        },
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        // Safe handling: ignore rollback error if connection dropped
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find orders for an authenticated customer/guest with deterministic ordering,
   * batch-loaded line items, and pagination metadata.
   *
   * @param {string|number} customerId - Verified customer identifier
   * @param {Object} [options={}]
   * @param {number} [options.page=1] - 1-based page index
   * @param {number} [options.limit=10] - Number of items per page (max 50)
   * @param {string} [options.status] - Optional status filter
   * @returns {Promise<{ orders: Array<Object>, total: number, page: number, limit: number, totalPages: number }>}
   */
  static async findByCustomerId(customerId, { page = 1, limit = 10, status } = {}) {
    if (customerId === undefined || customerId === null || String(customerId).trim().length === 0) {
      return { orders: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }

    const normalizedCustomerId = String(customerId).trim();
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (safePage - 1) * safeLimit;

    const conditions = ['customer_id = $1'];
    const params = [normalizedCustomerId];

    if (status && typeof status === 'string' && status.trim().length > 0) {
      params.push(status.trim());
      conditions.push(`status = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 1. Get total matching count
    const countSql = `SELECT COUNT(*)::int AS total FROM orders ${whereClause};`;
    const { rows: countRows } = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / safeLimit) || 0;

    if (total === 0) {
      return { orders: [], total: 0, page: safePage, limit: safeLimit, totalPages: 0 };
    }

    // 2. Select paginated orders with deterministic ordering
    const queryParams = [...params, safeLimit, offset];
    const selectSql = `
      SELECT *
      FROM orders
      ${whereClause}
      ORDER BY created_at DESC, order_id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    const { rows: orderRows } = await db.query(selectSql, queryParams);

    if (orderRows.length === 0) {
      return { orders: [], total, page: safePage, limit: safeLimit, totalPages };
    }

    // 3. Batch load line items (prevent N+1 queries)
    const orderIds = orderRows.map((o) => o.order_id);
    const detailsSql = `
      SELECT *
      FROM order_details
      WHERE order_id = ANY($1::int[])
      ORDER BY order_id ASC, order_detail_id ASC;
    `;
    const { rows: detailRows } = await db.query(detailsSql, [orderIds]);

    const detailsByOrderId = new Map();
    for (const d of detailRows) {
      if (!detailsByOrderId.has(d.order_id)) {
        detailsByOrderId.set(d.order_id, []);
      }
      detailsByOrderId.get(d.order_id).push({
        order_detail_id: d.order_detail_id,
        order_id: d.order_id,
        item_id: d.item_id,
        item_name: d.item_name,
        unit_price: parseFloat(d.unit_price),
        quantity: d.quantity,
        line_total: parseFloat(d.line_total),
        created_at: d.created_at,
      });
    }

    // 4. Map to clean receipt format
    const orders = orderRows.map((row) => ({
      order_id: row.order_id,
      order_code: row.order_code,
      room_number: row.room_number,
      room_name: row.room_name,
      customer_id: row.customer_id,
      special_note: row.special_note,
      subtotal: parseFloat(row.subtotal),
      service_charge: parseFloat(row.service_charge),
      total_amount: parseFloat(row.total_amount),
      status: row.status,
      estimated_delivery_minutes: row.estimated_delivery_minutes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      items: detailsByOrderId.get(row.order_id) || [],
    }));

    return {
      orders,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  }

  /**
   * Find all resort orders with flexible filtering, deterministic ordering,
   * batch-loaded line items, status history, and pagination metadata (Staff & Admin).
   *
   * @param {Object} [filters={}]
   * @param {string} [filters.status] - Filter by order status
   * @param {string} [filters.room] - Filter by room number or name
   * @param {string} [filters.date] - Filter by date (YYYY-MM-DD)
   * @param {string} [filters.search] - Search by order_code or room_name
   * @param {Object} [options={}]
   * @param {number} [options.page=1] - 1-based page index
   * @param {number} [options.limit=20] - Number of items per page (max 100)
   * @returns {Promise<{ orders: Array<Object>, total: number, page: number, limit: number, totalPages: number }>}
   */
  static async findAll(filters = {}, { page = 1, limit = 20 } = {}) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];
    const params = [];

    if (filters.status && typeof filters.status === 'string' && filters.status.trim().length > 0) {
      params.push(filters.status.trim());
      conditions.push(`status = $${params.length}`);
    }

    if (filters.room && typeof filters.room === 'string' && filters.room.trim().length > 0) {
      params.push(`%${filters.room.trim()}%`);
      conditions.push(`(room_number ILIKE $${params.length} OR room_name ILIKE $${params.length})`);
    }

    if (filters.date && typeof filters.date === 'string' && filters.date.trim().length > 0) {
      params.push(filters.date.trim());
      conditions.push(`DATE(created_at) = $${params.length}::date`);
    }

    if (filters.search && typeof filters.search === 'string' && filters.search.trim().length > 0) {
      params.push(`%${filters.search.trim()}%`);
      conditions.push(`(order_code ILIKE $${params.length} OR room_name ILIKE $${params.length} OR room_number ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Total matching count
    const countSql = `SELECT COUNT(*)::int AS total FROM orders ${whereClause};`;
    const { rows: countRows } = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / safeLimit) || 0;

    if (total === 0) {
      return { orders: [], total: 0, page: safePage, limit: safeLimit, totalPages: 0 };
    }

    // 2. Select paginated orders with deterministic ordering
    const queryParams = [...params, safeLimit, offset];
    const selectSql = `
      SELECT *
      FROM orders
      ${whereClause}
      ORDER BY created_at DESC, order_id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    const { rows: orderRows } = await db.query(selectSql, queryParams);

    if (orderRows.length === 0) {
      return { orders: [], total, page: safePage, limit: safeLimit, totalPages };
    }

    // 3. Batch load line items and status history (prevent N+1 queries)
    const orderIds = orderRows.map((o) => o.order_id);

    const detailsSql = `
      SELECT *
      FROM order_details
      WHERE order_id = ANY($1::int[])
      ORDER BY order_id ASC, order_detail_id ASC;
    `;
    const historySql = `
      SELECT *
      FROM order_status_history
      WHERE order_id = ANY($1::int[])
      ORDER BY order_id ASC, history_id ASC;
    `;

    const [{ rows: detailRows }, { rows: historyRows }] = await Promise.all([
      db.query(detailsSql, [orderIds]),
      db.query(historySql, [orderIds]),
    ]);

    const detailsByOrderId = new Map();
    for (const d of detailRows) {
      if (!detailsByOrderId.has(d.order_id)) {
        detailsByOrderId.set(d.order_id, []);
      }
      detailsByOrderId.get(d.order_id).push({
        order_detail_id: d.order_detail_id,
        order_id: d.order_id,
        item_id: d.item_id,
        item_name: d.item_name,
        unit_price: parseFloat(d.unit_price),
        quantity: d.quantity,
        line_total: parseFloat(d.line_total),
        created_at: d.created_at,
      });
    }

    const historyByOrderId = new Map();
    for (const h of historyRows) {
      if (!historyByOrderId.has(h.order_id)) {
        historyByOrderId.set(h.order_id, []);
      }
      historyByOrderId.get(h.order_id).push({
        history_id: h.history_id,
        order_id: h.order_id,
        previous_status: h.previous_status,
        new_status: h.new_status,
        changed_by_user_id: h.changed_by_user_id,
        change_reason: h.change_reason,
        created_at: h.created_at,
      });
    }

    // 4. Map to complete staff management order format
    const orders = orderRows.map((row) => ({
      order_id: row.order_id,
      order_code: row.order_code,
      room_number: row.room_number,
      room_name: row.room_name,
      customer_id: row.customer_id,
      special_note: row.special_note,
      subtotal: parseFloat(row.subtotal),
      service_charge: parseFloat(row.service_charge),
      total_amount: parseFloat(row.total_amount),
      status: row.status,
      estimated_delivery_minutes: row.estimated_delivery_minutes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      items: detailsByOrderId.get(row.order_id) || [],
      status_history: historyByOrderId.get(row.order_id) || [],
    }));

    return {
      orders,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  }
}

module.exports = OrderModel;
