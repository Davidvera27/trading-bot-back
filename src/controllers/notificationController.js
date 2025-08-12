const { Notification, User } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - user_id
 *         - type
 *         - title
 *         - message
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la notificación
 *         user_id:
 *           type: integer
 *           description: ID del usuario que recibe la notificación
 *         type:
 *           type: string
 *           enum: [order_executed, order_cancelled, position_opened, position_closed, stop_loss_triggered, take_profit_triggered, strategy_activated, strategy_deactivated, error_occurred, system_alert, price_alert, backtest_completed]
 *           description: Tipo de notificación
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Título de la notificación
 *         message:
 *           type: string
 *           description: Mensaje de la notificación
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           default: medium
 *           description: Prioridad de la notificación
 *         isRead:
 *           type: boolean
 *           default: false
 *           description: Indica si la notificación ha sido leída
 *         isSent:
 *           type: boolean
 *           default: false
 *           description: Indica si la notificación ha sido enviada
 *         sentAt:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de envío
 *         deliveryMethods:
 *           type: object
 *           properties:
 *             email:
 *               type: boolean
 *             sms:
 *               type: boolean
 *             push:
 *               type: boolean
 *             webhook:
 *               type: boolean
 *           default: {"email":false,"sms":false,"push":false,"webhook":false}
 *           description: Métodos de entrega configurados
 *         metadata:
 *           type: object
 *           description: Datos adicionales de la notificación
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/User'
 */

