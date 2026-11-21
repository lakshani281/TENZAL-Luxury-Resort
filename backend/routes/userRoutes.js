/**
 * User & Profile Management Routes
 * TENZAL Luxury Resort - User Management Module | Student ID: 22CIS0274
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

// Current user profile management
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Roles lookup
router.get('/roles', userController.getRoles);

// Admin-only user management routes
router.get('/', authorize('admin'), userController.getAllUsers);
router.post('/', authorize('admin'), userController.createUser);
router.get('/:id', authorize('admin'), userController.getUserById);
router.put('/:id', authorize('admin'), userController.updateUser);
router.patch('/:id/role', authorize('admin'), userController.updateUserRole);
router.patch('/:id/status', authorize('admin'), userController.updateUserStatus);
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
