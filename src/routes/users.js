const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para administradores
router.get('/', requireAdmin, UserController.getUsers);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.put('/:id/password', UserController.updatePassword);
router.delete('/:id', requireAdmin, UserController.deleteUser);
router.put('/:id/toggle-status', requireAdmin, UserController.toggleUserStatus);

module.exports = router;