class NotificationController {
  /**
   * @swagger
   * /api/notifications/count:
   *   get:
   *     summary: Obtener conteo de notificaciones del usuario
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Conteo de notificaciones
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     unread:
   *                       type: integer
   *                     highPriority:
   *                       type: integer
   *       401:
   *         description: No autorizado
   */
  static async getNotificationCount(req, res) {
    try {
      const userId = req.user.userId;

      const [total, unread, highPriority] = await Promise.all([
        Notification.count({ where: { user_id: userId } }),
        Notification.count({ where: { user_id: userId, isRead: false } }),
        Notification.count({ where: { user_id: userId, priority: 'high' } })
      ]);

      res.json({
        success: true,
        data: {
          total,
          unread,
          highPriority
        }
      });
    } catch (error) {
      console.error('Error al obtener conteo de notificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     summary: Obtener notificaciones del usuario
   *     tags: [Notifications]
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
   *           default: 20
   *         description: Número de elementos por página
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Filtrar por tipo de notificación
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *         description: Filtrar por prioridad
   *       - in: query
   *         name: isRead
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado de lectura
   *     responses:
   *       200:
   *         description: Lista de notificaciones
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Notification'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     pages:
   *                       type: integer
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20, type, priority, isRead } = req.query;
      const userId = req.user.id;
      const offset = (page - 1) * limit;

      const where = { user_id: userId };
      if (type) where.type = type;
      if (priority) where.priority = priority;
      if (isRead !== undefined) where.isRead = isRead === 'true';

      const { count, rows } = await Notification.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: totalPages
        }
      });
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/{id}:
   *   get:
   *     summary: Obtener notificación por ID
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la notificación
   *     responses:
   *       200:
   *         description: Notificación encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Notification'
   *       404:
   *         description: Notificación no encontrada
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async getNotificationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id, user_id: userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ]
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Error al obtener notificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificación',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/notifications:
   *   post:
   *     summary: Crear nueva notificación
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - type
   *               - title
   *               - message
   *             properties:
   *               user_id:
   *                 type: integer
   *                 description: ID del usuario que recibe la notificación
   *               type:
   *                 type: string
   *                 enum: [order_executed, order_cancelled, position_opened, position_closed, stop_loss_triggered, take_profit_triggered, strategy_activated, strategy_deactivated, error_occurred, system_alert, price_alert, backtest_completed]
   *               title:
   *                 type: string
   *                 maxLength: 200
   *               message:
   *                 type: string
   *               priority:
   *                 type: string
   *                 enum: [low, medium, high, critical]
   *                 default: medium
   *               deliveryMethods:
   *                 type: object
   *                 properties:
   *                   email:
   *                     type: boolean
   *                   sms:
   *                     type: boolean
   *                   push:
   *                     type: boolean
   *                   webhook:
   *                     type: boolean
   *               metadata:
   *                 type: object
   *     responses:
   *       201:
   *         description: Notificación creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Notification'
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async createNotification(req, res) {
    try {
      const {
        user_id,
        type,
        title,
        message,
        priority = 'medium',
        deliveryMethods = { email: false, sms: false, push: false, webhook: false },
        metadata = {}
      } = req.body;

      // Verificar que el usuario existe
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const notification = await Notification.create({
        user_id,
        type,
        title,
        message,
        priority,
        deliveryMethods,
        metadata
      });

      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Error al crear notificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear notificación',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/{id}:
   *   put:
   *     summary: Actualizar notificación
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la notificación
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *               title:
   *                 type: string
   *               message:
   *                 type: string
   *               priority:
   *                 type: string
   *               isRead:
   *                 type: boolean
   *               isSent:
   *                 type: boolean
   *               deliveryMethods:
   *                 type: object
   *               metadata:
   *                 type: object
   *     responses:
   *       200:
   *         description: Notificación actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Notification'
   *       404:
   *         description: Notificación no encontrada
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async updateNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const notification = await Notification.findOne({
        where: { id, user_id: userId }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      await notification.update(updateData);

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Error al actualizar notificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar notificación',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/{id}:
   *   delete:
   *     summary: Eliminar notificación
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la notificación
   *     responses:
   *       200:
   *         description: Notificación eliminada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       404:
   *         description: Notificación no encontrada
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id, user_id: userId }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      await notification.destroy();

      res.json({
        success: true,
        message: 'Notificación eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar notificación',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/unread:
   *   get:
   *     summary: Obtener notificaciones no leídas
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Número máximo de notificaciones a obtener
   *     responses:
   *       200:
   *         description: Lista de notificaciones no leídas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Notification'
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async getUnreadNotifications(req, res) {
    try {
      const { limit = 50 } = req.query;
      const userId = req.user.id;

      const notifications = await Notification.getUnreadNotifications(userId, parseInt(limit));

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error al obtener notificaciones no leídas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones no leídas',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/mark-read/{id}:
   *   put:
   *     summary: Marcar notificación como leída
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la notificación
   *     responses:
   *       200:
   *         description: Notificación marcada como leída
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Notification'
   *       404:
   *         description: Notificación no encontrada
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id, user_id: userId }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

      await notification.update({ isRead: true });

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar notificación como leída',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/mark-all-read:
   *   put:
   *     summary: Marcar todas las notificaciones como leídas
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Todas las notificaciones marcadas como leídas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 count:
   *                   type: integer
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const count = await Notification.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas',
        count
      });
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar todas las notificaciones como leídas',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/high-priority:
   *   get:
   *     summary: Obtener notificaciones de alta prioridad
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Número máximo de notificaciones a obtener
   *     responses:
   *       200:
   *         description: Lista de notificaciones de alta prioridad
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Notification'
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async getHighPriorityNotifications(req, res) {
    try {
      const { limit = 20 } = req.query;
      const userId = req.user.id;

      const notifications = await Notification.getHighPriorityNotifications(userId, parseInt(limit));

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error al obtener notificaciones de alta prioridad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones de alta prioridad',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/unsent:
   *   get:
   *     summary: Obtener notificaciones no enviadas
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Número máximo de notificaciones a obtener
   *     responses:
   *       200:
   *         description: Lista de notificaciones no enviadas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Notification'
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async getUnsentNotifications(req, res) {
    try {
      const { limit = 50 } = req.query;
      const userId = req.user.id;

      const notifications = await Notification.getUnsentNotifications(userId, parseInt(limit));

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error al obtener notificaciones no enviadas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones no enviadas',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/notifications/cleanup:
   *   delete:
   *     summary: Limpiar notificaciones antiguas
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 30
   *         description: Número de días para mantener las notificaciones
   *     responses:
   *       200:
   *         description: Notificaciones antiguas eliminadas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 count:
   *                   type: integer
   *       401:
   *         description: No autorizado
   *       500:
   *         description: Error del servidor
   */
  static async cleanupOldNotifications(req, res) {
    try {
      const { days = 30 } = req.query;
      const userId = req.user.id;

      const count = await Notification.deleteOldNotifications(userId, parseInt(days));

      res.json({
        success: true,
        message: 'Notificaciones antiguas eliminadas',
        count
      });
    } catch (error) {
      console.error('Error al limpiar notificaciones antiguas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al limpiar notificaciones antiguas',
        error: error.message
      });
    }
  }
}

module.exports = NotificationController;
