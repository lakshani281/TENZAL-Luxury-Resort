/**
 * Global error handling middleware for Express.
 * Catches all errors thrown or passed via next(err).
 */

// Custom application error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle PostgreSQL unique violation
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with that value already exists.';
    if (err.detail) {
      // Extract the field name from the detail message
      const match = err.detail.match(/\((.+?)\)/);
      if (match) {
        message = `Duplicate value for field: ${match[1]}`;
      }
    }
  }

  // Handle PostgreSQL foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
  }

  // Handle PostgreSQL check constraint violation
  if (err.code === '23514') {
    statusCode = 400;
    message = 'Invalid value provided. Check constraint violated.';
    if (err.constraint === 'check_dates') {
      message = 'Check-out date must be after check-in date.';
    }
  }

  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.code && { code: err.code }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };
