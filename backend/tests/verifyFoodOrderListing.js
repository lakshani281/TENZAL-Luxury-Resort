/**
 * =============================================================================
 * TENZAL Luxury Resort - Food Ordering Listing APIs Test Suite
 * Student ID: 22CIS0328 (Food Ordering)
 * File: backend/tests/verifyFoodOrderListing.js
 * =============================================================================
 * Automated test suite verifying:
 * 1. Guest sees only their own orders (GET /api/food/orders/my-orders)
 * 2. Guest cannot request another user's order history
 * 3. Client-supplied customer_id in query or body is strictly ignored
 * 4. Anonymous access to my-orders returns 401 Unauthorized
 * 5. Staff can list all orders (GET /api/food/orders)
 * 6. Admin can list all orders (GET /api/food/orders)
 * 7. Guest cannot access staff listing (returns 403 Forbidden)
 * 8. Status filter works on my-orders and staff listing
 * 9. Room filter works on staff listing
 * 10. Date filter works on staff listing
 * 11. Search filter works on staff listing (order code and room name)
 * 12. Pagination works correctly (page, limit, total, totalPages)
 * 13. Invalid pagination values are handled safely
 * 14. Empty result returns a valid response (200 OK, count: 0, data: [])
 * 15. Existing checkout and public tracking still work
 *
 * SAFETY GUARANTEE:
 * Operates purely with local in-memory mocking and test HTTP server.
 * ZERO database writes are made to Supabase or external production database.
 * =============================================================================
 */

const http = require('http');
const jwt = require('jsonwebtoken');

// 1. Safe In-Memory Mocking for Database & Order Model
const foodDb = require('../src/config/db');
const authDb = require('../config/db');
const Order = require('../src/models/order.model');
const { JWT_SECRET } = require('../middleware/auth');

// Intercept authDb.query to provide instant, reliable user authentication without database waits
const originalAuthDbQuery = authDb.query;
authDb.query = async function (text, params) {
  if (typeof text === 'string' && text.includes('FROM users')) {
    const userId = params[0];
    if (userId === 4) {
      return { rows: [{ id: 4, name: 'Amelia Hart', email: 'amelia@example.com', role_id: 3, is_active: true, role: 'guest' }] };
    }
    if (userId === 5) {
      return { rows: [{ id: 5, name: 'Nimal Perera', email: 'nimal@email.com', role_id: 3, is_active: true, role: 'guest' }] };
    }
    if (userId === 2) {
      return { rows: [{ id: 2, name: 'Kasun Silva', email: 'kasun@tenzal.com', role_id: 2, is_active: true, role: 'staff' }] };
    }
    if (userId === 1) {
      return { rows: [{ id: 1, name: 'Nadeesha Perera', email: 'admin@tenzal.com', role_id: 1, is_active: true, role: 'admin' }] };
    }
    if (userId === 998) {
      return { rows: [{ id: 998, name: 'Empty Orders Guest', email: 'empty@example.com', role_id: 3, is_active: true, role: 'guest' }] };
    }
    if (userId === 999) {
      return { rows: [{ id: 999, name: 'Deactivated User', email: 'deactivated@example.com', role_id: 3, is_active: false, role: 'guest' }] };
    }
  }
  return originalAuthDbQuery.apply(this, arguments);
};

