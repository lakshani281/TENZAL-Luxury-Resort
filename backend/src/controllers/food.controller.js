const Category = require('../models/category.model');
const FoodItem = require('../models/foodItem.model');
const Order = require('../models/order.model');
const db = require('../config/db');

/**
 * Controller: Get Food Categories
 * GET /api/food/categories
 *
 * Query Parameters:
 * - all: boolean string ('true' to include inactive categories, defaults to false)
 */
async function getCategories(req, res) {
  try {
    const includeInactive = String(req.query.all || '').trim().toLowerCase() === 'true';
    const categories = await Category.findAll({ includeInactive });

    return res.status(200).json({
      status: 'success',
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Error in getCategories:', error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve food categories. Please try again later.',
    });
  }
}

/**
 * Controller: Get Food Items
 * GET /api/food/items
 *
 * Query Parameters:
 * - category_id: positive integer filter
 * - category_slug: string filter
 * - available: 'true', 'false', or 'all' (default: 'true')
 * - search / q: search across name, subtitle, and description
 */
async function getFoodItems(req, res) {
  try {
    let categoryId;
    if (req.query.category_id !== undefined) {
      const rawCatId = String(req.query.category_id).trim();
      const parsedCatId = Number(rawCatId);
      if (!/^\d+$/.test(rawCatId) || !Number.isInteger(parsedCatId) || parsedCatId <= 0) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'Invalid category_id parameter. Must be a positive integer.',
        });
      }
      categoryId = parsedCatId;
    }

    let categorySlug;
    if (req.query.category_slug !== undefined) {
      const rawSlug = String(req.query.category_slug).trim();
      if (!rawSlug) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'Invalid category_slug parameter. Cannot be empty.',
        });
      }
      categorySlug = rawSlug;
    }

    let available = 'true';
    if (req.query.available !== undefined) {
      const rawAvail = String(req.query.available).trim().toLowerCase();
      if (!['true', 'false', 'all'].includes(rawAvail)) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: "Invalid available parameter. Allowed values are 'true', 'false', or 'all'.",
        });
      }
      available = rawAvail;
    }

    let search;
    const rawSearch = req.query.search !== undefined ? req.query.search : req.query.q;
    if (rawSearch !== undefined) {
      if (typeof rawSearch !== 'string') {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'Invalid search parameter. Must be a string.',
        });
      }
      const trimmedSearch = rawSearch.trim();
      if (trimmedSearch.length > 0) {
        search = trimmedSearch;
      }
    }

    const items = await FoodItem.findAll({
      categoryId,
      categorySlug,
      available,
      search,
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Error in getFoodItems:', error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve food items. Please try again later.',
    });
  }
}

/**
 * Controller: Get Single Food Item by ID
 * GET /api/food/items/:id
 *
 * Route Parameters:
 * - id: positive integer
 */
async function getFoodItemById(req, res) {
  try {
    const rawId = req.params.id;
    const parsedId = Number(rawId);

    if (!rawId || !/^\d+$/.test(String(rawId).trim()) || !Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid food item ID. ID must be a positive integer.',
      });
    }

    const item = await FoodItem.findById(parsedId);

    if (!item) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: `Food item with ID ${parsedId} not found.`,
      });
    }

    return res.status(200).json({
      status: 'success',
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error in getFoodItemById:', error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve food item. Please try again later.',
    });
  }
}

/**
 * Controller: Get Active Daily Specials
 * GET /api/food/specials
 *
 * Query Parameters:
 * - category_id: optional positive integer
 * - category_slug: optional string
 */
async function getDailySpecials(req, res) {
  try {
    let categoryId;
    if (req.query.category_id !== undefined) {
      const rawCatId = String(req.query.category_id).trim();
      const parsedCatId = Number(rawCatId);
      if (!/^\d+$/.test(rawCatId) || !Number.isInteger(parsedCatId) || parsedCatId <= 0) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'Invalid category_id parameter. Must be a positive integer.',
        });
      }
      categoryId = parsedCatId;
    }

    let categorySlug;
    if (req.query.category_slug !== undefined) {
      const rawSlug = String(req.query.category_slug).trim();
      if (!rawSlug) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'Invalid category_slug parameter. Cannot be empty.',
        });
      }
      categorySlug = rawSlug;
    }

    const specials = await FoodItem.findDailySpecials({
      categoryId,
      categorySlug,
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      count: specials.length,
      data: specials,
    });
  } catch (error) {
    console.error('Error in getDailySpecials:', error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve daily specials. Please try again later.',
    });
  }
}

