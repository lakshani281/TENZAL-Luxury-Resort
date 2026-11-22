/**
 * =============================================================================
 * TENZAL Luxury Resort - Food Ordering & User Management Integration Test Suite
 * Student ID: 22CIS0328 (Food Ordering) & 22CIS0274 (User Management)
 * File: backend/tests/verifyFoodAuthIntegration.js
 * =============================================================================
 * Comprehensive automated test suite verifying:
 * 1. Anonymous in-room dining checkout (customer_id = null)
 * 2. Authenticated guest checkout (customer_id = String(req.user.id))
 * 3. Client-supplied customer_id spoofing prevention (strictly ignored)
 * 4. Invalid JWT rejection (401 Unauthorized / TOKEN_INVALID)
 * 5. Expired JWT rejection (401 Unauthorized / TOKEN_EXPIRED)
 * 6. Deactivated user rejection (403 Forbidden / ACCOUNT_DEACTIVATED)
 * 7. Guest accessing own private order details (200 OK)
 * 8. Guest accessing another guest's private order (403 Forbidden / IDOR prevention)
 * 9. Staff and Admin accessing private order details (200 OK)
 * 10. Guest attempting staff status update (403 Forbidden)
 * 11. Staff/Admin updating order status (200 OK)
 * 12. Audit log recording authenticated staff user ID
 * 13. Public order-code progress tracking privacy (strictly 5 public fields)
 * 14. Batch tracking privacy (strictly 5 public fields)
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
const Order = require('../src/models/order.model');
const { JWT_SECRET } = require('../middleware/auth');

// In-Memory store for orders
let orderSequence = 100;
const inMemoryOrders = new Map();

// Mock food item database record for authoritatively pricing cart items in tests
const MOCK_FOOD_ITEM = {
  item_id: 6,
  name: 'Ceylon Spiced Black Pork Curry',
  price: '2800.00',
  prep_time_minutes: 25,
  is_available: true,
  is_special: false,
  special_start_at: null,
  special_end_at: null,
  category_is_active: true,
};

// Intercept foodDb.query to safely return mock dish without hitting Supabase
const originalFoodDbQuery = foodDb.query;
foodDb.query = async function (text, params) {
  if (typeof text === 'string' && text.includes('FROM food_items')) {
    return { rows: [MOCK_FOOD_ITEM] };
  }
  return { rows: [] };
};

// Mock Order.create in-memory
const originalOrderCreate = Order.create;
Order.create = async function (data) {
  orderSequence += 1;
  const orderId = orderSequence;
  const orderCode = data.orderCode || `ORD-20261121-${orderId}ABC`;
  const orderRecord = {
    order_id: orderId,
    order_code: orderCode,
    room_number: data.roomNumber,
    room_name: data.roomName,
    customer_id: data.customerId, // Should be null or verified string
    special_note: data.specialNote,
    subtotal: parseFloat(data.subtotal),
    service_charge: parseFloat(data.serviceCharge),
    total_amount: parseFloat(data.totalAmount),
    status: 'Pending',
    estimated_delivery_minutes: data.estimatedDeliveryMinutes || 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: (data.items || []).map((it, idx) => ({
      order_detail_id: idx + 1,
      order_id: orderId,
      item_id: it.item_id,
      item_name: it.item_name,
      unit_price: parseFloat(it.unit_price),
      quantity: it.quantity,
      line_total: parseFloat(it.line_total),
    })),
    status_history: [
      {
        history_id: 1,
        order_id: orderId,
        previous_status: null,
        new_status: 'Pending',
        changed_by_user_id: data.customerId,
        change_reason: 'Order placed by guest via in-room dining mobile app',
        created_at: new Date().toISOString(),
      },
    ],
  };

  inMemoryOrders.set(orderId, orderRecord);
  inMemoryOrders.set(orderCode, orderRecord);
  return orderRecord;
};

// Mock Order.findById in-memory
const originalOrderFindById = Order.findById;
Order.findById = async function (orderId) {
  const match = inMemoryOrders.get(Number(orderId));
  return match ? JSON.parse(JSON.stringify(match)) : null;
};

// Mock Order.findByCode in-memory
const originalOrderFindByCode = Order.findByCode;
Order.findByCode = async function (orderCode) {
  const match = inMemoryOrders.get(String(orderCode).trim().toUpperCase());
  return match ? JSON.parse(JSON.stringify(match)) : null;
};

// Mock Order.findTrackingByCode in-memory
const originalOrderFindTrackingByCode = Order.findTrackingByCode;
Order.findTrackingByCode = async function (orderCode) {
  const match = inMemoryOrders.get(String(orderCode).trim().toUpperCase());
  if (!match) return null;
  return {
    order_code: match.order_code,
    status: match.status,
    estimated_delivery_minutes: match.estimated_delivery_minutes,
    created_at: match.created_at,
    item_count: (match.items || []).length,
  };
};

// Mock Order.findBatchTrackingByCodes in-memory
const originalOrderFindBatchTrackingByCodes = Order.findBatchTrackingByCodes;
Order.findBatchTrackingByCodes = async function (orderCodes) {
  const results = [];
  for (const code of orderCodes) {
    const match = inMemoryOrders.get(String(code).trim().toUpperCase());
    if (match) {
      results.push({
        order_code: match.order_code,
        status: match.status,
        estimated_delivery_minutes: match.estimated_delivery_minutes,
        created_at: match.created_at,
        item_count: (match.items || []).length,
      });
    }
  }
  return results;
};

// Mock Order.transitionStatus in-memory
const originalOrderTransitionStatus = Order.transitionStatus;
Order.transitionStatus = async function ({ orderCode, nextStatus, changeReason, changedByUserId }) {
  const normCode = String(orderCode).trim().toUpperCase();
  const match = inMemoryOrders.get(normCode);
  if (!match) {
    const err = new Error(`Order ${normCode} not found.`);
    err.code = 'ORDER_NOT_FOUND';
    throw err;
  }

  const prevStatus = match.status;
  match.status = nextStatus;
  match.updated_at = new Date().toISOString();

  const historyEntry = {
    history_id: match.status_history.length + 1,
    order_id: match.order_id,
    previous_status: prevStatus,
    new_status: nextStatus,
    changed_by_user_id: changedByUserId,
    change_reason: changeReason || `Transitioned from ${prevStatus} to ${nextStatus}`,
    created_at: new Date().toISOString(),
  };

  match.status_history.push(historyEntry);

  return {
    order_id: match.order_id,
    order_code: match.order_code,
    previous_status: prevStatus,
    status: nextStatus,
    updated_at: match.updated_at,
    history: historyEntry,
  };
};

// 2. Load Express Server (backend/server.js)
const app = require('../server');
const TEST_PORT = 5577;
const BASE_URL = `http://localhost:${TEST_PORT}`;
let testServer;

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName} - Details: ${details}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log(' TENZAL Luxury Resort - Food Ordering Auth Integration Test Suite');
  console.log(' Modules: Food Ordering (22CIS0328) + User Management (22CIS0274)');
  console.log('================================================================\n');

  // Step A: Acquire Real Tokens through User Management /api/auth/login
  console.log('--- Step A: Obtain Real JWTs from User Management Login ---');

  // 1. Admin login (Nadeesha Perera - id: 1, role: 'admin')
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@tenzal.com',
    password: 'Password123!',
  });
  assert(adminLogin.status === 200 && adminLogin.body.data?.token, 'Admin login succeeds with signed JWT');
  const adminToken = adminLogin.body.data.token;
  assert(adminLogin.body.data.user.role === 'admin', 'Admin token has lowercase role "admin"');

  // 2. Staff login (Kasun Silva - id: 2, role: 'staff')
  const staffLogin = await request('POST', '/api/auth/login', {
    email: 'kasun@tenzal.com',
    password: 'Password123!',
  });
  assert(staffLogin.status === 200 && staffLogin.body.data?.token, 'Staff login succeeds with signed JWT');
  const staffToken = staffLogin.body.data.token;
  assert(staffLogin.body.data.user.role === 'staff', 'Staff token has lowercase role "staff"');

  // 3. Guest A login (Amelia Hart - id: 4, role: 'guest')
  const guestALogin = await request('POST', '/api/auth/login', {
    email: 'amelia@example.com',
    password: 'Password123!',
  });
  assert(guestALogin.status === 200 && guestALogin.body.data?.token, 'Guest A (Amelia, ID: 4) login succeeds');
  const guestAToken = guestALogin.body.data.token;

  // 4. Guest B login (Nimal Perera - id: 5, role: 'guest')
  const guestBLogin = await request('POST', '/api/auth/login', {
    email: 'nimal@email.com',
    password: 'Password123!',
  });
  assert(guestBLogin.status === 200 && guestBLogin.body.data?.token, 'Guest B (Nimal, ID: 5) login succeeds');
  const guestBToken = guestBLogin.body.data.token;

  // 5. Generate expired and invalid tokens for negative testing
  const expiredToken = jwt.sign(
    { id: 4, email: 'amelia@example.com', role: 'guest', role_id: 3 },
    JWT_SECRET,
    { expiresIn: -10 } // Expired 10 seconds ago
  );
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tamperedsignature';

  console.log('\n--- Step B: In-Room Dining Checkout Authentication & Identity ---');

  // Test 1: Anonymous checkout succeeds with customer_id = null
  const anonCheckout = await request('POST', '/api/food/orders', {
    room_number: 'Room 3',
    room_name: 'Uva Valley View Room — Room 3',
    special_note: 'Guest ordering anonymously from room tablet',
    items: [{ item_id: 6, quantity: 1 }],
  });
  assert(anonCheckout.status === 201, 'Test 1: Anonymous checkout succeeds with 201 Created');
  assert(anonCheckout.body.data.customer_id === null, 'Test 1: Anonymous order has customer_id = null');
  const anonOrderId = anonCheckout.body.data.order_id;
  const anonOrderCode = anonCheckout.body.data.order_code;

  // Test 2: Authenticated guest checkout stores verified user ID
  const authCheckout = await request(
    'POST',
    '/api/food/orders',
    {
      room_number: 'Room 4',
      room_name: 'Bridal Suite, Uva Valley — Room 4',
      special_note: 'Amelia logged-in guest order',
      items: [{ item_id: 6, quantity: 2 }],
    },
    guestAToken
  );
  assert(authCheckout.status === 201, 'Test 2: Authenticated guest checkout succeeds with 201 Created');
  assert(authCheckout.body.data.customer_id === '4', 'Test 2: Authenticated order stores verified user ID "4"');
  const guestAOrderId = authCheckout.body.data.order_id;
  const guestAOrderCode = authCheckout.body.data.order_code;

  // Create Guest B order for IDOR testing
  const guestBCheckout = await request(
    'POST',
    '/api/food/orders',
    {
      room_number: 'Room 5',
      room_name: 'Indian Ocean View Room — Room 5',
      items: [{ item_id: 6, quantity: 1 }],
    },
    guestBToken
  );
  const guestBOrderId = guestBCheckout.body.data.order_id;

  // Test 3: Client-supplied customer_id is completely ignored (Anti-Spoofing)
  const spoofCheckout = await request(
    'POST',
    '/api/food/orders',
    {
      room_number: 'Room 3',
      room_name: 'Uva Valley View Room — Room 3',
      customer_id: '999_HACKER_SPOOFED_ID',
      items: [{ item_id: 6, quantity: 1 }],
    },
    guestAToken
  );
  assert(spoofCheckout.status === 201, 'Test 3: Checkout with client-supplied customer_id succeeds');
  assert(
    spoofCheckout.body.data.customer_id === '4' && spoofCheckout.body.data.customer_id !== '999_HACKER_SPOOFED_ID',
    'Test 3: Client-supplied customer_id in request body is strictly ignored; verified token identity "4" stored'
  );

  // Test 4: Invalid JWT returns 401
  const badTokenCheckout = await request(
    'POST',
    '/api/food/orders',
    {
      room_number: 'Room 3',
      room_name: 'Uva Valley View Room — Room 3',
      items: [{ item_id: 6, quantity: 1 }],
    },
    invalidToken
  );
  assert(badTokenCheckout.status === 401, 'Test 4: Invalid JWT on checkout rejected with 401 Unauthorized');
  assert(badTokenCheckout.body.code === 'TOKEN_INVALID', 'Test 4: Rejection returns code TOKEN_INVALID');

  // Test 5: Expired JWT returns 401
  const expiredCheckout = await request(
    'POST',
    '/api/food/orders',
    {
      room_number: 'Room 3',
      room_name: 'Uva Valley View Room — Room 3',
      items: [{ item_id: 6, quantity: 1 }],
    },
    expiredToken
  );
  assert(expiredCheckout.status === 401, 'Test 5: Expired JWT on checkout rejected with 401 Unauthorized');
  assert(expiredCheckout.body.code === 'TOKEN_EXPIRED', 'Test 5: Rejection returns code TOKEN_EXPIRED');

  // Test 6: Deactivated account returns 403
  // Generate token for deactivated staff user (M. Fernando - id: 3, is_active: false in memoryStore)
  const deactivatedToken = jwt.sign(
    { id: 3, email: 'mfernando@tenzal.com', role: 'staff', role_id: 2 },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const deactivatedCheckout = await request(
    'POST',
    '/api/food/orders',
    {
      room_number: 'Room 3',
      room_name: 'Uva Valley View Room — Room 3',
      items: [{ item_id: 6, quantity: 1 }],
    },
    deactivatedToken
  );
  assert(deactivatedCheckout.status === 403, 'Test 6: Deactivated account rejected with 403 Forbidden');
  assert(deactivatedCheckout.body.code === 'ACCOUNT_DEACTIVATED', 'Test 6: Returns code ACCOUNT_DEACTIVATED');

  console.log('\n--- Step C: Private Order Details & IDOR Prevention (/orders/:id) ---');

  // Anonymous request to private order details
  const anonPrivateGet = await request('GET', `/api/food/orders/${guestAOrderId}`);
  assert(anonPrivateGet.status === 401, 'Private order endpoint strictly blocks anonymous requests with 401');

  // Test 7: Guest can access their own order
  const ownOrderGet = await request('GET', `/api/food/orders/${guestAOrderId}`, null, guestAToken);
  assert(ownOrderGet.status === 200, 'Test 7: Guest A (Amelia) accesses her own order with 200 OK');
  assert(ownOrderGet.body.data.order_id === guestAOrderId, 'Test 7: Full private order details returned');

  // Test 8: Guest cannot access another guest's order (IDOR Test)
  const idorAttack = await request('GET', `/api/food/orders/${guestBOrderId}`, null, guestAToken);
  assert(idorAttack.status === 403, 'Test 8: Guest A accessing Guest B order blocked with 403 Forbidden (IDOR Guard)');
  assert(
    idorAttack.body.message.includes('permission') || idorAttack.body.message.includes('denied'),
    'Test 8: IDOR rejection returns access denied message without leaking order content'
  );

  // Test 9: Staff and Admin can access private order details
  const staffOrderGet = await request('GET', `/api/food/orders/${guestAOrderId}`, null, staffToken);
  assert(staffOrderGet.status === 200, 'Test 9: Staff member (Kasun) can access any order with 200 OK');

  const adminOrderGet = await request('GET', `/api/food/orders/${guestAOrderId}`, null, adminToken);
  assert(adminOrderGet.status === 200, 'Test 9: Administrator (Nadeesha) can access any order with 200 OK');

  // Non-existent order returns 404
  const missingOrderGet = await request('GET', '/api/food/orders/999999', null, adminToken);
  assert(missingOrderGet.status === 404, 'Non-existent order returns 404 Not Found');

  console.log('\n--- Step D: Staff Order Status Progression & RBAC (/orders/code/:code/status) ---');

  // Test 10: Guest cannot update order status
  const guestStatusUpdate = await request(
    'PATCH',
    `/api/food/orders/code/${guestAOrderCode}/status`,
    { status: 'In Kitchen' },
    guestAToken
  );
  assert(guestStatusUpdate.status === 403, 'Test 10: Guest attempting staff status update is blocked with 403 Forbidden');

  // Anonymous status update is blocked with 401
  const anonStatusUpdate = await request(
    'PATCH',
    `/api/food/orders/code/${guestAOrderCode}/status`,
    { status: 'In Kitchen' }
  );
  assert(anonStatusUpdate.status === 401, 'Anonymous status update attempt is blocked with 401 Unauthorized');

  // Test 11: Staff/Admin can update order status
  const staffTransition = await request(
    'PATCH',
    `/api/food/orders/code/${guestAOrderCode}/status`,
    {
      status: 'In Kitchen',
      change_reason: 'Kitchen staff accepted and began food preparation',
    },
    staffToken
  );
  assert(staffTransition.status === 200, 'Test 11: Staff successfully transitions order status to "In Kitchen"');
  assert(staffTransition.body.data.status === 'In Kitchen', 'Test 11: Order status updated to "In Kitchen"');

  // Test 12: Status history records the authenticated staff user's ID
  assert(
    staffTransition.body.data.history.changed_by_user_id === '2',
    'Test 12: Audit history strictly records verified staff user ID "2" (Kasun Silva)'
  );

  // Admin progression: 'In Kitchen' -> 'Out for Delivery'
  const adminProgression = await request(
    'PATCH',
    `/api/food/orders/code/${guestAOrderCode}/status`,
    {
      status: 'Out for Delivery',
      change_reason: 'Delivery staff en route to Room 4',
    },
    adminToken
  );
  assert(adminProgression.status === 200, 'Admin successfully transitions order to "Out for Delivery"');
  assert(
    adminProgression.body.data.history.changed_by_user_id === '1',
    'Audit history records verified admin user ID "1" (Nadeesha Perera)'
  );

  console.log('\n--- Step E: Public Tracking & Privacy Safeguards ---');

  // Test 13: Public single order tracking remains accessible and limited to 5 fields
  const publicTracking = await request('GET', `/api/food/orders/code/${guestAOrderCode}`);
  assert(publicTracking.status === 200, 'Test 13: Public order code tracking returns 200 OK without authentication');
  const trackingData = publicTracking.body.data;
  assert(trackingData.order_code === guestAOrderCode, 'Test 13: Order code matches');
  assert(trackingData.status === 'Out for Delivery', 'Test 13: Returns real-time status');
  assert(
    trackingData.room_number === undefined &&
      trackingData.customer_id === undefined &&
      trackingData.total_amount === undefined &&
      trackingData.special_note === undefined,
    'Test 13: STRICT PRIVACY VERIFIED: Public tracking never leaks room, customer_id, totals, or notes'
  );

  // Test 14: Batch tracking returns strictly 5 public fields
  const batchTracking = await request('POST', '/api/food/orders/tracking/batch', {
    order_codes: [guestAOrderCode, anonOrderCode],
  });
  assert(batchTracking.status === 200, 'Test 14: Batch tracking returns 200 OK without authentication');
  assert(Array.isArray(batchTracking.body.data) && batchTracking.body.data.length === 2, 'Test 14: Returns both tracked orders');
  for (const item of batchTracking.body.data) {
    assert(
      item.room_number === undefined && item.customer_id === undefined && item.total_amount === undefined,
      'Test 14: Batch tracking item never leaks private room or guest information'
    );
  }

  // Public menu and categories endpoints remain unhindered
  const publicCats = await request('GET', '/api/food/categories');
  assert(publicCats.status === 200, 'Public categories endpoint remains accessible');

  const publicItems = await request('GET', '/api/food/items');
  assert(publicItems.status === 200, 'Public food items endpoint remains accessible');

  console.log('\n================================================================');
  console.log(` SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testServer = app.listen(TEST_PORT, async () => {
  try {
    await runTestSuite();
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exit(1);
  } finally {
    testServer.close();
  }
});