// Seed test orders for in-memory testing
const TEST_ORDERS = [
  {
    order_id: 101,
    order_code: 'ORD-20261120-AA1111',
    room_number: 'Room 3',
    room_name: 'Uva Valley View Room — Room 3',
    customer_id: '4', // Guest A (ID: 4)
    special_note: 'No spicy',
    subtotal: 5000.0,
    service_charge: 500.0,
    total_amount: 5500.0,
    status: 'Pending',
    estimated_delivery_minutes: 30,
    created_at: '2026-11-20T10:00:00.000Z',
    updated_at: '2026-11-20T10:00:00.000Z',
    items: [
      {
        order_detail_id: 1,
        order_id: 101,
        item_id: 6,
        item_name: 'Ceylon Spiced Black Pork Curry',
        unit_price: 2800.0,
        quantity: 1,
        line_total: 2800.0,
        created_at: '2026-11-20T10:00:00.000Z',
      },
    ],
    status_history: [
      {
        history_id: 1,
        order_id: 101,
        previous_status: null,
        new_status: 'Pending',
        changed_by_user_id: '4',
        change_reason: 'Order placed by guest',
        created_at: '2026-11-20T10:00:00.000Z',
      },
    ],
  },
  {
    order_id: 102,
    order_code: 'ORD-20261121-BB2222',
    room_number: 'Room 4',
    room_name: 'Ella Rock Panorama Suite — Room 4',
    customer_id: '4', // Guest A (ID: 4)
    special_note: null,
    subtotal: 8000.0,
    service_charge: 800.0,
    total_amount: 8800.0,
    status: 'In Kitchen',
    estimated_delivery_minutes: 25,
    created_at: '2026-11-21T12:00:00.000Z',
    updated_at: '2026-11-21T12:05:00.000Z',
    items: [
      {
        order_detail_id: 2,
        order_id: 102,
        item_id: 7,
        item_name: 'Seafood Nasi Goreng',
        unit_price: 4000.0,
        quantity: 2,
        line_total: 8000.0,
        created_at: '2026-11-21T12:00:00.000Z',
      },
    ],
    status_history: [
      {
        history_id: 2,
        order_id: 102,
        previous_status: 'Pending',
        new_status: 'In Kitchen',
        changed_by_user_id: '2',
        change_reason: 'Kitchen accepted order',
        created_at: '2026-11-21T12:05:00.000Z',
      },
    ],
  },
  {
    order_id: 103,
    order_code: 'ORD-20261121-CC3333',
    room_number: 'Room 5',
    room_name: 'Nine Skies Grand Pavilion — Room 5',
    customer_id: '5', // Guest B (ID: 5)
    special_note: 'Extra napkins',
    subtotal: 3500.0,
    service_charge: 350.0,
    total_amount: 3850.0,
    status: 'Delivered',
    estimated_delivery_minutes: 30,
    created_at: '2026-11-21T14:00:00.000Z',
    updated_at: '2026-11-21T14:40:00.000Z',
    items: [
      {
        order_detail_id: 3,
        order_id: 103,
        item_id: 8,
        item_name: 'Passion Fruit Cloud Pavlova',
        unit_price: 1750.0,
        quantity: 2,
        line_total: 3500.0,
        created_at: '2026-11-21T14:00:00.000Z',
      },
    ],
    status_history: [
      {
        history_id: 3,
        order_id: 103,
        previous_status: 'Out for Delivery',
        new_status: 'Delivered',
        changed_by_user_id: '2',
        change_reason: 'Delivered to room 5',
        created_at: '2026-11-21T14:40:00.000Z',
      },
    ],
  },
  {
    order_id: 104,
    order_code: 'ORD-20261121-DD4444',
    room_number: 'Room 3',
    room_name: 'Uva Valley View Room — Room 3',
    customer_id: null, // Anonymous checkout
    special_note: null,
    subtotal: 2800.0,
    service_charge: 280.0,
    total_amount: 3080.0,
    status: 'Cancelled',
    estimated_delivery_minutes: 30,
    created_at: '2026-11-21T15:00:00.000Z',
    updated_at: '2026-11-21T15:10:00.000Z',
    items: [
      {
        order_detail_id: 4,
        order_id: 104,
        item_id: 6,
        item_name: 'Ceylon Spiced Black Pork Curry',
        unit_price: 2800.0,
        quantity: 1,
        line_total: 2800.0,
        created_at: '2026-11-21T15:00:00.000Z',
      },
    ],
    status_history: [],
  },
];

