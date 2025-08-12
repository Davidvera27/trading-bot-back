const express = require('express');
const router = express.Router();
const PositionController = require('../controllers/positionController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas principales
router.get('/', PositionController.getPositions);
router.get('/statistics', PositionController.getPositionStatistics);
router.get('/active', PositionController.getActivePositions);
router.get('/closed', PositionController.getClosedPositions);
router.get('/summary', PositionController.getPositionSummary);
router.get('/:id', PositionController.getPositionById);

// Operaciones CRUD
router.post('/', PositionController.createPosition);
router.put('/:id', PositionController.updatePosition);
router.post('/:id/close', PositionController.closePosition);

module.exports = router;
