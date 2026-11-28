/**
 * TENZAL Luxury Resort - Room & Booking API Service Client
 * Integrates with backend /api/rooms and /api/bookings endpoints.
 */

import { getBackendOrigin, DEFAULT_TIMEOUT_MS } from './foodApi';

/**
 * Performs an HTTP request with AbortController timeout and structured error handling.
 */
async function request(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    let body = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await response.json();
      } catch {
        // Ignore JSON parse error
      }
    }

    if (!response.ok) {
      const msg = body?.message || body?.error || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(msg);
      error.status = response.status;
      error.data = body;
      throw error;
    }

    return body;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error(
        `Request timed out after ${timeoutMs / 1000}s. Please check your connection.`
      );
      timeoutError.code = 'ETIMEDOUT';
      throw timeoutError;
    }
    if (!error.status) {
      const networkError = new Error(
        `Network connection failed. Ensure the backend server is reachable. (${error.message})`
      );
      networkError.code = 'ENETWORK';
      throw networkError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * GET /api/rooms
 * List rooms with optional search and status filter.
 */
export async function getRooms({ search, status } = {}) {
  const params = [];
  if (search && search.trim()) {
    params.push(`search=${encodeURIComponent(search.trim())}`);
  }
  if (status && status !== 'all') {
    params.push(`status=${encodeURIComponent(status)}`);
  }
  const qs = params.length > 0 ? `?${params.join('&')}` : '';
  const url = `${getBackendOrigin()}/api/rooms${qs}`;
  const json = await request(url, { method: 'GET' });
  return Array.isArray(json?.data) ? json.data : [];
}

/**
 * GET /api/rooms/:id
 * Fetch a single room by ID.
 */
export async function getRoomById(roomId) {
  if (!roomId) throw new Error('Room ID is required.');
  const url = `${getBackendOrigin()}/api/rooms/${encodeURIComponent(String(roomId))}`;
  const json = await request(url, { method: 'GET' });
  if (!json?.data) throw new Error('Room not found.');
  return json.data;
}

/**
 * GET /api/rooms/:id/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 * Check room availability for a specific date range.
 */
export async function checkRoomAvailability(roomId, checkIn, checkOut) {
  if (!roomId) throw new Error('Room ID is required.');
  if (!checkIn || !checkOut) throw new Error('Check-in and check-out dates are required.');

  const url = `${getBackendOrigin()}/api/rooms/${encodeURIComponent(
    String(roomId)
  )}/availability?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`;

  const json = await request(url, { method: 'GET' });
  return json?.data || null;
}

/**
 * POST /api/bookings
 * Create a new room booking as an authenticated guest.
 * Never sends guest_email or status so the backend enforces JWT identity and pending status.
 */
export async function createBooking(bookingData, token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    const authErr = new Error('Authentication required. Please sign in to book a room.');
    authErr.status = 401;
    throw authErr;
  }

  const payload = {
    room_id: Number(bookingData.room_id),
    guest_name: String(bookingData.guest_name || '').trim(),
    guest_count: Number(bookingData.guest_count || 1),
    check_in: bookingData.check_in,
    check_out: bookingData.check_out,
  };

  if (bookingData.guest_phone && String(bookingData.guest_phone).trim()) {
    payload.guest_phone = String(bookingData.guest_phone).trim();
  }
  if (bookingData.notes && String(bookingData.notes).trim()) {
    payload.notes = String(bookingData.notes).trim();
  }

  const url = `${getBackendOrigin()}/api/bookings`;
  const json = await request(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.trim()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!json?.data) {
    throw new Error('Booking succeeded but server did not return booking details.');
  }

  return json.data;
}

/**
 * GET /api/bookings/:id
 * Retrieve a single booking by ID (authenticated owner or staff/admin).
 */
export async function getBookingById(bookingId, token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    const authErr = new Error('Authentication required to view booking details.');
    authErr.status = 401;
    throw authErr;
  }
  if (!bookingId) throw new Error('Booking ID is required.');

  const url = `${getBackendOrigin()}/api/bookings/${encodeURIComponent(String(bookingId))}`;
  const json = await request(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.trim()}`,
    },
  });

  if (!json?.data) {
    throw new Error('Booking not found.');
  }
  return json.data;
}

export default {
  getRooms,
  getRoomById,
  checkRoomAvailability,
  createBooking,
  getBookingById,
};
