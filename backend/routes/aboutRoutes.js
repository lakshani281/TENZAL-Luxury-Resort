/**
 * About Us Content Routes
 * TENZAL Luxury Resort - User Management & About Us Module | Student ID: 22CIS0274
 */

const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
const { authenticate, authorize } = require('../middleware/auth');

// Public read access to About Us resort content
router.get('/', aboutController.getAboutContent);

// Admin-only update to About Us resort content
router.put('/', authenticate, authorize('admin'), aboutController.updateAboutContent);

module.exports = router;
