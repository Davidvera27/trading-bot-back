const express = require('express');
const router = express.Router();
const MarketDataController = require('../controllers/marketDataController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rutas públicas (solo lectura)
router.get('/', MarketDataController.getMarketData);
router.get('/latest/:symbol', MarketDataController.getLatestMarketData);
router.get('/history/:symbol', MarketDataController.getMarketDataHistory);
router.get('/:id', MarketDataController.getMarketDataById);

// Rutas protegidas (requieren autenticación)
router.post('/', authenticateToken, requireAdmin, MarketDataController.createMarketData);
router.put('/:id', authenticateToken, requireAdmin, MarketDataController.updateMarketData);
router.delete('/:id', authenticateToken, requireAdmin, MarketDataController.deleteMarketData);

module.exports = router;
