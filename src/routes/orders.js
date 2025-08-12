const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de órdenes
router.get('/', OrderController.getOrders);
router.get('/statistics', OrderController.getOrderStatistics);
router.get('/active', OrderController.getActiveOrders);
router.get('/history', OrderController.getOrderHistory);
router.get('/:id', OrderController.getOrderById);
router.post('/', OrderController.createOrder);
router.put('/:id', OrderController.updateOrder);
router.delete('/:id', OrderController.cancelOrder);

module.exports = router;
