/**
 * Security, Authentication & RBAC Test Suite for Room & Booking APIs
 * TENZAL Luxury Resort
 *
 * Operates against local in-memory database fallback (no production DB writes).
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../server');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

let server;
const PORT = 5566;
const BASE_URL = `http://localhost:${PORT}`;

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
    failedTests++;
  }
}

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
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data !== null) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function loginAs(email, password = 'Password123!') {
  const res = await request('POST', '/api/auth/login', { email, password });
  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Failed to login as ${email}: HTTP ${res.status}`);
  }
  return res.body.data.token;
}

async function runTests() {
  console.log('====================================================');
  console.log(' TENZAL Luxury Resort - Security & RBAC Test Suite');
  console.log('====================================================');

  server = app.listen(PORT);

  try {
    const adminToken = await loginAs('admin@tenzal.com');
    const staffToken = await loginAs('kasun@tenzal.com');
    const guestAmeliaToken = await loginAs('amelia@example.com');
    const expiredToken = jwt.sign(
      { id: 4, email: 'amelia@example.com', role: 'guest' },
      JWT_SECRET,
      { expiresIn: -10 }
    );
    const invalidToken = 'invalid.jwt.token';

    // -------------------------------------------------------------------------
    // 1. Authentication Edge Cases
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Authentication Middleware Checks ---');
    const noTokenRes = await request('GET', '/api/bookings');
    assert(noTokenRes.status === 401, 'Missing token returns 401 Unauthorized');

    const badTokenRes = await request('GET', '/api/bookings', null, invalidToken);
    assert(badTokenRes.status === 401, 'Invalid token returns 401 Unauthorized');

    const expTokenRes = await request('GET', '/api/bookings', null, expiredToken);
    assert(
      expTokenRes.status === 401 && expTokenRes.body?.code === 'TOKEN_EXPIRED',
      'Expired token returns 401 with TOKEN_EXPIRED'
    );

    // -------------------------------------------------------------------------
    // 2. Room API Authorization Matrix
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Room API Authorization ---');
    const publicRooms = await request('GET', '/api/rooms');
    assert(publicRooms.status === 200 && Array.isArray(publicRooms.body?.data), 'Public GET /api/rooms returns 200');

    const publicRoomById = await request('GET', '/api/rooms/1');
    assert(publicRoomById.status === 200 && publicRoomById.body?.data?.id === 1, 'Public GET /api/rooms/1 returns 200');

    const publicAllAvail = await request('GET', '/api/rooms/availability/check?checkIn=2026-08-01&checkOut=2026-08-03');
    assert(publicAllAvail.status === 200, 'Public GET /api/rooms/availability/check returns 200');

    const publicRoomAvail = await request('GET', '/api/rooms/1/availability?checkIn=2026-08-01&checkOut=2026-08-03');
    assert(publicRoomAvail.status === 200, 'Public GET /api/rooms/1/availability returns 200');

    const anonRoomStats = await request('GET', '/api/rooms/stats/overview');
    assert(anonRoomStats.status === 401, 'Anonymous GET /api/rooms/stats/overview returns 401');

    const guestRoomStats = await request('GET', '/api/rooms/stats/overview', null, guestAmeliaToken);
    assert(guestRoomStats.status === 403, 'Guest GET /api/rooms/stats/overview returns 403');

    const newRoomPayload = {
      room_number: '99',
      name: 'Tea Estate Pavilion',
      type: 'Suite',
      price_per_night: 250,
      capacity: 2,
      status: 'active',
    };
    const guestCreateRoom = await request('POST', '/api/rooms', newRoomPayload, guestAmeliaToken);
    assert(guestCreateRoom.status === 403, 'Guest cannot create a room (403 Forbidden)');

    const guestUpdateRoom = await request('PUT', '/api/rooms/1', { name: 'Hacked Room' }, guestAmeliaToken);
    assert(guestUpdateRoom.status === 403, 'Guest cannot update a room (403 Forbidden)');

    const guestStatusRoom = await request('PATCH', '/api/rooms/1/status', { status: 'maintenance' }, guestAmeliaToken);
    assert(guestStatusRoom.status === 403, 'Guest cannot change room status (403 Forbidden)');

    const staffRoomStats = await request('GET', '/api/rooms/stats/overview', null, staffToken);
    assert(staffRoomStats.status === 200, 'Staff can access room stats (200 OK)');

    const adminCreateRoom = await request('POST', '/api/rooms', newRoomPayload, adminToken);
    assert(adminCreateRoom.status === 201 && adminCreateRoom.body?.data?.room_number === '99', 'Admin can create a room (201 Created)');
    const createdRoomId = adminCreateRoom.body?.data?.id;

    const staffUpdateRoom = await request('PUT', `/api/rooms/${createdRoomId}`, { name: 'Tea Estate Suite' }, staffToken);
    assert(staffUpdateRoom.status === 200 && staffUpdateRoom.body?.data?.name === 'Tea Estate Suite', 'Staff can update a room (200 OK)');

    const staffStatusRoom = await request('PATCH', `/api/rooms/${createdRoomId}/status`, { status: 'maintenance' }, staffToken);
    assert(staffStatusRoom.status === 200 && staffStatusRoom.body?.data?.status === 'maintenance', 'Staff can update room status (200 OK)');

    // -------------------------------------------------------------------------
    // 3. Booking API Authorization & Ownership
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Booking API Authorization & Ownership ---');
    const anonListBookings = await request('GET', '/api/bookings');
    assert(anonListBookings.status === 401, 'Anonymous user cannot list all bookings (401)');

    const anonBookingById = await request('GET', '/api/bookings/1');
    assert(anonBookingById.status === 401, 'Anonymous user cannot access booking details (401)');

    const anonBookingStats = await request('GET', '/api/bookings/stats/overview');
    assert(anonBookingStats.status === 401, 'Anonymous user cannot access booking stats (401)');

    const anonCreateBooking = await request('POST', '/api/bookings', {
      room_id: 1,
      guest_name: 'Anon Guest',
      check_in: '2026-09-01',
      check_out: '2026-09-03',
    });
    assert(anonCreateBooking.status === 401, 'Anonymous user cannot create a booking (401)');

    const guestListBookings = await request('GET', '/api/bookings', null, guestAmeliaToken);
    assert(guestListBookings.status === 403, 'Guest cannot list all bookings (403)');

    const guestBookingStats = await request('GET', '/api/bookings/stats/overview', null, guestAmeliaToken);
    assert(guestBookingStats.status === 403, 'Guest cannot access admin booking stats (403)');

    // Seed booking #1 belongs to oliver@example.com; #4 belongs to amelia@example.com
    const guestOtherBooking = await request('GET', '/api/bookings/1', null, guestAmeliaToken);
    assert(guestOtherBooking.status === 403, 'Guest cannot access another guest booking (403)');

    const guestOwnBooking = await request('GET', '/api/bookings/4', null, guestAmeliaToken);
    assert(guestOwnBooking.status === 200 && guestOwnBooking.body?.data?.id === 4, 'Guest can access own booking (200)');

    const guestUpdateBooking = await request('PUT', '/api/bookings/4', { notes: 'Attempted edit' }, guestAmeliaToken);
    assert(guestUpdateBooking.status === 403, 'Guest cannot update booking record (403)');

    const guestStatusBooking = await request('PATCH', '/api/bookings/4/status', { status: 'confirmed' }, guestAmeliaToken);
    assert(guestStatusBooking.status === 403, 'Guest cannot update booking status (403)');

    // Guest creating a booking: spoofed email & status must be overridden by JWT identity & pending status
    const guestCreateBooking = await request(
      'POST',
      '/api/bookings',
      {
        room_id: 1,
        guest_name: 'Amelia Hart',
        guest_email: 'spoofed@evil.com',
        guest_phone: '0771112222',
        guest_count: 2,
        check_in: '2026-10-01',
        check_out: '2026-10-03',
        status: 'confirmed',
      },
      guestAmeliaToken
    );
    assert(guestCreateBooking.status === 201, 'Authenticated guest can create a booking (201)');
    assert(
      guestCreateBooking.body?.data?.guest_email === 'amelia@example.com',
      'Guest booking binds guest_email to verified JWT email (anti-spoofing)'
    );
    assert(
      guestCreateBooking.body?.data?.status === 'pending',
      'Guest booking forces initial status to pending'
    );

    const guestNewBookingId = guestCreateBooking.body?.data?.id;
    const guestFetchNewOwn = await request('GET', `/api/bookings/${guestNewBookingId}`, null, guestAmeliaToken);
    assert(guestFetchNewOwn.status === 200, 'Guest can fetch newly created own booking');

    // Staff & Admin booking management
    const staffListBookings = await request('GET', '/api/bookings', null, staffToken);
    assert(staffListBookings.status === 200 && Array.isArray(staffListBookings.body?.bookings), 'Staff can list all bookings (200)');

    const adminBookingStats = await request('GET', '/api/bookings/stats/overview', null, adminToken);
    assert(adminBookingStats.status === 200 && adminBookingStats.body?.data, 'Admin can access booking stats (200)');

    const staffViewOther = await request('GET', '/api/bookings/1', null, staffToken);
    assert(staffViewOther.status === 200 && staffViewOther.body?.data?.id === 1, 'Staff can view any booking details (200)');

    const staffCreateForGuest = await request(
      'POST',
      '/api/bookings',
      {
        room_id: 2,
        guest_name: 'Walk-in Guest',
        guest_email: 'walkin@example.com',
        check_in: '2026-11-01',
        check_out: '2026-11-02',
        status: 'confirmed',
      },
      staffToken
    );
    assert(
      staffCreateForGuest.status === 201 && staffCreateForGuest.body?.data?.status === 'confirmed',
      'Staff can create booking on behalf of guest with confirmed status (201)'
    );

    const adminUpdateBooking = await request(
      'PUT',
      `/api/bookings/${guestNewBookingId}`,
      { notes: 'VIP welcome basket' },
      adminToken
    );
    assert(adminUpdateBooking.status === 200, 'Admin can update booking record (200)');

    const staffUpdateBookingStatus = await request(
      'PATCH',
      `/api/bookings/${guestNewBookingId}/status`,
      { status: 'confirmed' },
      staffToken
    );
    assert(
      staffUpdateBookingStatus.status === 200 && staffUpdateBookingStatus.body?.data?.status === 'confirmed',
      'Staff can update booking status (200)'
    );
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await db.end().catch(() => {});
  }

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
