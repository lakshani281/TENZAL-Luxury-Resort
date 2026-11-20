/**
 * Room Service for TENZAL Luxury Resort
 * Room Booking Module | Student ID: 22CIS0276
 */

const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all rooms with optional filtering.
 */
const getAllRooms = async ({ search, status }) => {
  let query = 'SELECT * FROM rooms WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (room_number ILIKE $${paramIndex} OR name ILIKE $${paramIndex} OR type ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (status && status !== 'all') {
    query += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  query += ' ORDER BY room_number ASC';

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Get a single room by ID.
 */
const getRoomById = async (id) => {
  const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Room not found.', 404);
  }

  return result.rows[0];
};

/**
 * Create a new room.
 */
const createRoom = async (roomData) => {
  const {
    room_number,
    name,
    description,
    type = 'Standard',
    price_per_night,
    capacity = 2,
    size_sqm,
    amenities,
    image_url,
    status = 'active',
    notes,
  } = roomData;

  const result = await pool.query(
    `INSERT INTO rooms (room_number, name, description, type, price_per_night, capacity, size_sqm, amenities, image_url, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      room_number,
      name,
      description,
      type,
      price_per_night,
      capacity,
      size_sqm,
      amenities || null,
      image_url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      status,
      notes,
    ]
  );

  return result.rows[0];
};

/**
 * Update an existing room.
 */
const updateRoom = async (id, roomData) => {
  await getRoomById(id);

  const {
    room_number,
    name,
    description,
    type,
    price_per_night,
    capacity,
    size_sqm,
    amenities,
    image_url,
    status,
    notes,
  } = roomData;

  const result = await pool.query(
    `UPDATE rooms SET
       room_number = COALESCE($1, room_number),
       name = COALESCE($2, name),
       description = COALESCE($3, description),
       type = COALESCE($4, type),
       price_per_night = COALESCE($5, price_per_night),
       capacity = COALESCE($6, capacity),
       size_sqm = COALESCE($7, size_sqm),
       amenities = COALESCE($8, amenities),
       image_url = COALESCE($9, image_url),
       status = COALESCE($10, status),
       notes = COALESCE($11, notes),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $12
     RETURNING *`,
    [room_number, name, description, type, price_per_night, capacity, size_sqm, amenities, image_url, status, notes, id]
  );

  return result.rows[0];
};

/**
 * Update room status only.
 */
const updateRoomStatus = async (id, status) => {
  await getRoomById(id);

  const result = await pool.query(
    'UPDATE rooms SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, id]
  );

  return result.rows[0];
};

/**
 * Check room availability for a specific date range.
 */
const checkRoomAvailability = async (roomId, checkIn, checkOut) => {
  const room = await getRoomById(roomId);

  if (room.status !== 'active') {
    return {
      room_id: room.id,
      room_number: room.room_number,
      room_name: room.name,
      check_in: checkIn,
      check_out: checkOut,
      is_available: false,
      reason: `Room status is currently '${room.status}'`,
      conflicting_bookings: [],
    };
  }

  const result = await pool.query(
    `SELECT id, reference, check_in, check_out, guest_name, status
     FROM bookings
     WHERE room_id = $1
       AND status NOT IN ('cancelled')
       AND check_in < $3
       AND check_out > $2`,
    [roomId, checkIn, checkOut]
  );

  return {
    room_id: room.id,
    room_number: room.room_number,
    room_name: room.name,
    capacity: room.capacity,
    price_per_night: room.price_per_night,
    check_in: checkIn,
    check_out: checkOut,
    is_available: result.rows.length === 0,
    conflicting_bookings: result.rows,
  };
};

/**
 * Get room statistics overview for dashboard.
 */
const getRoomStats = async () => {
  const totalResult = await pool.query('SELECT COUNT(*) AS total FROM rooms');
  const activeResult = await pool.query("SELECT COUNT(*) AS count FROM rooms WHERE status = 'active'");
  const maintenanceResult = await pool.query("SELECT COUNT(*) AS count FROM rooms WHERE status = 'maintenance'");
  const inactiveResult = await pool.query("SELECT COUNT(*) AS count FROM rooms WHERE status = 'inactive'");

  return {
    total_rooms: parseInt(totalResult.rows[0]?.total || 0, 10),
    active_rooms: parseInt(activeResult.rows[0]?.count || 0, 10),
    maintenance_rooms: parseInt(maintenanceResult.rows[0]?.count || 0, 10),
    inactive_rooms: parseInt(inactiveResult.rows[0]?.count || 0, 10),
  };
};

/**
 * Check availability across all rooms for a date range.
 */
const checkAllRoomsAvailability = async (checkIn, checkOut) => {
  if (!checkIn || !checkOut) {
    throw new AppError('checkIn and checkOut query parameters are required.', 400);
  }

  if (isNaN(Date.parse(checkIn)) || isNaN(Date.parse(checkOut))) {
    throw new AppError('Invalid date format for checkIn or checkOut.', 400);
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    throw new AppError('checkOut must be after checkIn.', 400);
  }

  const roomsResult = await pool.query("SELECT * FROM rooms WHERE status = 'active' ORDER BY room_number ASC");

  const conflictsResult = await pool.query(
    `SELECT DISTINCT room_id
     FROM bookings
     WHERE status NOT IN ('cancelled')
       AND check_in < $2
       AND check_out > $1`,
    [checkIn, checkOut]
  );

  const occupiedRoomIds = new Set(conflictsResult.rows.map((r) => r.room_id));

  const rooms = roomsResult.rows.map((room) => ({
    ...room,
    is_available: !occupiedRoomIds.has(room.id),
  }));

  return {
    check_in: checkIn,
    check_out: checkOut,
    total_rooms: rooms.length,
    available_count: rooms.filter((r) => r.is_available).length,
    rooms,
  };
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  updateRoomStatus,
  checkRoomAvailability,
  getRoomStats,
  checkAllRoomsAvailability,
};