/**
 * Approved resort delivery rooms (strictly verified 3 rooms)
 */
const APPROVED_ROOMS = {
  'Room 3': 'Uva Valley View Room — Room 3',
  'Room 4': 'Bridal Suite, Uva Valley — Room 4',
  'Room 5': 'Indian Ocean View Room — Room 5',
};

/**
 * Normalizes room strings for lenient dash comparison (em-dash, en-dash, hyphen).
 *
 * @param {string} str
 * @returns {string}
 */
function normalizeRoomString(str) {
  return String(str || '')
    .replace(/[\u2014\u2013-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Controller: Create In-Room Dining Order
 * POST /api/food/orders
 *
 * Body Parameters:
 * - room_number: string ('Room 3', 'Room 4', or 'Room 5')
 * - room_name: string (matching verified room name)
 * - special_note: optional string (max 500 chars)
 * - items: array of { item_id: number, quantity: number }
 */
async function createOrder(req, res) {
  try {
    const { room_number, room_name, special_note, items, customer_id } = req.body || {};

    // 1. Validate room_number
    if (!room_number || typeof room_number !== 'string' || !room_number.trim()) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'room_number is required and must be a valid room string.',
      });
    }

    const trimmedRoomNumber = room_number.trim();
    const approvedCanonicalRoomName = APPROVED_ROOMS[trimmedRoomNumber];

    if (!approvedCanonicalRoomName) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid room_number. In-room dining delivery is available exclusively to Room 3, Room 4, and Room 5.',
      });
    }

    // 2. Validate room_name
    if (!room_name || typeof room_name !== 'string' || !room_name.trim()) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'room_name is required.',
      });
    }

    if (normalizeRoomString(room_name) !== normalizeRoomString(approvedCanonicalRoomName)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: `Invalid room_name. Room name does not match the approved room name for ${trimmedRoomNumber} (Expected: "${approvedCanonicalRoomName}").`,
      });
    }

    // 3. Validate special_note (optional string, max 500 chars)
    let validatedSpecialNote = null;
    if (special_note !== undefined && special_note !== null) {
      if (typeof special_note !== 'string') {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'special_note must be a string.',
        });
      }
      const trimmedNote = special_note.trim();
      if (trimmedNote.length > 500) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'special_note exceeds maximum allowed length of 500 characters.',
        });
      }
      validatedSpecialNote = trimmedNote.length > 0 ? trimmedNote : null;
    }

    // 4. Validate customer_id (optional string placeholder for User Management module, max 64 chars)
    let validatedCustomerId = null;
    if (customer_id !== undefined && customer_id !== null) {
      if (typeof customer_id !== 'string') {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'customer_id must be a string.',
        });
      }
      const trimmedCustId = customer_id.trim();
      if (trimmedCustId.length > 64) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'customer_id exceeds maximum allowed length of 64 characters.',
        });
      }
      validatedCustomerId = trimmedCustId.length > 0 ? trimmedCustId : null;
    }

    // 5. Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Cart must contain at least one item.',
      });
    }

    // Safely combine duplicate item IDs while enforcing quantity limits
    const itemMap = new Map();
    for (let i = 0; i < items.length; i++) {
      const raw = items[i];
      if (!raw || typeof raw !== 'object') {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: `Invalid item format at index ${i}. Item must be an object with item_id and quantity.`,
        });
      }

      const rawId = raw.item_id !== undefined ? raw.item_id : raw.id;
      const parsedId = Number(rawId);
      if (!rawId || !/^\d+$/.test(String(rawId).trim()) || !Number.isInteger(parsedId) || parsedId <= 0) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: `Invalid item_id at index ${i}. Item ID must be a positive integer.`,
        });
      }

      const rawQty = raw.quantity !== undefined ? raw.quantity : raw.qty;
      const parsedQty = Number(rawQty);
      if (
        rawQty === undefined ||
        rawQty === null ||
        !/^\d+$/.test(String(rawQty).trim()) ||
        !Number.isInteger(parsedQty) ||
        parsedQty < 1 ||
        parsedQty > 50
      ) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: `Invalid quantity for item ${parsedId}. Quantity must be an integer between 1 and 50.`,
        });
      }

      const currentQty = itemMap.get(parsedId) || 0;
      const combinedQty = currentQty + parsedQty;
      if (combinedQty > 50) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: `Combined quantity for item ${parsedId} (${combinedQty}) exceeds maximum allowed quantity of 50.`,
        });
      }
      itemMap.set(parsedId, combinedQty);
    }

    // 6. Retrieve authoritative items from database (never trust client prices)
    const itemIds = Array.from(itemMap.keys());
    const querySql = `
      SELECT 
        fi.item_id,
        fi.name,
        fi.price,
        fi.prep_time_minutes,
        fi.is_available,
        fi.is_special,
        fi.special_start_at,
        fi.special_end_at,
        fc.is_active AS category_is_active
      FROM food_items fi
      JOIN food_categories fc ON fi.category_id = fc.category_id
      WHERE fi.item_id = ANY($1::int[]);
    `;
    const { rows: dbItems } = await db.query(querySql, [itemIds]);
    const dbItemMap = new Map(dbItems.map((it) => [it.item_id, it]));

    // Validate availability, existence, and daily special windows
    for (const itemId of itemIds) {
      const dbItem = dbItemMap.get(itemId);
      if (!dbItem || !dbItem.category_is_active) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: `Food item with ID ${itemId} does not exist or is currently inactive.`,
        });
      }

      if (!dbItem.is_available) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: `Food item "${dbItem.name}" is currently sold out and cannot be ordered.`,
        });
      }

      // Check daily special active window
      if (dbItem.is_special) {
        const now = new Date();
        if (dbItem.special_start_at && new Date(dbItem.special_start_at) > now) {
          return res.status(400).json({
            status: 'error',
            success: false,
            message: `Daily special "${dbItem.name}" is not yet active.`,
          });
        }
        if (dbItem.special_end_at && new Date(dbItem.special_end_at) < now) {
          return res.status(400).json({
            status: 'error',
            success: false,
            message: `Daily special "${dbItem.name}" is no longer active (special window ended).`,
          });
        }
      }
    }

    // 7. Calculate line totals and grand totals using integer cents arithmetic
    let subtotalCents = 0;
    const prepTimes = [];
    const orderItems = [];

    for (const [itemId, quantity] of itemMap.entries()) {
      const dbItem = dbItemMap.get(itemId);
      const priceNum = parseFloat(dbItem.price);
      const unitPriceCents = Math.round(priceNum * 100);
      const lineTotalCents = unitPriceCents * quantity;

      subtotalCents += lineTotalCents;
      prepTimes.push(dbItem.prep_time_minutes || 20);

      orderItems.push({
        item_id: dbItem.item_id,
        item_name: dbItem.name,
        unit_price: (unitPriceCents / 100).toFixed(2),
        quantity,
        line_total: (lineTotalCents / 100).toFixed(2),
      });
    }

    // 10% service charge rounded to nearest cent
    const serviceChargeCents = Math.round(subtotalCents * 0.1);
    const grandTotalCents = subtotalCents + serviceChargeCents;

    const subtotal = (subtotalCents / 100).toFixed(2);
    const serviceCharge = (serviceChargeCents / 100).toFixed(2);
    const totalAmount = (grandTotalCents / 100).toFixed(2);

    // Estimated delivery turnaround: max(prep_time) + 10 min room delivery transit, min 30 min
    const maxPrepTime = prepTimes.length > 0 ? Math.max(...prepTimes) : 20;
    const estimatedDeliveryMinutes = Math.max(30, maxPrepTime + 10);

    // 8. Generate unique order code & create order in a single transaction
    const orderCode = Order.generateCode();
    const createdOrder = await Order.create({
      orderCode,
      roomNumber: trimmedRoomNumber,
      roomName: approvedCanonicalRoomName,
      customerId: validatedCustomerId,
      specialNote: validatedSpecialNote,
      subtotal,
      serviceCharge,
      totalAmount,
      estimatedDeliveryMinutes,
      items: orderItems,
    });

    return res.status(201).json({
      status: 'success',
      success: true,
      message: 'In-room dining order placed successfully.',
      data: createdOrder,
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to create in-room dining order. Please try again later.',
    });
  }
}

