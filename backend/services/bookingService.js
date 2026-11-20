/**
 * Booking Service for TENZAL Luxury Resort
 * Room Booking Module | Student ID: 22CIS0276
 */

const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Generate the next booking reference (TZ-1001, TZ-1002, etc.)
 */
const generateReference = async () => {
  const result = await pool.query(
    'SELECT reference FROM bookings ORDER BY id DESC LIMIT 1'
  );

  if (result.rows.length === 0) {
    return 'TZ-1001';
  }

  const lastRef = result.rows[0].reference;
  const match = lastRef.match(/TZ-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `TZ-${nextNum}`;
  }
  return `TZ-${Date.now().toString().slice(-4)}`;
};

/**
 * Calculate number of nights between two dates.
 */
const calculateNights = (checkIn, checkOut) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.round((end - start) / msPerDay);
};

/**
 * Check for overlapping bookings on a room.
 * Excludes cancelled bookings.
 */
const checkOverlap = async (roomId, checkIn, checkOut, excludeBookingId = null) => {
  let query = `
    SELECT id, reference, check_in, check_out, status
    FROM bookings
    WHERE room_id = $1
      AND status NOT IN ('cancelled')
      AND check_in < $3
      AND check_out > $2
  `;
  const params = [roomId, checkIn, checkOut];

  if (excludeBookingId) {
    query += ' AND id != $4';
    params.push(excludeBookingId);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Get all bookings with optional filtering and pagination.
 */
const getAllBookings = async ({ search, status, page = 1, limit = 50 }) => {
  const offset = (page - 1) * limit;
  let countQuery = `
    SELECT COUNT(*) AS total
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE 1=1
  `;
  let dataQuery = `
    SELECT b.*, r.room_number, r.name AS room_name, r.type AS room_type
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    const searchClause = ` AND (b.reference ILIKE $${paramIndex} OR b.guest_name ILIKE $${paramIndex} OR b.guest_email ILIKE $${paramIndex} OR r.room_number ILIKE $${paramIndex})`;
    countQuery += searchClause;
    dataQuery += searchClause;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (status && status !== 'all') {
    const statusClause = ` AND b.status = $${paramIndex}`;
    countQuery += statusClause;
    dataQuery += statusClause;
    params.push(status);
    paramIndex++;
  }

  dataQuery += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0]?.total || 0, 10);

  const dataParams = [...params, limit, offset];
  const dataResult = await pool.query(dataQuery, dataParams);

  return {
    bookings: dataResult.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

/**
 * Get a single booking by ID (with room info).
 */
const getBookingById = async (id) => {
  const result = await pool.query(
    `SELECT b.*, r.room_number, r.name AS room_name, r.type AS room_type, r.price_per_night, r.capacity
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     WHERE b.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Booking not found.', 404);
  }

  return result.rows[0];
};

/**
 * Create a new booking with transactional locking and availability validation.
 */
const createBooking = async (bookingData) => {
  const {
    room_id,
    guest_name,
    guest_email,
    guest_phone,
    guest_count = 1,
    check_in,
    check_out,
    status = 'pending',
    notes,
  } = bookingData;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock room row for update to prevent concurrent double-booking race condition
    const roomResult = await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [room_id]);
    if (roomResult.rows.length === 0) {
      throw new AppError('Selected room was not found.', 404);
    }

    const room = roomResult.rows[0];

    // 2. Validate room status
    if (room.status !== 'active') {
      throw new AppError('Room is not currently active for reservations (under maintenance or inactive).', 400);
    }

    // 3. Validate capacity
    const numGuests = parseInt(guest_count, 10);
    if (room.capacity && numGuests > room.capacity) {
      throw new AppError(
        `Guest count (${numGuests}) exceeds room capacity (${room.capacity} maximum).`,
        400
      );
    }

    // 4. Validate dates
    const nights = calculateNights(check_in, check_out);
    if (nights <= 0) {
      throw new AppError('Check-out date must be strictly after check-in date.', 400);
    }

    // 5. Check overlapping active bookings
    const overlapResult = await client.query(
      `SELECT id, reference, check_in, check_out
       FROM bookings
       WHERE room_id = $1
         AND status NOT IN ('cancelled')
         AND check_in < $3
         AND check_out > $2`,
      [room_id, check_in, check_out]
    );

    if (overlapResult.rows.length > 0) {
      throw new AppError(
        'Room is not available for the requested dates. A conflicting reservation already exists.',
        409
      );
    }

    // 6. Calculate total amount
    const total_amount = (nights * parseFloat(room.price_per_night)).toFixed(2);

    // 7. Generate reference
    const reference = await generateReference();

    // 8. Insert new booking
    const insertResult = await client.query(
      `INSERT INTO bookings (reference, room_id, guest_name, guest_email, guest_phone, guest_count, check_in, check_out, total_amount, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [reference, room_id, guest_name, guest_email || null, guest_phone || null, numGuests, check_in, check_out, total_amount, status, notes || '']
    );

    await client.query('COMMIT');

    return {
      ...insertResult.rows[0],
      room_number: room.room_number,
      room_name: room.name,
      room_type: room.type,
      nights,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update an existing booking.
 */
const updateBooking = async (id, bookingData) => {
  const existing = await getBookingById(id);

  const {
    room_id,
    guest_name,
    guest_email,
    guest_phone,
    guest_count,
    check_in,
    check_out,
    status,
    notes,
  } = bookingData;

  const finalRoomId = room_id !== undefined ? parseInt(room_id, 10) : existing.room_id;
  const finalCheckIn = check_in || existing.check_in;
  const finalCheckOut = check_out || existing.check_out;
  const finalGuestCount = guest_count !== undefined ? parseInt(guest_count, 10) : existing.guest_count;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Retrieve target room
    const roomResult = await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [finalRoomId]);
    if (roomResult.rows.length === 0) {
      throw new AppError('Selected room was not found.', 404);
    }
    const room = roomResult.rows[0];

    // Validate capacity
    if (room.capacity && finalGuestCount > room.capacity) {
      throw new AppError(
        `Guest count (${finalGuestCount}) exceeds room capacity (${room.capacity} maximum).`,
        400
      );
    }

    // Validate date sequence
    const nights = calculateNights(finalCheckIn, finalCheckOut);
    if (nights <= 0) {
      throw new AppError('Check-out date must be strictly after check-in date.', 400);
    }

    // If room or dates changed, re-validate availability excluding this booking
    if (room_id || check_in || check_out) {
      const overlapResult = await client.query(
        `SELECT id, reference, check_in, check_out
         FROM bookings
         WHERE room_id = $1
           AND id != $4
           AND status NOT IN ('cancelled')
           AND check_in < $3
           AND check_out > $2`,
        [finalRoomId, finalCheckIn, finalCheckOut, id]
      );

      if (overlapResult.rows.length > 0) {
        throw new AppError(
          'Room is not available for the updated dates. A conflicting reservation already exists.',
          409
        );
      }
    }

    // Recalculate amount
    const total_amount = (nights * parseFloat(room.price_per_night)).toFixed(2);

    const updateResult = await client.query(
      `UPDATE bookings SET
         room_id = COALESCE($1, room_id),
         guest_name = COALESCE($2, guest_name),
         guest_email = COALESCE($3, guest_email),
         guest_phone = COALESCE($4, guest_phone),
         guest_count = COALESCE($5, guest_count),
         check_in = COALESCE($6, check_in),
         check_out = COALESCE($7, check_out),
         total_amount = $8,
         status = COALESCE($9, status),
         notes = COALESCE($10, notes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [room_id, guest_name, guest_email, guest_phone, guest_count, check_in, check_out, total_amount, status, notes, id]
    );

    await client.query('COMMIT');

    return {
      ...updateResult.rows[0],
      room_number: room.room_number,
      room_name: room.name,
      room_type: room.type,
      nights,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update booking status only.
 */
const updateBookingStatus = async (id, status) => {
  await getBookingById(id);

  const result = await pool.query(
    'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, id]
  );

  return result.rows[0];
};

/**
 * Get booking statistics overview for dashboard.
 */
const getBookingStats = async () => {
  const today = new Date().toISOString().split('T')[0];

  const pendingResult = await pool.query(
    "SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending'"
  );

  const confirmedResult = await pool.query(
    "SELECT COUNT(*) AS count FROM bookings WHERE status = 'confirmed'"
  );

  const todayCheckInsResult = await pool.query(
    "SELECT COUNT(*) AS count FROM bookings WHERE check_in = $1 AND status NOT IN ('cancelled')",
    [today]
  );

  const todayCheckOutsResult = await pool.query(
    "SELECT COUNT(*) AS count FROM bookings WHERE check_out = $1 AND status NOT IN ('cancelled')",
    [today]
  );

  const totalResult = await pool.query('SELECT COUNT(*) AS count FROM bookings');

  return {
    total_bookings: parseInt(totalResult.rows[0]?.count || 0, 10),
    pending_bookings: parseInt(pendingResult.rows[0]?.count || 0, 10),
    confirmed_bookings: parseInt(confirmedResult.rows[0]?.count || 0, 10),
    today_check_ins: parseInt(todayCheckInsResult.rows[0]?.count || 0, 10),
    today_check_outs: parseInt(todayCheckOutsResult.rows[0]?.count || 0, 10),
  };
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  getBookingStats,
  checkOverlap,
};
