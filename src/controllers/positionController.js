const { Strategy, Position, Market, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Position:
 *       type: object
 *       required:
 *         - user_id
 *         - strategy_id
 *         - market_id
 *         - symbol
 *         - side
 *         - size
 *         - entryPrice
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la posición
 *         user_id:
 *           type: integer
 *           description: ID del usuario propietario
 *         strategy_id:
 *           type: integer
 *           description: ID de la estrategia asociada
 *         market_id:
 *           type: integer
 *           description: ID del mercado
 *         symbol:
 *           type: string
 *           description: Símbolo del instrumento
 *         side:
 *           type: string
 *           enum: [long, short]
 *           description: Lado de la posición
 *         size:
 *           type: number
 *           format: float
 *           description: Tamaño de la posición
 *         entryPrice:
 *           type: number
 *           format: float
 *           description: Precio de entrada
 *         currentPrice:
 *           type: number
 *           format: float
 *           description: Precio actual
 *         exitPrice:
 *           type: number
 *           format: float
 *           description: Precio de salida
 *         pnl:
 *           type: number
 *           format: float
 *           description: Profit/Loss
 *         pnlPercentage:
 *           type: number
 *           format: float
 *           description: Porcentaje de P&L
 *         status:
 *           type: string
 *           enum: [open, closed, pending]
 *           default: open
 *           description: Estado de la posición
 *         entryTime:
 *           type: string
 *           format: date-time
 *           description: Tiempo de entrada
 *         exitTime:
 *           type: string
 *           format: date-time
 *           description: Tiempo de salida
 *         stopLoss:
 *           type: number
 *           format: float
 *           description: Stop loss
 *         takeProfit:
 *           type: number
 *           format: float
 *           description: Take profit
 *         notes:
 *           type: string
 *           description: Notas adicionales
 *     PositionRequest:
 *       type: object
 *       required:
 *         - strategy_id
 *         - market_id
 *         - symbol
 *         - side
 *         - size
 *         - entryPrice
 *       properties:
 *         strategy_id:
 *           type: integer
 *         market_id:
 *           type: integer
 *         symbol:
 *           type: string
 *         side:
 *           type: string
 *         size:
 *           type: number
 *         entryPrice:
 *           type: number
 *         currentPrice:
 *           type: number
 *         exitPrice:
 *           type: number
 *         stopLoss:
 *           type: number
 *         takeProfit:
 *           type: number
 *         notes:
 *           type: string
 */

class PositionController {
  /**
   * @swagger
   * /api/positions:
   *   get:
   *     summary: Obtener posiciones del usuario
   *     tags: [Positions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [open, closed, pending]
   *         description: Filtrar por estado
   *       - in: query
   *         name: symbol
   *         schema:
   *           type: string
   *         description: Filtrar por símbolo
   *       - in: query
   *         name: strategy_id
   *         schema:
   *           type: integer
   *         description: Filtrar por estrategia
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Número máximo de registros
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número de página
   *     responses:
   *       200:
   *         description: Lista de posiciones
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
   *                     $ref: '#/components/schemas/Position'
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
   */
  static async getPositions(req, res) {
    try {
      const {
        status,
        symbol,
        strategy_id,
        isOpen,
        limit = 50,
        page = 1
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { user_id: req.user.userId };

      if (status) where.status = status;
      if (symbol) where.symbol = symbol;
      if (strategy_id) where.strategy_id = strategy_id;
      if (isOpen !== undefined) {
        if (isOpen === 'true') {
          where.size = { [Op.gt]: 0 };
        } else {
          where.size = { [Op.eq]: 0 };
        }
      }

      const { count, rows } = await Position.findAndCountAll({
        where,
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
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
      console.error('Error al obtener posiciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/positions/{id}:
   *   get:
   *     summary: Obtener posición por ID
   *     tags: [Positions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la posición
   *     responses:
   *       200:
   *         description: Posición encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Position'
   *       404:
   *         description: Posición no encontrada
   *       401:
   *         description: No autorizado
   */
  static async getPositionById(req, res) {
    try {
      const { id } = req.params;

      const position = await Position.findOne({
        where: { id, user_id: req.user.userId },
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ]
      });

      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'Posición no encontrada'
        });
      }

      res.json({
        success: true,
        data: position
      });
    } catch (error) {
      console.error('Error al obtener posición:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/positions:
   *   post:
   *     summary: Crear nueva posición
   *     tags: [Positions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PositionRequest'
   *     responses:
   *       201:
   *         description: Posición creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Position'
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   */
  static async createPosition(req, res) {
    try {
      const positionData = {
        ...req.body,
        user_id: req.user.userId,
        entryTime: new Date(),
        status: 'open'
      };

      const position = await Position.create(positionData);

      const createdPosition = await Position.findByPk(position.id, {
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdPosition
      });
    } catch (error) {
      console.error('Error al crear posición:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.errors.map(e => e.message)
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/positions/{id}:
   *   put:
   *     summary: Actualizar posición
   *     tags: [Positions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la posición
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PositionRequest'
   *     responses:
   *       200:
   *         description: Posición actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Position'
   *       404:
   *         description: Posición no encontrada
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   */
  static async updatePosition(req, res) {
    try {
      const { id } = req.params;

      const position = await Position.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'Posición no encontrada'
        });
      }

      await position.update(req.body);

      const updatedPosition = await Position.findByPk(id, {
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedPosition
      });
    } catch (error) {
      console.error('Error al actualizar posición:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.errors.map(e => e.message)
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/positions/{id}/close:
   *   post:
   *     summary: Cerrar posición
   *     tags: [Positions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la posición
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - exitPrice
   *             properties:
   *               exitPrice:
   *                 type: number
   *                 format: float
   *                 description: Precio de salida
   *               notes:
   *                 type: string
   *                 description: Notas adicionales
   *     responses:
   *       200:
   *         description: Posición cerrada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Position'
   *       404:
   *         description: Posición no encontrada
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   */
  static async closePosition(req, res) {
    try {
      const { id } = req.params;
      const { exitPrice, notes } = req.body;

      const position = await Position.findOne({
        where: { id, user_id: req.user.userId, status: 'open' }
      });

      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'Posición abierta no encontrada'
        });
      }

      // Calcular P&L
      const pnl = position.side === 'long' 
        ? (exitPrice - position.entryPrice) * position.size
        : (position.entryPrice - exitPrice) * position.size;

      const pnlPercentage = (pnl / (position.entryPrice * position.size)) * 100;

      await position.update({
        exitPrice,
        pnl,
        pnlPercentage,
        status: 'closed',
        exitTime: new Date(),
        notes: notes || position.notes
      });

      const closedPosition = await Position.findByPk(id, {
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ]
      });

      res.json({
        success: true,
        data: closedPosition
      });
    } catch (error) {
      console.error('Error al cerrar posición:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/positions/active:
   *   get:
   *     summary: Obtener posiciones activas
   *     tags: [Positions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: symbol
   *         schema:
   *           type: string
   *         description: Filtrar por símbolo
   *       - in: query
   *         name: strategy_id
   *         schema:
   *           type: integer
   *         description: Filtrar por estrategia
   *     responses:
   *       200:
   *         description: Lista de posiciones activas
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
   *                     $ref: '#/components/schemas/Position'
   *       401:
   *         description: No autorizado
   */
  static async getActivePositions(req, res) {
    try {
      const { symbol, strategy_id } = req.query;
      const where = { 
        user_id: req.user.userId,
        status: 'open'
      };

      if (symbol) where.symbol = symbol;
      if (strategy_id) where.strategy_id = strategy_id;

      const positions = await Position.findAll({
        where,
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ],
        order: [['entryTime', 'DESC']]
      });

      res.json({
        success: true,
        data: positions
      });
    } catch (error) {
      console.error('Error al obtener posiciones activas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/positions/closed:
   *   get:
   *     summary: Obtener posiciones cerradas
   *     tags: [Positions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: symbol
   *         schema:
   *           type: string
   *         description: Filtrar por símbolo
   *       - in: query
   *         name: strategy_id
   *         schema:
   *           type: integer
   *         description: Filtrar por estrategia
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de inicio
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de fin
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Número máximo de registros
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número de página
   *     responses:
   *       200:
   *         description: Lista de posiciones cerradas
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
   *                     $ref: '#/components/schemas/Position'
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
   */
  static async getClosedPositions(req, res) {
    try {
      const {
        symbol,
        strategy_id,
        startDate,
        endDate,
        limit = 50,
        page = 1
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { 
        user_id: req.user.userId,
        status: 'closed'
      };

      if (symbol) where.symbol = symbol;
      if (strategy_id) where.strategy_id = strategy_id;
      if (startDate || endDate) {
        where.exitTime = {};
        if (startDate) where.exitTime[Op.gte] = new Date(startDate);
        if (endDate) where.exitTime[Op.lte] = new Date(endDate);
      }

      const { count, rows } = await Position.findAndCountAll({
        where,
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          },
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ],
        order: [['exitTime', 'DESC']],
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
      console.error('Error al obtener posiciones cerradas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/positions/summary:
   *   get:
   *     summary: Obtener resumen de posiciones
   *     tags: [Positions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de inicio
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de fin
   *     responses:
   *       200:
   *         description: Resumen de posiciones
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
   *                     totalPositions:
   *                       type: integer
   *                     openPositions:
   *                       type: integer
   *                     closedPositions:
   *                       type: integer
   *                     totalPnL:
   *                       type: number
   *                     averagePnL:
   *                       type: number
   *                     winRate:
   *                       type: number
   *                     profitablePositions:
   *                       type: integer
   *                     losingPositions:
   *                       type: integer
   *       401:
   *         description: No autorizado
   */
  static async getPositionSummary(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const where = { user_id: req.user.userId };

      if (startDate || endDate) {
        where.entryTime = {};
        if (startDate) where.entryTime[Op.gte] = new Date(startDate);
        if (endDate) where.entryTime[Op.lte] = new Date(endDate);
      }

      const positions = await Position.findAll({ where });

      const totalPositions = positions.length;
      const openPositions = positions.filter(p => p.status === 'open').length;
      const closedPositions = positions.filter(p => p.status === 'closed').length;
      const closedPositionsData = positions.filter(p => p.status === 'closed');
      
      const totalPnL = closedPositionsData.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const averagePnL = closedPositionsData.length > 0 ? totalPnL / closedPositionsData.length : 0;
      
      const profitablePositions = closedPositionsData.filter(p => (p.pnl || 0) > 0).length;
      const losingPositions = closedPositionsData.filter(p => (p.pnl || 0) < 0).length;
      const winRate = closedPositionsData.length > 0 ? (profitablePositions / closedPositionsData.length) * 100 : 0;

      res.json({
        success: true,
        data: {
          totalPositions,
          openPositions,
          closedPositions,
          totalPnL,
          averagePnL,
          winRate,
          profitablePositions,
          losingPositions
        }
      });
    } catch (error) {
      console.error('Error al obtener resumen de posiciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/positions/statistics:
   *   get:
   *     summary: Obtener estadísticas de posiciones
   *     tags: [Positions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas de posiciones
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
   *                     totalPositions:
   *                       type: integer
   *                     openPositions:
   *                       type: integer
   *                     totalValue:
   *                       type: number
   *                     totalPnL:
   *                       type: number
   *       401:
   *         description: No autorizado
   */
  static async getPositionStatistics(req, res) {
    try {
      const positions = await Position.findAll({
        where: { user_id: req.user.userId }
      });

      const totalPositions = positions.length;
      const openPositions = positions.filter(p => p.size > 0).length;
      const totalValue = positions.reduce((sum, p) => sum + (p.size * p.markPrice), 0);
      const totalPnL = positions.reduce((sum, p) => sum + p.unrealizedPnl + p.realizedPnl, 0);

      res.json({
        success: true,
        data: {
          totalPositions,
          openPositions,
          totalValue,
          totalPnL
        }
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de posiciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = PositionController;