/**
 * Controller: Get Single Order by Internal Database ID
 * GET /api/food/orders/:id
 *
 * SECURITY & PRIVACY SPECIFICATION:
 * Access to full order details by internal database integer ID exposes sensitive
 * guest data (room assignment, delivery notes, dish items, and internal audit history).
 * Anonymous access is strictly BLOCKED with HTTP 401 Unauthorized until User Management
 * (Student ID: 22CIS0274) delivers JWT authentication and role authorization middleware.
 *
 * NOTE: For public guest order progress tracking, clients MUST use:
 * GET /api/food/orders/code/:order_code
 */
async function getOrderById(req, res) {
  return res.status(401).json({
    status: 'error',
    success: false,
    message: 'Authentication required. Full order details cannot be accessed anonymously. For public order progress tracking, please use /api/food/orders/code/:order_code.',
  });
}

/**
 * Controller: Get Safe Public Order Progress Tracking by Order Code
 * GET /api/food/orders/code/:order_code
 *
 * Strict Privacy & Security Specification:
 * - Rate limited by orderTrackingRateLimiter (max 30 req/min per IP)
 * - Validates format against /^ORD-\d{8}-[A-F0-9]{6}$/ before querying DB
 * - Exposes ONLY public progress indicators (order_code, status, estimated_delivery_minutes, created_at, item_count)
 * - NEVER leaks room details, customer_id, special_note, financial totals, dish names, or internal staff history
 */
