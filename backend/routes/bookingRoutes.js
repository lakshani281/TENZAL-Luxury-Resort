const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateCreateBooking, validateUpdateBooking, validateBookingStatusUpdate } = require('../validators/bookingValidator');

// Static routes MUST come before parameterized routes
router.get('/stats/overview', authenticate, authorize('admin', 'staff'), bookingController.getBookingStats);

// Admin & Staff booking management routes
router.get('/', authenticate, authorize('admin', 'staff'), bookingController.getAllBookings);

// Authenticated booking creation (guests create their own pending booking; staff/admin can book on behalf of guests)
router.post('/', authenticate, validateCreateBooking, bookingController.createBooking);

// Parameterized routes
// Single booking lookup: staff/admin unrestricted; guests restricted to their own bookings (verified in controller)
router.get('/:id', authenticate, bookingController.getBookingById);
router.put('/:id', authenticate, authorize('admin', 'staff'), validateUpdateBooking, bookingController.updateBooking);
router.patch('/:id/status', authenticate, authorize('admin', 'staff'), validateBookingStatusUpdate, bookingController.updateBookingStatus);

module.exports = router;
