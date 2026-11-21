const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller');
const { orderTrackingRateLimiter, orderCreationRateLimiter } = require('../middleware/rateLimiter');

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

// 5. POST /api/food/orders - Create in-room dining order (rate limited: 10 req/min per IP)
router.post('/orders', orderCreationRateLimiter, foodController.createOrder);

// 5.1 GET /api/food/orders/code/:order_code - Safe public order progress tracking (rate limited: 30 req/min per IP)
// Registered BEFORE /orders/:id to prevent route shadowing/collision
router.get('/orders/code/:order_code', orderTrackingRateLimiter, foodController.getOrderTrackingByCode);

// 6. GET /api/food/orders/:id - Get single order by internal ID (BLOCKED: Authentication required)
router.get('/orders/:id', foodController.getOrderById);

module.exports = router;
