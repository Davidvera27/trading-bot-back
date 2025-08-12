const bcrypt = require('bcryptjs');
const { User } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserUpdateRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [trader, admin]
 *         isActive:
 *           type: boolean
 *         apiKey:
 *           type: string
 *         apiSecret:
 *           type: string
 *     UserPasswordUpdateRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *         newPassword:
 *           type: string
 *     UserListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

class UserController {
  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Obtener lista de usuarios (solo admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Elementos por página
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Buscar por username o email
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [trader, admin]
   *         description: Filtrar por rol
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo
   *     responses:
   *       200:
   *         description: Lista de usuarios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserListResponse'
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   */
  static async getUsers(req, res) {
    try {
      // Verificar si es admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden ver todos los usuarios.'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Construir filtros
      const where = {};
      if (req.query.search) {
        where[require('sequelize').Op.or] = [
          { username: { [require('sequelize').Op.iLike]: `%${req.query.search}%` } },
          { email: { [require('sequelize').Op.iLike]: `%${req.query.search}%` } }
        ];
      }
      if (req.query.role) {
        where.role = req.query.role;
      }
      if (req.query.isActive !== undefined) {
        where.isActive = req.query.isActive === 'true';
      }

      // Obtener usuarios con paginación
      const { count, rows: users } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        users,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Obtener usuario por ID
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del usuario
   *     responses:
   *       200:
   *         description: Usuario encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Usuario no encontrado
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      // Verificar permisos: solo puede ver su propio perfil o ser admin
      if (req.user.role !== 'admin' && req.user.userId !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo puedes ver tu propio perfil.'
        });
      }

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Actualizar usuario
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserUpdateRequest'
   *     responses:
   *       200:
   *         description: Usuario actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Usuario no encontrado
   *       409:
   *         description: Usuario o email ya existe
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verificar permisos: solo puede actualizar su propio perfil o ser admin
      if (req.user.role !== 'admin' && req.user.userId !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo puedes actualizar tu propio perfil.'
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar si el email o username ya existe (si se está actualizando)
      if (updateData.email || updateData.username) {
        const existingUser = await User.findOne({
          where: {
            [require('sequelize').Op.and]: [
              {
                [require('sequelize').Op.or]: [
                  updateData.email ? { email: updateData.email } : {},
                  updateData.username ? { username: updateData.username } : {}
                ]
              },
              { id: { [require('sequelize').Op.ne]: id } }
            ]
          }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'El email o username ya está en uso'
          });
        }
      }

      // Solo admin puede cambiar rol y estado activo
      if (req.user.role !== 'admin') {
        delete updateData.role;
        delete updateData.isActive;
      }

      await user.update(updateData);

      // Obtener usuario actualizado sin contraseña
      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/users/{id}/password:
   *   put:
   *     summary: Cambiar contraseña del usuario
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserPasswordUpdateRequest'
   *     responses:
   *       200:
   *         description: Contraseña actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: No autorizado o contraseña actual incorrecta
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Usuario no encontrado
   */
  static async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Verificar permisos: solo puede cambiar su propia contraseña
      if (req.user.userId !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo puedes cambiar tu propia contraseña.'
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Encriptar nueva contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await user.update({ password: hashedPassword });

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     summary: Eliminar usuario (solo admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del usuario
   *     responses:
   *       200:
   *         description: Usuario eliminado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Usuario no encontrado
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Verificar si es admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden eliminar usuarios.'
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // No permitir eliminar el propio usuario admin
      if (req.user.userId === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta'
        });
      }

      await user.destroy();

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/users/{id}/toggle-status:
   *   put:
   *     summary: Activar/desactivar usuario (solo admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del usuario
   *     responses:
   *       200:
   *         description: Estado del usuario actualizado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Usuario no encontrado
   */
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;

      // Verificar si es admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden cambiar el estado de usuarios.'
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // No permitir desactivar el propio usuario admin
      if (req.user.userId === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes desactivar tu propia cuenta'
        });
      }

      await user.update({ isActive: !user.isActive });

      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      res.json({
        success: true,
        message: `Usuario ${user.isActive ? 'desactivado' : 'activado'} exitosamente`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = UserController;