// Mock database query method to intercept queries and return deterministic test results
foodDb.query = async function (text, params) {
  const sql = typeof text === 'string' ? text : '';

  // Intercept food item query for checkout test
  if (sql.includes('FROM food_items')) {
    return {
      rows: [
        {
          item_id: 6,
          name: 'Ceylon Spiced Black Pork Curry',
          price: '2800.00',
          prep_time_minutes: 25,
          is_available: true,
          is_special: false,
          special_start_at: null,
          special_end_at: null,
          category_is_active: true,
        },
      ],
    };
  }

  // Intercept users table check from User Management authenticate middleware
  if (sql.includes('FROM users WHERE id =')) {
    const userId = params[0];
    if (userId === 999) {
      // Deactivated user
      return { rows: [{ id: 999, role_id: 3, is_active: false }] };
    }
    const roleId = userId === 1 ? 1 : userId === 10 ? 2 : 3;
    return { rows: [{ id: userId, role_id: roleId, is_active: true }] };
  }

  // Intercept orders table queries
  if (sql.includes('FROM orders')) {
    let filtered = [...TEST_ORDERS];

    // Filter by customer_id
    if (sql.includes('customer_id = $1')) {
      const custId = params[0];
      filtered = filtered.filter((o) => o.customer_id === custId);
    }

    // Filter by status
    if (sql.includes('status = $')) {
      // Find the status parameter
      let statusParam = null;
      if (sql.includes('customer_id = $1 AND status = $2')) {
        statusParam = params[1];
      } else {
        const match = sql.match(/status = \$(\d+)/);
        if (match) {
          statusParam = params[parseInt(match[1], 10) - 1];
        }
      }
      if (statusParam) {
        filtered = filtered.filter((o) => o.status === statusParam);
      }
    }

    // Filter by room (when not search query)
    if (!sql.includes('order_code ILIKE') && (sql.includes('room_number ILIKE') || sql.includes('room_name ILIKE'))) {
      const match = sql.match(/room_number ILIKE \$(\d+)/);
      if (match) {
        const raw = params[parseInt(match[1], 10) - 1].replace(/%/g, '').toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.room_number.toLowerCase().includes(raw) ||
            o.room_name.toLowerCase().includes(raw)
        );
      }
    }

    // Filter by date
    if (sql.includes('DATE(created_at) = $')) {
      const match = sql.match(/DATE\(created_at\) = \$(\d+)/);
      if (match) {
        const dateStr = params[parseInt(match[1], 10) - 1];
        filtered = filtered.filter((o) => o.created_at.startsWith(dateStr));
      }
    }

    // Filter by search
    if (sql.includes('order_code ILIKE')) {
      const match = sql.match(/order_code ILIKE \$(\d+)/);
      if (match) {
        const raw = params[parseInt(match[1], 10) - 1].replace(/%/g, '').toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.order_code.toLowerCase().includes(raw) ||
            o.room_name.toLowerCase().includes(raw) ||
            o.room_number.toLowerCase().includes(raw)
        );
      }
    }

    // COUNT query
    if (sql.includes('COUNT(*)::int AS total')) {
      return { rows: [{ total: filtered.length }] };
    }

    // Order selection with LIMIT and OFFSET
    // Sort descending by created_at, order_id
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at) || b.order_id - a.order_id);

    const limitMatch = sql.match(/LIMIT \$(\d+)\s+OFFSET \$(\d+)/);
    if (limitMatch) {
      const limitVal = params[parseInt(limitMatch[1], 10) - 1];
      const offsetVal = params[parseInt(limitMatch[2], 10) - 1];
      const sliced = filtered.slice(offsetVal, offsetVal + limitVal);
      return { rows: sliced };
    }

    return { rows: filtered };
  }

  // Intercept order_details queries
  if (sql.includes('FROM order_details')) {
    const ids = params[0] || [];
    const allDetails = [];
    for (const o of TEST_ORDERS) {
      if (ids.includes(o.order_id)) {
        allDetails.push(...o.items);
      }
    }
    return { rows: allDetails };
  }

  // Intercept order_status_history queries
  if (sql.includes('FROM order_status_history')) {
    const ids = params[0] || [];
    const allHistory = [];
    for (const o of TEST_ORDERS) {
      if (ids.includes(o.order_id)) {
        allHistory.push(...o.status_history);
      }
    }
    return { rows: allHistory };
  }

  return { rows: [] };
};

// Mock Order.create for checkout verification
Order.create = async function (data) {
  return {
    order_id: 199,
    order_code: data.orderCode || 'ORD-20261121-NEW999',
    room_number: data.roomNumber,
    room_name: data.roomName,
    customer_id: data.customerId,
    special_note: data.specialNote,
    subtotal: parseFloat(data.subtotal),
    service_charge: parseFloat(data.serviceCharge),
    total_amount: parseFloat(data.totalAmount),
    status: 'Pending',
    estimated_delivery_minutes: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: data.items,
  };
};

// Mock Order.findById
Order.findById = async function (orderId) {
  const match = TEST_ORDERS.find((o) => o.order_id === Number(orderId));
  return match ? JSON.parse(JSON.stringify(match)) : null;
};

