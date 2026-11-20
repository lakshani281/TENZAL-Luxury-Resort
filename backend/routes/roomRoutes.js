const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { validateCreateRoom, validateUpdateRoom, validateStatusUpdate } = require('../validators/roomValidator');

// Static routes MUST come before parameterized routes
router.get('/stats/overview', roomController.getRoomStats);
router.get('/availability/check', roomController.checkAllRoomsAvailability);

// CRUD routes
router.get('/', roomController.getAllRooms);
router.post('/', validateCreateRoom, roomController.createRoom);

// Parameterized routes
router.get('/:id', roomController.getRoomById);
router.put('/:id', validateUpdateRoom, roomController.updateRoom);
router.patch('/:id/status', validateStatusUpdate, roomController.updateRoomStatus);
router.get('/:id/availability', roomController.checkRoomAvailability);

module.exports = router;