async function getOrderTrackingByCode(req, res) {
  try {
    const rawCode = req.params.order_code;
    const normalizedCode = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';

    const ORDER_CODE_REGEX = /^ORD-\d{8}-[A-F0-9]{6}$/;
    if (!normalizedCode || !ORDER_CODE_REGEX.test(normalizedCode)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid order code format. Expected format: ORD-YYYYMMDD-XXXXXX (e.g. ORD-20261121-7F3A2B).',
      });
    }

    const tracking = await Order.findTrackingByCode(normalizedCode);

    if (!tracking) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: `Order with code "${normalizedCode}" not found.`,
      });
    }

    return res.status(200).json({
      status: 'success',
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error('Error in getOrderTrackingByCode:', error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve order tracking information. Please try again later.',
    });
  }
}

/**
 * Controller: Get Batch Public Order Progress Tracking
 * POST /api/food/orders/tracking/batch
 *
 * Request Body:
 * - order_codes: Array of 1 to 10 order codes (e.g. ['ORD-20261121-7F3A2B', ...])
 *
 * Strict Privacy & Security Specification:
 * - Rate limited by orderTrackingRateLimiter (shared 30 req/min per IP)
 * - Requires an array between 1 and 10 codes
 * - Normalizes codes to uppercase and validates format against /^ORD-\d{8}-[A-F0-9]{6}$/
 * - Exposes ONLY public progress indicators (order_code, status, estimated_delivery_minutes, created_at, item_count)
 * - NEVER leaks room details, customer_id, special_note, financial totals, dish names, or internal staff history
 * - Avoids exposing guest identities or ownership
 */
async function getBatchOrderTracking(req, res) {
  try {
    const { order_codes } = req.body || {};

    if (!order_codes || !Array.isArray(order_codes)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'order_codes is required and must be an array of order codes.',
      });
    }

    if (order_codes.length === 0 || order_codes.length > 10) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'order_codes array must contain between 1 and 10 order codes.',
      });
    }

    const ORDER_CODE_REGEX = /^ORD-\d{8}-[A-F0-9]{6}$/;
    const normalizedCodes = [];

    for (let i = 0; i < order_codes.length; i++) {
      const code = order_codes[i];
      if (typeof code !== 'string') {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: `Invalid order code at index ${i}. Each order code must be a string.`,
        });
      }

      const trimmedCode = code.trim().toUpperCase();
      if (!ORDER_CODE_REGEX.test(trimmedCode)) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: `Invalid order code format at index ${i}: "${code}". Expected format: ORD-YYYYMMDD-XXXXXX.`,
        });
      }

      normalizedCodes.push(trimmedCode);
    }

    // Deduplicate codes while preserving order
    const uniqueCodes = Array.from(new Set(normalizedCodes));

    const trackingList = await Order.findBatchTrackingByCodes(uniqueCodes);

    return res.status(200).json({
      status: 'success',
      success: true,
      count: trackingList.length,
      data: trackingList,
    });
  } catch (error) {
    console.error('Error in getBatchOrderTracking:', error.message || error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve batch order tracking information. Please try again later.',
    });
  }
}

/**
 * Allowed target statuses for transition via staff update endpoint.
 * 'Pending' is the initial placement state and cannot be transitioned into.
 */
