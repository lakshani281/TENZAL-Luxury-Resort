const bookingService = require('../services/bookingService');

/**
 * GET /api/bookings
 * List all bookings with optional filtering and pagination.
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const result = await bookingService.getAllBookings({ search, status, page, limit });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/stats/overview
 * Dashboard statistics for bookings.
 */
const getBookingStats = async (_req, res, next) => {
  try {
    const stats = await bookingService.getBookingStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id
 * Get a single booking by ID (with room info).
 * Admin and staff have unrestricted access; guests may only access their own booking (matched by verified JWT email).
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    const userRole = (req.user?.role || '').toLowerCase();

    if (!['admin', 'staff'].includes(userRole)) {
      const bookingEmail = (booking.guest_email || '').trim().toLowerCase();
      const userEmail = (req.user?.email || '').trim().toLowerCase();

      if (!bookingEmail || !userEmail || bookingEmail !== userEmail) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this booking.',
        });
      }
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings
 * Create a new booking.
 * Guests: bound to verified JWT email and forced to 'pending' status.
 * Admin/Staff: may create bookings on behalf of any guest.
 */
const createBooking = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    let payload = { ...req.body };

    if (userRole === 'guest') {
      payload = {
        ...payload,
        guest_email: req.user.email,
        status: 'pending',
      };
    }

    const booking = await bookingService.createBooking(payload);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id
 * Update a booking.
 */
const updateBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.updateBooking(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Booking updated successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/bookings/:id/status
 * Update booking status.
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await bookingService.updateBookingStatus(req.params.id, req.body.status);

    res.json({
      success: true,
      message: 'Booking status updated successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  getBookingStats,
};
