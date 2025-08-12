const express = require('express');
const router = express.Router();
const BacktestController = require('../controllers/backtestController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas principales
router.get('/', BacktestController.getBacktests);
router.get('/completed', BacktestController.getCompletedBacktests);
router.get('/summary', BacktestController.getBacktestSummary);
router.get('/:id', BacktestController.getBacktestById);

// Operaciones CRUD
router.post('/', BacktestController.createBacktest);
router.put('/:id', BacktestController.updateBacktest);
router.delete('/:id', BacktestController.deleteBacktest);

// Control de ejecución
router.post('/:id/start', BacktestController.startBacktest);
router.post('/:id/stop', BacktestController.stopBacktest);

module.exports = router;
