const roomService = require('../services/roomService');

/**
 * GET /api/rooms
 * List all rooms with optional search and status filter.
 */
const getAllRooms = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const rooms = await roomService.getAllRooms({ search, status });

    res.json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rooms/stats/overview
 * Dashboard statistics for rooms.
 */
const getRoomStats = async (_req, res, next) => {
  try {
    const stats = await roomService.getRoomStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rooms/availability/check
 * Check availability across all rooms for a date range.
 */
const checkAllRoomsAvailability = async (req, res, next) => {
  try {
    const { checkIn, checkOut } = req.query;
    const availability = await roomService.checkAllRoomsAvailability(checkIn, checkOut);

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rooms/:id
 * Get a single room by ID.
 */
const getRoomById = async (req, res, next) => {
  try {
    const room = await roomService.getRoomById(req.params.id);

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rooms
 * Create a new room.
 */
const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.body);

    res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/rooms/:id
 * Update a room.
 */
const updateRoom = async (req, res, next) => {
  try {
    const room = await roomService.updateRoom(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Room updated successfully.',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/rooms/:id/status
 * Update room status.
 */
const updateRoomStatus = async (req, res, next) => {
  try {
    const room = await roomService.updateRoomStatus(req.params.id, req.body.status);

    res.json({
      success: true,
      message: 'Room status updated successfully.',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rooms/:id/availability
 * Check room availability for a specific date range.
 */
const checkRoomAvailability = async (req, res, next) => {
  try {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'checkIn and checkOut query parameters are required.',
      });
    }

    const availability = await roomService.checkRoomAvailability(
      req.params.id,
      checkIn,
      checkOut
    );

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
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
