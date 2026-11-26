const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateCreateRoom, validateUpdateRoom, validateStatusUpdate } = require('../validators/roomValidator');

// Static routes MUST come before parameterized routes
router.get('/stats/overview', authenticate, authorize('admin', 'staff'), roomController.getRoomStats);
router.get('/availability/check', roomController.checkAllRoomsAvailability);

// Public room catalog & availability routes
router.get('/', roomController.getAllRooms);

// Admin & Staff room management routes
router.post('/', authenticate, authorize('admin', 'staff'), validateCreateRoom, roomController.createRoom);

// Parameterized routes
router.get('/:id', roomController.getRoomById);
router.put('/:id', authenticate, authorize('admin', 'staff'), validateUpdateRoom, roomController.updateRoom);
router.patch('/:id/status', authenticate, authorize('admin', 'staff'), validateStatusUpdate, roomController.updateRoomStatus);
router.get('/:id/availability', roomController.checkRoomAvailability);

module.exports = router;
