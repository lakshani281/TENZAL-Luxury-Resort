const { AppError } = require('../middleware/errorHandler');

const VALID_STATUSES = ['active', 'inactive', 'maintenance'];

/**
 * Validate room creation payload.
 */
const validateCreateRoom = (req, _res, next) => {
  const { room_number, name, price_per_night } = req.body;
  const errors = [];

  if (!room_number || !room_number.toString().trim()) {
    errors.push('Room number is required.');
  }

  if (!name || !name.toString().trim()) {
    errors.push('Room name is required.');
  }

  if (price_per_night === undefined || price_per_night === null) {
    errors.push('Price per night is required.');
  } else if (isNaN(price_per_night) || Number(price_per_night) <= 0) {
    errors.push('Price per night must be a positive number.');
  }

  if (req.body.capacity !== undefined) {
    if (isNaN(req.body.capacity) || Number(req.body.capacity) < 1) {
      errors.push('Capacity must be a positive integer.');
    }
  }

  if (req.body.size_sqm !== undefined && req.body.size_sqm !== null) {
    if (isNaN(req.body.size_sqm) || Number(req.body.size_sqm) <= 0) {
      errors.push('Size must be a positive number.');
    }
  }

  if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  if (req.body.amenities && !Array.isArray(req.body.amenities)) {
    errors.push('Amenities must be an array.');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(' '), 400));
  }

  next();
};

/**
 * Validate room update payload.
 */
const validateUpdateRoom = (req, _res, next) => {
  const errors = [];

  if (req.body.room_number !== undefined && !req.body.room_number.toString().trim()) {
    errors.push('Room number cannot be empty.');
  }

  if (req.body.name !== undefined && !req.body.name.toString().trim()) {
    errors.push('Room name cannot be empty.');
  }

  if (req.body.price_per_night !== undefined) {
    if (isNaN(req.body.price_per_night) || Number(req.body.price_per_night) <= 0) {
      errors.push('Price per night must be a positive number.');
    }
  }

  if (req.body.capacity !== undefined) {
    if (isNaN(req.body.capacity) || Number(req.body.capacity) < 1) {
      errors.push('Capacity must be a positive integer.');
    }
  }

  if (req.body.size_sqm !== undefined && req.body.size_sqm !== null) {
    if (isNaN(req.body.size_sqm) || Number(req.body.size_sqm) <= 0) {
      errors.push('Size must be a positive number.');
    }
  }

  if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  if (req.body.amenities && !Array.isArray(req.body.amenities)) {
    errors.push('Amenities must be an array.');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(' '), 400));
  }

  next();
};

/**
 * Validate room status update.
 */
const validateStatusUpdate = (req, _res, next) => {
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
  validateCreateRoom,
  validateUpdateRoom,
  validateStatusUpdate,
};
