const crypto = require('crypto');
const db = require('../config/db');

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
        await client.query('ROLLBACK');

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
}

module.exports = OrderModel;
