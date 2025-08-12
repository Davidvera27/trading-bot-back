const { Order, Market, Strategy, User } = require('../models');
const { Op } = require('sequelize');
const RiskManagementService = require('../services/riskManagement');
const { logOrder, logError } = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - user_id
 *         - market_id
 *         - symbol
 *         - side
 *         - type
 *         - quantity
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la orden
 *         user_id:
 *           type: integer
 *           description: ID del usuario propietario
 *         strategy_id:
 *           type: integer
 *           description: ID de la estrategia asociada
 *         market_id:
 *           type: integer
 *           description: ID del mercado
 *         exchangeOrderId:
 *           type: string
 *           description: ID de la orden en el exchange
 *         symbol:
 *           type: string
 *           description: Símbolo del par de trading
 *         side:
 *           type: string
 *           enum: [buy, sell]
 *           description: Lado de la orden (compra/venta)
 *         type:
 *           type: string
 *           enum: [market, limit, stop, stop_limit, oco, trailing_stop]
 *           description: Tipo de orden
 *         quantity:
 *           type: number
 *           format: decimal
 *           description: Cantidad de la orden
 *         price:
 *           type: number
 *           format: decimal
 *           description: Precio de la orden
 *         stopPrice:
 *           type: number
 *           format: decimal
 *           description: Precio de stop
 *         executedQuantity:
 *           type: number
 *           format: decimal
 *           description: Cantidad ejecutada
 *         averagePrice:
 *           type: number
 *           format: decimal
 *           description: Precio promedio de ejecución
 *         status:
 *           type: string
 *           enum: [pending, filled, partially_filled, cancelled, rejected, expired]
 *           description: Estado de la orden
 *         commission:
 *           type: number
 *           format: decimal
 *           description: Comisión cobrada
 *         commissionAsset:
 *           type: string
 *           description: Activo de la comisión
 *         timeInForce:
 *           type: string
 *           enum: [GTC, IOC, FOK]
 *           description: Tiempo en vigor
 *         isReduceOnly:
 *           type: boolean
 *           description: Si es solo reducción
 *         isClosePosition:
 *           type: boolean
 *           description: Si es para cerrar posición
 *         metadata:
 *           type: object
 *           description: Metadatos adicionales
 *     OrderCreateRequest:
 *       type: object
 *       required:
 *         - market_id
 *         - symbol
 *         - side
 *         - type
 *         - quantity
 *       properties:
 *         strategy_id:
 *           type: integer
 *         market_id:
 *           type: integer
 *         symbol:
 *           type: string
 *         side:
 *           type: string
 *           enum: [buy, sell]
 *         type:
 *           type: string
 *           enum: [market, limit, stop, stop_limit, oco, trailing_stop]
 *         quantity:
 *           type: number
 *         price:
 *           type: number
 *         stopPrice:
 *           type: number
 *         timeInForce:
 *           type: string
 *           enum: [GTC, IOC, FOK]
 *         isReduceOnly:
 *           type: boolean
 *         isClosePosition:
 *           type: boolean
 *         metadata:
 *           type: object
 *     OrderUpdateRequest:
 *       type: object
 *       properties:
 *         price:
 *           type: number
 *         stopPrice:
 *           type: number
 *         quantity:
 *           type: number
 *         timeInForce:
 *           type: string
 *           enum: [GTC, IOC, FOK]
 *         metadata:
 *           type: object
 *     OrderListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
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

