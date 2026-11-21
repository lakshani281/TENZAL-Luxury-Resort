const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { validateCreateBooking, validateUpdateBooking, validateBookingStatusUpdate } = require('../validators/bookingValidator');

// Static routes MUST come before parameterized routes
router.get('/stats/overview', bookingController.getBookingStats);

// CRUD routes
router.get('/', bookingController.getAllBookings);
router.post('/', validateCreateBooking, bookingController.createBooking);

// Parameterized routes
router.get('/:id', bookingController.getBookingById);
router.put('/:id', validateUpdateBooking, bookingController.updateBooking);
router.patch('/:id/status', validateBookingStatusUpdate, bookingController.updateBookingStatus);

module.exports = router;
