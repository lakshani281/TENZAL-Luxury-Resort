/**
 * Authentication Routes
 * TENZAL Luxury Resort - User Management Module | Student ID: 22CIS0274
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, createRateLimiter } = require('../middleware/auth');

// Rate limiter for auth endpoints: 15 minutes, max 20 attempts
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many authentication attempts',
});

// Public authentication routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);

// Protected authentication routes
router.post('/refresh', authenticate, authController.refresh);
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