class OrderController {
  /**
   * @swagger
   * /api/orders:
   *   get:
   *     summary: Obtener lista de órdenes del usuario
   *     tags: [Orders]
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
   *         name: symbol
   *         schema:
   *           type: string
   *         description: Filtrar por símbolo
   *       - in: query
   *         name: side
   *         schema:
   *           type: string
   *           enum: [buy, sell]
   *         description: Filtrar por lado
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [market, limit, stop, stop_limit, oco, trailing_stop]
   *         description: Filtrar por tipo de orden
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, filled, partially_filled, cancelled, rejected, expired]
   *         description: Filtrar por estado
   *       - in: query
   *         name: strategy_id
   *         schema:
   *           type: integer
   *         description: Filtrar por estrategia
   *     responses:
   *       200:
   *         description: Lista de órdenes
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OrderListResponse'
   *       401:
   *         description: No autorizado
   */
  static async getOrders(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Construir filtros
      const where = { user_id: req.user.userId };
      if (req.query.symbol) {
        where.symbol = req.query.symbol;
      }
      if (req.query.side) {
        where.side = req.query.side;
      }
      if (req.query.type) {
        where.type = req.query.type;
      }
      if (req.query.status) {
        where.status = req.query.status;
      }
      if (req.query.strategy_id) {
        where.strategy_id = req.query.strategy_id;
      }

      // Obtener órdenes con paginación e includes
      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['name', 'symbol', 'type']
          },
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['name', 'type']
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/orders/{id}:
   *   get:
   *     summary: Obtener orden por ID
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la orden
   *     responses:
   *       200:
   *         description: Orden encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 order:
   *                   $ref: '#/components/schemas/Order'
   *       401:
   *         description: No autorizado
   *       404:
   *         description: Orden no encontrada
   */
  static async getOrderById(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findOne({
        where: { id, user_id: req.user.userId },
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['name', 'symbol', 'type']
          },
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['name', 'type']
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      res.json({
        success: true,
        order
      });
    } catch (error) {
      console.error('Error al obtener orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/orders:
   *   post:
   *     summary: Crear nueva orden
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/OrderCreateRequest'
   *     responses:
   *       201:
   *         description: Orden creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 order:
   *                   $ref: '#/components/schemas/Order'
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   *       404:
   *         description: Mercado o estrategia no encontrada
   */
  static async createOrder(req, res) {
    try {
      const orderData = {
        ...req.body,
        user_id: req.user.userId
      };

      // Validación de riesgo antes de crear la orden
      const riskValidation = await RiskManagementService.validateOrderRisk(
        req.user.userId, 
        orderData
      );

      if (!riskValidation.valid) {
        return res.status(400).json({
          success: false,
          message: riskValidation.message,
          validations: riskValidation.validations
        });
      }

      // Validar correlación con posiciones existentes
      const correlationValidation = await RiskManagementService.validateCorrelation(
        req.user.userId,
        orderData.symbol
      );

      if (!correlationValidation.valid) {
        return res.status(400).json({
          success: false,
          message: correlationValidation.message
        });
      }

      const order = await Order.create(orderData);
      
      // Log de la orden creada
      logOrder(order.id, 'created', {
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: order.price,
        userId: req.user.userId
      });

      res.status(201).json({
        success: true,
        message: 'Orden creada exitosamente',
        data: order
      });
    } catch (error) {
      logError(error, { userId: req.user.userId, orderData: req.body });
      res.status(500).json({
        success: false,
        message: 'Error al crear la orden'
      });
    }
  }

  /**
   * @swagger
   * /api/orders/{id}:
   *   put:
   *     summary: Actualizar orden
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la orden
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/OrderUpdateRequest'
   *     responses:
   *       200:
   *         description: Orden actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 order:
   *                   $ref: '#/components/schemas/Order'
   *       401:
   *         description: No autorizado
   *       404:
   *         description: Orden no encontrada
   *       400:
   *         description: Orden no puede ser modificada
   */
  static async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const order = await Order.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      // Verificar si la orden puede ser modificada
      if (!['pending', 'partially_filled'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'La orden no puede ser modificada en su estado actual'
        });
      }

      await order.update(updateData);

      // Obtener la orden actualizada con includes
      const updatedOrder = await Order.findByPk(id, {
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['name', 'symbol', 'type']
          },
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['name', 'type']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Orden actualizada exitosamente',
        order: updatedOrder
      });
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/orders/{id}:
   *   delete:
   *     summary: Cancelar orden
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la orden
   *     responses:
   *       200:
   *         description: Orden cancelada exitosamente
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
   *       404:
   *         description: Orden no encontrada
   *       400:
   *         description: Orden no puede ser cancelada
   */
  static async cancelOrder(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      // Verificar si la orden puede ser cancelada
      if (!['pending', 'partially_filled'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'La orden no puede ser cancelada en su estado actual'
        });
      }

      await order.update({ status: 'cancelled' });

      res.json({
        success: true,
        message: 'Orden cancelada exitosamente'
      });
    } catch (error) {
      console.error('Error al cancelar orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/orders/active:
   *   get:
   *     summary: Obtener órdenes activas del usuario
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: symbol
   *         schema:
   *           type: string
   *         description: Filtrar por símbolo
   *     responses:
   *       200:
   *         description: Lista de órdenes activas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 orders:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Order'
   *       401:
   *         description: No autorizado
   */
  static async getActiveOrders(req, res) {
    try {
      const where = {
        user_id: req.user.userId,
        status: ['pending', 'partially_filled']
      };

      if (req.query.symbol) {
        where.symbol = req.query.symbol;
      }

      const orders = await Order.findAll({
        where,
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['name', 'symbol', 'type']
          },
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['name', 'type']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        orders
      });
    } catch (error) {
      console.error('Error al obtener órdenes activas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/orders/history:
   *   get:
   *     summary: Obtener historial de órdenes del usuario
   *     tags: [Orders]
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
   *           default: 50
   *         description: Elementos por página
   *       - in: query
   *         name: symbol
   *         schema:
   *           type: string
   *         description: Filtrar por símbolo
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [filled, cancelled, rejected, expired]
   *         description: Filtrar por estado
   *     responses:
   *       200:
   *         description: Historial de órdenes
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OrderListResponse'
   *       401:
   *         description: No autorizado
   */
  static async getOrderHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      // Construir filtros para órdenes completadas
      const where = {
        user_id: req.user.userId,
        status: ['filled', 'cancelled', 'rejected', 'expired']
      };

      if (req.query.symbol) {
        where.symbol = req.query.symbol;
      }
      if (req.query.status) {
        where.status = req.query.status;
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['name', 'symbol', 'type']
          },
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['name', 'type']
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error al obtener historial de órdenes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/orders/statistics:
   *   get:
   *     summary: Obtener estadísticas de órdenes
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas de órdenes
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
   *                     totalOrders:
   *                       type: integer
   *                     pendingOrders:
   *                       type: integer
   *                     filledOrders:
   *                       type: integer
   *                     totalValue:
   *                       type: number
   *       401:
   *         description: No autorizado
   */
  static async getOrderStatistics(req, res) {
    try {
      const orders = await Order.findAll({
        where: { user_id: req.user.userId }
      });

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const filledOrders = orders.filter(o => o.status === 'filled').length;
      const totalValue = orders.reduce((sum, o) => sum + (o.quantity * o.price), 0);

      res.json({
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          filledOrders,
          totalValue
        }
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de órdenes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = OrderController;