const ALLOWED_STAFF_TARGET_STATUSES = Object.freeze([
  'In Kitchen',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
]);

/**
 * Controller: Update Order Status (Staff Only)
 * PATCH /api/food/orders/code/:order_code/status
 *
 * SECURITY & AUTHENTICATION SPECIFICATION:
 * - Requires verified staff authentication from User Management (Student ID: 22CIS0274) JWT middleware.
 * - Strictly rejects unauthenticated requests (missing req.user or req.user.user_id) with HTTP 401.
 * - Strictly rejects non-staff roles (e.g. Guests) with HTTP 403.
 * - Strictly obtains changedByUserId from verified req.user.user_id.
 *   NEVER trusts req.body, req.query, req.params, or arbitrary headers (e.g. x-user-id).
 * - Enforces order code format /^ORD-\d{8}-[A-F0-9]{6}$/i.
 * - Atomically executes state transition and inserts order_status_history via Order.transitionStatus.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function updateOrderStatus(req, res) {
  try {
    // 1. Staff Authentication & Role Authorization Guard
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        status: 'error',
        success: false,
        message: 'Authentication required. Verified staff credentials must be provided via authentication middleware.',
      });
    }

    if (req.user.role && !['Staff', 'Admin', 'KitchenStaff', 'DeliveryStaff'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        success: false,
        message: 'Access denied. Staff privileges are required to update order status.',
      });
    }

    // 2. Validate order_code URL parameter
    const rawCode = req.params?.order_code;
    const normalizedCode = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
    const ORDER_CODE_REGEX = /^ORD-\d{8}-[A-F0-9]{6}$/i;

    if (!normalizedCode || !ORDER_CODE_REGEX.test(normalizedCode)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid order code format. Expected format: ORD-YYYYMMDD-XXXXXX (e.g. ORD-20261121-7F3A2B).',
      });
    }

    // 3. Validate body parameters
    const { status, change_reason, changeReason } = req.body || {};

    if (!status || typeof status !== 'string' || !ALLOWED_STAFF_TARGET_STATUSES.includes(status.trim())) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: `Invalid or missing status. Allowed target statuses: ${ALLOWED_STAFF_TARGET_STATUSES.join(', ')}.`,
      });
    }

    const targetStatus = status.trim();

    // 4. Validate change_reason (optional for progression, max 255 chars)
    const rawReason = change_reason !== undefined ? change_reason : changeReason;
    let validatedReason = null;

    if (rawReason !== undefined && rawReason !== null) {
      if (typeof rawReason !== 'string') {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'change_reason must be a string.',
        });
      }
      const trimmedReason = rawReason.trim();
      if (trimmedReason.length > 255) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'change_reason exceeds maximum allowed length of 255 characters.',
        });
      }
      validatedReason = trimmedReason.length > 0 ? trimmedReason : null;
    }

    // 5. Secure identity extraction: strictly req.user.user_id
    const changedByUserId = req.user.user_id;

    // 6. Execute atomic state machine transition
    const transitionResult = await Order.transitionStatus({
      orderCode: normalizedCode,
      nextStatus: targetStatus,
      changeReason: validatedReason,
      changedByUserId,
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      message: `Order ${normalizedCode} status successfully updated to "${transitionResult.status}".`,
      data: transitionResult,
    });
  } catch (error) {
    if (error.code === 'ORDER_NOT_FOUND') {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: error.message || `Order with code not found.`,
      });
    }

    if (error.code === 'TERMINAL_STATE') {
      return res.status(409).json({
        status: 'error',
        success: false,
        message: error.message,
        current_status: error.currentStatus,
      });
    }

    if (error.code === 'INVALID_TRANSITION') {
      return res.status(422).json({
        status: 'error',
        success: false,
        message: error.message,
        current_status: error.currentStatus,
        target_status: error.nextStatus,
      });
    }

    if (error.code === 'REASON_REQUIRED') {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: error.message,
      });
    }

    if (error.code === 'INVALID_STATUS' || error.code === 'INVALID_ARGUMENT') {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: error.message,
      });
    }

    console.error('Error in updateOrderStatus:', error.message || error);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to update order status. Please try again later.',
    });
  }
}

module.exports = {
  getCategories,
  getFoodItems,
  getFoodItemById,
  getDailySpecials,
  createOrder,
  getOrderById,
  getOrderTrackingByCode,
  getBatchOrderTracking,
  updateOrderStatus,
};
