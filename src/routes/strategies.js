const express = require('express');
const router = express.Router();
const StrategyController = require('../controllers/strategyController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de estrategias
router.get('/', StrategyController.getStrategies);
router.get('/statistics', StrategyController.getGeneralStatistics);
router.get('/active', StrategyController.getActiveStrategies);
router.get('/types', StrategyController.getStrategyTypes);
router.get('/:id', StrategyController.getStrategyById);
router.get('/:id/statistics', StrategyController.getStrategyStatistics);
router.post('/', StrategyController.createStrategy);
router.put('/:id', StrategyController.updateStrategy);
router.put('/:id/toggle', StrategyController.toggleStrategy);
router.delete('/:id', StrategyController.deleteStrategy);

module.exports = router;
