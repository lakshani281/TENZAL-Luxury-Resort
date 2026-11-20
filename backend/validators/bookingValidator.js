const { AppError } = require('../middleware/errorHandler');

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

/**
 * Validate booking creation payload.
 */
const validateCreateBooking = (req, _res, next) => {
  const { room_id, guest_name, check_in, check_out } = req.body;
  const errors = [];

  if (!room_id) {
    errors.push('Room ID is required.');
  } else if (isNaN(room_id) || Number(room_id) < 1) {
    errors.push('Room ID must be a valid positive integer.');
  }

  if (!guest_name || !guest_name.toString().trim()) {
    errors.push('Guest name is required.');
  }

  if (!check_in) {
    errors.push('Check-in date is required.');
  } else if (isNaN(Date.parse(check_in))) {
    errors.push('Check-in date is not a valid date.');
  }

  if (!check_out) {
    errors.push('Check-out date is required.');
  } else if (isNaN(Date.parse(check_out))) {
    errors.push('Check-out date is not a valid date.');
  }

  // Validate date logic
  if (check_in && check_out && !isNaN(Date.parse(check_in)) && !isNaN(Date.parse(check_out))) {
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    if (checkOutDate <= checkInDate) {
      errors.push('Check-out date must be after check-in date.');
    }
  }

  if (req.body.guest_email !== undefined && req.body.guest_email !== null && req.body.guest_email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.guest_email)) {
      errors.push('Guest email is not valid.');
    }
  }

  if (req.body.guest_count !== undefined) {
    if (isNaN(req.body.guest_count) || Number(req.body.guest_count) < 1) {
      errors.push('Guest count must be a positive integer.');
    }
  }

  if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(' '), 400));
  }

  next();
};

/**
 * Validate booking update payload.
 */
const validateUpdateBooking = (req, _res, next) => {
  const errors = [];

  if (req.body.room_id !== undefined) {
    if (isNaN(req.body.room_id) || Number(req.body.room_id) < 1) {
      errors.push('Room ID must be a valid positive integer.');
    }
  }

  if (req.body.guest_name !== undefined && !req.body.guest_name.toString().trim()) {
    errors.push('Guest name cannot be empty.');
  }

  if (req.body.check_in !== undefined && isNaN(Date.parse(req.body.check_in))) {
    errors.push('Check-in date is not a valid date.');
  }

  if (req.body.check_out !== undefined && isNaN(Date.parse(req.body.check_out))) {
    errors.push('Check-out date is not a valid date.');
  }

  // If both dates are provided, validate ordering
  const checkIn = req.body.check_in;
  const checkOut = req.body.check_out;
  if (checkIn && checkOut && !isNaN(Date.parse(checkIn)) && !isNaN(Date.parse(checkOut))) {
    if (new Date(checkOut) <= new Date(checkIn)) {
      errors.push('Check-out date must be after check-in date.');
    }
  }

  if (req.body.guest_email !== undefined && req.body.guest_email !== null && req.body.guest_email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.guest_email)) {
      errors.push('Guest email is not valid.');
    }
  }

  if (req.body.guest_count !== undefined) {
    if (isNaN(req.body.guest_count) || Number(req.body.guest_count) < 1) {
      errors.push('Guest count must be a positive integer.');
    }
  }

  if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(' '), 400));
  }

  next();
};

/**
 * Validate booking status update.
 */
const validateBookingStatusUpdate = (req, _res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new AppError('Status is required.', 400));
  }

  if (!VALID_STATUSES.includes(status)) {
    return next(new AppError(`Status must be one of: ${VALID_STATUSES.join(', ')}.`, 400));
  }

  next();
};

module.exports = {
  validateCreateBooking,
  validateUpdateBooking,
  validateBookingStatusUpdate,
};
