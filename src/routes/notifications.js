const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas principales
router.get('/count', NotificationController.getNotificationCount);
router.get('/', NotificationController.getNotifications);
router.get('/unread', NotificationController.getUnreadNotifications);
router.get('/high-priority', NotificationController.getHighPriorityNotifications);
router.get('/unsent', NotificationController.getUnsentNotifications);
router.get('/:id', NotificationController.getNotificationById);

// Operaciones CRUD
router.post('/', NotificationController.createNotification);
router.put('/:id', NotificationController.updateNotification);
router.delete('/:id', NotificationController.deleteNotification);

// Operaciones especiales
router.put('/mark-read/:id', NotificationController.markAsRead);
router.put('/mark-all-read', NotificationController.markAllAsRead);
router.delete('/cleanup', NotificationController.cleanupOldNotifications);

module.exports = router;
