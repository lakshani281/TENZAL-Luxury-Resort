const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller');

/**
 * Food Ordering Module Routes
 * Base mount point: /api/food
 */

// 1. GET /api/food/categories - List categories (active by default, all=true supported)
router.get('/categories', foodController.getCategories);

// 4. GET /api/food/specials - List active daily specials
router.get('/specials', foodController.getDailySpecials);

// 2. GET /api/food/items - List food items with filters and search
router.get('/items', foodController.getFoodItems);

// 3. GET /api/food/items/:id - Get single food item by ID with category info
router.get('/items/:id', foodController.getFoodItemById);

module.exports = router;