// Mock Order.findTrackingByCode
Order.findTrackingByCode = async function (orderCode) {
  const match = TEST_ORDERS.find((o) => o.order_code === String(orderCode).trim().toUpperCase());
  if (!match) return null;
  return {
    order_code: match.order_code,
    status: match.status,
    estimated_delivery_minutes: match.estimated_delivery_minutes,
    created_at: match.created_at,
    item_count: match.items.length,
  };
};

// Mock Order.findBatchTrackingByCodes
Order.findBatchTrackingByCodes = async function (codes) {
  const res = [];
  for (const c of codes) {
    const match = TEST_ORDERS.find((o) => o.order_code === String(c).trim().toUpperCase());
    if (match) {
      res.push({
        order_code: match.order_code,
        status: match.status,
        estimated_delivery_minutes: match.estimated_delivery_minutes,
        created_at: match.created_at,
        item_count: match.items.length,
      });
    }
  }
  return res;
};

// Express App Setup
const express = require('express');
const foodRoutes = require('../src/routes/food.routes');

const app = express();
app.use(express.json());
app.use('/api/food', foodRoutes);

// HTTP Helper for testing
function httpRequest({ port, method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const reqHeaders = {
      ...headers,
    };

    let postData = null;
    if (body !== null) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: '127.0.0.1',
      port,
      path: encodeURI(path),
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Generate test JWT tokens
function createToken({ id, role, role_id }) {
  return jwt.sign({ id, role, role_id }, JWT_SECRET, { expiresIn: '1h' });
}

const guest4Token = createToken({ id: 4, role: 'guest', role_id: 3 });
const guest5Token = createToken({ id: 5, role: 'guest', role_id: 3 });
const staffToken = createToken({ id: 2, role: 'staff', role_id: 2 });
const adminToken = createToken({ id: 1, role: 'admin', role_id: 1 });

async function runTests() {
  console.log('=============================================================================');
  console.log('TENZAL Luxury Resort - Food Ordering Listing APIs Test Suite');
  console.log('=============================================================================');

  const server = app.listen(0);
  const { port } = server.address();
  console.log(`[Test Server] Started on ephemeral port ${port}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST GROUP 1: Guest Order History (GET /api/food/orders/my-orders)
    // -------------------------------------------------------------------------
    console.log('--- TEST GROUP 1: Guest Order History (GET /api/food/orders/my-orders) ---');

    // 1. Guest 4 retrieves own orders (expects 2 orders: 101 and 102)
    const res1 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders/my-orders',
      headers: { Authorization: `Bearer ${guest4Token}` },
    });
    assert(res1.statusCode === 200, `Guest 4 receives HTTP 200 (got ${res1.statusCode})`);
    assert(res1.data.success === true, 'Response success is true');
    assert(res1.data.total === 2, `Total count is 2 (got ${res1.data.total})`);
    assert(res1.data.count === 2, `Result count is 2 (got ${res1.data.count})`);
    assert(
      Array.isArray(res1.data.data) && res1.data.data.every((o) => o.customer_id === '4'),
      'Every returned order belongs to customer_id 4'
    );
    assert(
      res1.data.data[0].items && res1.data.data[0].items.length > 0,
      'Order includes line items for receipt display'
    );

    // 2. Guest 5 retrieves own orders (expects 1 order: 103)
    const res2 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders/my-orders',
      headers: { Authorization: `Bearer ${guest5Token}` },
    });
    assert(res2.statusCode === 200, `Guest 5 receives HTTP 200 (got ${res2.statusCode})`);
    assert(res2.data.total === 1, `Guest 5 total count is 1 (got ${res2.data.total})`);
    assert(res2.data.data[0].customer_id === '5', 'Order belongs to customer_id 5');
    assert(
      !res2.data.data.some((o) => o.customer_id === '4'),
      'Guest 5 cannot see any orders of guest 4'
    );

    // 3. Client attempts to spoof customer_id via query parameter
    const res3 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders/my-orders?customer_id=5',
      headers: { Authorization: `Bearer ${guest4Token}` },
    });
    assert(res3.statusCode === 200, 'Request with spoofed customer_id returns HTTP 200');
    assert(
      Array.isArray(res3.data.data) && res3.data.data.every((o) => o.customer_id === '4'),
      'Spoofed customer_id=5 is ignored; only 4 orders returned'
    );

    // 4. Anonymous access to my-orders returns 401 Unauthorized
    const res4 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders/my-orders',
    });
    assert(res4.statusCode === 401, `Anonymous access rejected with HTTP 401 (got ${res4.statusCode})`);

    // 5. Status filter on my-orders (Pending vs In Kitchen)
    const res5 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders/my-orders?status=Pending',
      headers: { Authorization: `Bearer ${guest4Token}` },
    });
    assert(res5.statusCode === 200, 'Status filter returns HTTP 200');
    assert(res5.data.total === 1, `Total filtered orders is 1 (got ${res5.data.total})`);
    assert(res5.data.data[0].status === 'Pending', 'Returned order status is Pending');

    // 6. Invalid status filter on my-orders returns 400 Bad Request
    const res6 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders/my-orders?status=InvalidStatus',
      headers: { Authorization: `Bearer ${guest4Token}` },
    });
    assert(res6.statusCode === 400, `Invalid status filter rejected with HTTP 400 (got ${res6.statusCode})`);

    // 7. Empty order history for user with no orders
    const unusedGuestToken = createToken({ id: 998, role: 'guest', role_id: 3 });
    const res7 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders/my-orders',
      headers: { Authorization: `Bearer ${unusedGuestToken}` },
    });
    assert(res7.statusCode === 200, 'Empty history returns HTTP 200');
    assert(res7.data.total === 0, 'Total count is 0');
    assert(Array.isArray(res7.data.data) && res7.data.data.length === 0, 'Data is an empty array');

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Staff / Admin Order Listing (GET /api/food/orders)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Staff / Admin Order Listing (GET /api/food/orders) ---');

    // 8. Staff lists all orders
    const res8 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(res8.statusCode === 200, `Staff receives HTTP 200 (got ${res8.statusCode})`);
    assert(res8.data.total === 4, `Staff sees all 4 resort orders (got ${res8.data.total})`);
    assert(
      res8.data.data[0].status_history !== undefined,
      'Staff listing includes status history logs'
    );

    // 9. Admin lists all orders
    const res9 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res9.statusCode === 200, `Admin receives HTTP 200 (got ${res9.statusCode})`);
    assert(res9.data.total === 4, `Admin sees all 4 resort orders (got ${res9.data.total})`);

    // 10. Guest is denied access to staff listing (403 Forbidden)
    const res10 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders',
      headers: { Authorization: `Bearer ${guest4Token}` },
    });
    assert(res10.statusCode === 403, `Guest denied from staff listing with HTTP 403 (got ${res10.statusCode})`);
    assert(res10.statusCode === 403, `Guest denied from staff listing with HTTP 403 (got ${res10.statusCode})`);

    // 11. Anonymous is denied access to staff listing (401 Unauthorized)
    const res11 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders',
    });
    assert(res11.statusCode === 401, `Anonymous denied from staff listing with HTTP 401 (got ${res11.statusCode})`);

    // 12. Status filter on staff listing
    const res12 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders?status=Delivered',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(res12.statusCode === 200, 'Staff status filter returns HTTP 200');
    assert(res12.data.total === 1, `Total matching orders is 1 (got ${res12.data.total})`);
    assert(res12.data.data[0].order_code === 'ORD-20261121-CC3333', 'Correct order code returned');

    // 13. Room filter on staff listing
    const res13 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders?room=Room 3',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(res13.statusCode === 200, 'Staff room filter returns HTTP 200');
    assert(res13.data.total === 2, `Total orders for Room 3 is 2 (got ${res13.data.total})`);

    // 14. Date filter on staff listing
    const res14 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders?date=2026-11-20',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(res14.statusCode === 200, 'Staff date filter returns HTTP 200');
    assert(res14.data.total === 1, `Total orders for 2026-11-20 is 1 (got ${res14.data.total})`);

    // 15. Invalid date filter format returns 400 Bad Request
    const res15 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders?date=invalid-date',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(res15.statusCode === 400, `Invalid date rejected with HTTP 400 (got ${res15.statusCode})`);

    // 16. Search filter by order code
    const res16 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders?search=AA1111',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(res16.statusCode === 200, 'Search filter returns HTTP 200');
    assert(res16.data.total === 1, `Search found 1 order (got ${res16.data.total})`);
    assert(res16.data.data[0].order_code === 'ORD-20261120-AA1111', 'Found matching order code');

    // 17. Search filter by room name
    const res17 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders?search=Nine Skies',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(res17.statusCode === 200, 'Search by room name returns HTTP 200');
    assert(res17.data.total === 1, `Search found 1 order (got ${res17.data.total})`);
    assert(res17.data.data[0].room_name.includes('Nine Skies'), 'Found matching room name');

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Pagination & Validation Safety
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Pagination & Validation Safety ---');

    // 18. Pagination: limit=1, page=1
    const res18 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders?limit=1&page=1',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(res18.statusCode === 200, 'Pagination page 1 returns HTTP 200');
    assert(res18.data.limit === 1, `Limit is 1 (got ${res18.data.limit})`);
    assert(res18.data.page === 1, `Page is 1 (got ${res18.data.page})`);
    assert(res18.data.totalPages === 4, `Total pages is 4 (got ${res18.data.totalPages})`);
    assert(res18.data.count === 1, `Returned count is 1 (got ${res18.data.count})`);

    // 19. Pagination: limit=1, page=2
    const res19 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders?limit=1&page=2',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(res19.statusCode === 200, 'Pagination page 2 returns HTTP 200');
    assert(res19.data.page === 2, `Page is 2 (got ${res19.data.page})`);
    assert(res19.data.count === 1, `Returned count is 1 (got ${res19.data.count})`);

    // 20. Invalid / out-of-range pagination parameters default safely
    const res20 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders?page=-5&limit=99999',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(res20.statusCode === 200, 'Unsafe pagination values handled safely');
    assert(res20.data.page === 1, `Negative page defaults to 1 (got ${res20.data.page})`);
    assert(res20.data.limit === 100, `Excessive limit capped at 100 (got ${res20.data.limit})`);

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Regression (Existing Checkout, Single Order, Tracking)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Regression (Checkout, Single Order, Tracking) ---');

    // 21. Anonymous checkout still works (POST /api/food/orders)
    const res21 = await httpRequest({
      port,
      method: 'POST',
      path: '/api/food/orders',
      body: {
        room_number: 'Room 3',
        room_name: 'Uva Valley View Room — Room 3',
        items: [{ item_id: 6, quantity: 1 }],
      },
    });
    assert(res21.statusCode === 201, `Anonymous checkout returns HTTP 201 (got ${res21.statusCode})`);
    assert(res21.data.data.customer_id === null, 'Anonymous order customer_id is null');

    // 22. Authenticated checkout still works (customer_id = 4)
    const res22 = await httpRequest({
      port,
      method: 'POST',
      path: '/api/food/orders',
      headers: { Authorization: `Bearer ${guest4Token}` },
      body: {
        room_number: 'Room 3',
        room_name: 'Uva Valley View Room — Room 3',
        items: [{ item_id: 6, quantity: 1 }],
      },
    });
    assert(res22.statusCode === 201, `Authenticated checkout returns HTTP 201 (got ${res22.statusCode})`);
    assert(res22.data.data.customer_id === '4', 'Authenticated order customer_id is 4');

    // 23. Public tracking by code still works (GET /api/food/orders/code/:order_code)
    const res23 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders/code/ORD-20261120-AA1111',
    });
    assert(res23.statusCode === 200, `Public tracking returns HTTP 200 (got ${res23.statusCode})`);
    assert(res23.data.data.status === 'Pending', 'Tracking returns status Pending');
    assert(res23.data.data.room_number === undefined, 'Public tracking does NOT leak room_number');
    assert(res23.data.data.customer_id === undefined, 'Public tracking does NOT leak customer_id');

    // 24. Single order get with authentication (GET /api/food/orders/101)
    const res24 = await httpRequest({
      port,
      method: 'GET',
      path: '/api/food/orders/101',
      headers: { Authorization: `Bearer ${guest4Token}` },
    });
    assert(res24.statusCode === 200, `Single order get returns HTTP 200 (got ${res24.statusCode})`);
    assert(res24.data.data.order_id === 101, 'Correct order_id returned');

    // 25. Route ordering check: GET /api/food/orders/my-orders is NOT treated as GET /api/food/orders/:id
    assert(
      res1.statusCode === 200 && res1.data.data !== undefined && Array.isArray(res1.data.data),
      '/my-orders correctly routes to getMyOrders and was not intercepted by /:id'
    );
  } finally {
    server.close();
  }

  console.log('\n=============================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
