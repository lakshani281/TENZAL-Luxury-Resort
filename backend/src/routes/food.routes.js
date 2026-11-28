const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller');
const { orderTrackingRateLimiter, orderCreationRateLimiter } = require('../middleware/rateLimiter');
const { authenticate, authorize } = require('../../middleware/auth');

/**
 * Optional Authentication Middleware for Order Creation
 * - If no Authorization header is supplied: allows anonymous in-room guest checkout (req.user = null).
 * - If an Authorization header is supplied: strictly validates the JWT via User Management authenticate().
 * - Rejects invalid, expired, malformed, or deactivated tokens with HTTP 401/403.
 * - Never silently downgrades an invalid supplied token to anonymous access.
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }
  return authenticate(req, res, next);
}

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

// 5. POST /api/food/orders - Create in-room dining order (rate limited + optional JWT authentication)
router.post('/orders', orderCreationRateLimiter, optionalAuthenticate, foodController.createOrder);

// 5.0 GET /api/food/orders - List all resort orders with filters & pagination (Staff & Admin only)
router.get(
  '/orders',
  authenticate,
  authorize('staff', 'admin'),
  foodController.getAllOrders
);

// 5.01 GET /api/food/orders/my-orders - Guest order history (Authenticated guest)
// Registered BEFORE /orders/:id to prevent route shadowing
router.get(
  '/orders/my-orders',
  authenticate,
  foodController.getMyOrders
);

// 5.1 POST /api/food/orders/tracking/batch - Batch public order progress tracking (rate limited: 30 req/min per IP)
router.post('/orders/tracking/batch', orderTrackingRateLimiter, foodController.getBatchOrderTracking);

// 5.2 GET /api/food/orders/code/:order_code - Safe public order progress tracking (rate limited: 30 req/min per IP)
// Registered BEFORE /orders/:id to prevent route shadowing/collision
router.get('/orders/code/:order_code', orderTrackingRateLimiter, foodController.getOrderTrackingByCode);

// 5.3 PATCH /api/food/orders/code/:order_code/status - Update order status (Staff & Admin only)
// Registered BEFORE /orders/:id to prevent route collision
router.patch(
  '/orders/code/:order_code/status',
  authenticate,
  authorize('staff', 'admin'),
  foodController.updateOrderStatus
);

// 6. GET /api/food/orders/:id - Get single order by internal database ID (Authentication & Ownership verification required)
router.get('/orders/:id', authenticate, foodController.getOrderById);

module.exports = router;
