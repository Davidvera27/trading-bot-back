const express = require('express');
const router = express.Router();
const MarketController = require('../controllers/marketController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rutas públicas
router.get('/', MarketController.getMarkets);
router.get('/active', MarketController.getActiveMarkets);
router.get('/exchanges', MarketController.getExchanges);
router.get('/symbol/:symbol', MarketController.getMarketBySymbol);
router.get('/:id', MarketController.getMarketById);

// Rutas protegidas (solo admin)
router.post('/', authenticateToken, requireAdmin, MarketController.createMarket);
router.put('/:id', authenticateToken, requireAdmin, MarketController.updateMarket);
router.delete('/:id', authenticateToken, requireAdmin, MarketController.deleteMarket);

module.exports = router;
