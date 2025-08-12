const { Strategy, User } = require('../models');
const tradingStrategyService = require('../services/tradingStrategyService');
const binanceService = require('../services/binanceService');

/**
 * @swagger
 * components:
 *   schemas:
 *     Strategy:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - user_id
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la estrategia
 *         user_id:
 *           type: integer
 *           description: ID del usuario propietario
 *         name:
 *           type: string
 *           description: Nombre de la estrategia
 *         description:
 *           type: string
 *           description: Descripción de la estrategia
 *         type:
 *           type: string
 *           enum: [scalping, day_trading, swing_trading, position_trading, arbitrage, grid_trading, dca]
 *           description: Tipo de estrategia
 *         isActive:
 *           type: boolean
 *           default: false
 *           description: Estado activo de la estrategia
 *         riskLevel:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *           description: Nivel de riesgo
 *         parameters:
 *           type: object
 *           description: Parámetros de la estrategia
 *         riskManagement:
 *           type: object
 *           description: Configuración de gestión de riesgo
 *         markets:
 *           type: array
 *           items:
 *             type: string
 *           description: Mercados donde opera la estrategia
 *         timeframes:
 *           type: array
 *           items:
 *             type: string
 *           description: Timeframes utilizados
 *         indicators:
 *           type: array
 *           items:
 *             type: object
 *           description: Indicadores técnicos utilizados
 *         notifications:
 *           type: object
 *           description: Configuración de notificaciones
 *         statistics:
 *           type: object
 *           description: Estadísticas de la estrategia
 *     StrategyCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [scalping, day_trading, swing_trading, position_trading, arbitrage, grid_trading, dca]
 *         riskLevel:
 *           type: string
 *           enum: [low, medium, high]
 *         parameters:
 *           type: object
 *         riskManagement:
 *           type: object
 *         markets:
 *           type: array
 *           items:
 *             type: string
 *         timeframes:
 *           type: array
 *           items:
 *             type: string
 *         indicators:
 *           type: array
 *           items:
 *             type: object
 *         notifications:
 *           type: object
 *     StrategyUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [scalping, day_trading, swing_trading, position_trading, arbitrage, grid_trading, dca]
 *         isActive:
 *           type: boolean
 *         riskLevel:
 *           type: string
 *           enum: [low, medium, high]
 *         parameters:
 *           type: object
 *         riskManagement:
 *           type: object
 *         markets:
 *           type: array
 *           items:
 *             type: string
 *         timeframes:
 *           type: array
 *           items:
 *             type: string
 *         indicators:
 *           type: array
 *           items:
 *             type: object
 *         notifications:
 *           type: object
 *     StrategyListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         strategies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Strategy'
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

class StrategyController {
  /**
   * @swagger
   * /api/strategies:
   *   get:
   *     summary: Obtener lista de estrategias del usuario
   *     tags: [Strategies]
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
   *         description: Buscar por nombre
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [scalping, day_trading, swing_trading, position_trading, arbitrage, grid_trading, dca]
   *         description: Filtrar por tipo de estrategia
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo
   *       - in: query
   *         name: riskLevel
   *         schema:
   *           type: string
   *           enum: [low, medium, high]
   *         description: Filtrar por nivel de riesgo
   *     responses:
   *       200:
   *         description: Lista de estrategias
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StrategyListResponse'
   *       401:
   *         description: No autorizado
   */
  static async getStrategies(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Construir filtros
      const where = { user_id: req.user.userId };
      if (req.query.search) {
        where.name = { [require('sequelize').Op.iLike]: `%${req.query.search}%` };
      }
      if (req.query.type) {
        where.type = req.query.type;
      }
      if (req.query.isActive !== undefined) {
        where.isActive = req.query.isActive === 'true';
      }
      if (req.query.riskLevel) {
        where.riskLevel = req.query.riskLevel;
      }

      // Obtener estrategias con paginación
      const { count, rows: strategies } = await Strategy.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        strategies,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error al obtener estrategias:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/strategies/{id}:
   *   get:
   *     summary: Obtener estrategia por ID
   *     tags: [Strategies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la estrategia
   *     responses:
   *       200:
   *         description: Estrategia encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 strategy:
   *                   $ref: '#/components/schemas/Strategy'
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Estrategia no encontrada
   */
  static async getStrategyById(req, res) {
    try {
      const { id } = req.params;

      const strategy = await Strategy.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!strategy) {
        return res.status(404).json({
          success: false,
          message: 'Estrategia no encontrada'
        });
      }

      res.json({
        success: true,
        strategy
      });
    } catch (error) {
      console.error('Error al obtener estrategia:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/strategies:
   *   post:
   *     summary: Crear nueva estrategia
   *     tags: [Strategies]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/StrategyCreateRequest'
   *     responses:
   *       201:
   *         description: Estrategia creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 strategy:
   *                   $ref: '#/components/schemas/Strategy'
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   *       409:
   *         description: Estrategia ya existe
   */
  static async createStrategy(req, res) {
    try {
      const strategyData = {
        ...req.body,
        user_id: req.user.userId
      };

      // Verificar si la estrategia ya existe para este usuario
      const existingStrategy = await Strategy.findOne({
        where: {
          name: strategyData.name,
          user_id: req.user.userId
        }
      });

      if (existingStrategy) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una estrategia con ese nombre'
        });
      }

      const strategy = await Strategy.create(strategyData);

      res.status(201).json({
        success: true,
        message: 'Estrategia creada exitosamente',
        strategy
      });
    } catch (error) {
      console.error('Error al crear estrategia:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/strategies/{id}:
   *   put:
   *     summary: Actualizar estrategia
   *     tags: [Strategies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la estrategia
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/StrategyUpdateRequest'
   *     responses:
   *       200:
   *         description: Estrategia actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 strategy:
   *                   $ref: '#/components/schemas/Strategy'
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Estrategia no encontrada
   *       409:
   *         description: Estrategia ya existe
   */
  static async updateStrategy(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const strategy = await Strategy.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!strategy) {
        return res.status(404).json({
          success: false,
          message: 'Estrategia no encontrada'
        });
      }

      // Verificar si el nombre ya existe (si se está actualizando)
      if (updateData.name && updateData.name !== strategy.name) {
        const existingStrategy = await Strategy.findOne({
          where: {
            name: updateData.name,
            user_id: req.user.userId,
            id: { [require('sequelize').Op.ne]: id }
          }
        });

        if (existingStrategy) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe una estrategia con ese nombre'
          });
        }
      }

      await strategy.update(updateData);

      res.json({
        success: true,
        message: 'Estrategia actualizada exitosamente',
        strategy
      });
    } catch (error) {
      console.error('Error al actualizar estrategia:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/strategies/{id}:
   *   delete:
   *     summary: Eliminar estrategia
   *     tags: [Strategies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la estrategia
   *     responses:
   *       200:
   *         description: Estrategia eliminada exitosamente
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
   *         description: Estrategia no encontrada
   */
  static async deleteStrategy(req, res) {
    try {
      const { id } = req.params;

      const strategy = await Strategy.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!strategy) {
        return res.status(404).json({
          success: false,
          message: 'Estrategia no encontrada'
        });
      }

      await strategy.destroy();

      res.json({
        success: true,
        message: 'Estrategia eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar estrategia:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/strategies/{id}/toggle:
   *   put:
   *     summary: Activar/desactivar estrategia
   *     tags: [Strategies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la estrategia
   *     responses:
   *       200:
   *         description: Estado de la estrategia actualizado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 strategy:
   *                   $ref: '#/components/schemas/Strategy'
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Estrategia no encontrada
   */
  static async toggleStrategy(req, res) {
    try {
      const { id } = req.params;

      const strategy = await Strategy.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!strategy) {
        return res.status(404).json({
          success: false,
          message: 'Estrategia no encontrada'
        });
      }

      await strategy.update({ isActive: !strategy.isActive });

      res.json({
        success: true,
        message: `Estrategia ${strategy.isActive ? 'activada' : 'desactivada'} exitosamente`,
        strategy
      });
    } catch (error) {
      console.error('Error al cambiar estado de estrategia:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/strategies/active:
   *   get:
   *     summary: Obtener estrategias activas del usuario
   *     tags: [Strategies]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de estrategias activas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 strategies:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Strategy'
   *       401:
   *         description: No autorizado
   */
  static async getActiveStrategies(req, res) {
    try {
      const strategies = await Strategy.findAll({
        where: { user_id: req.user.userId, isActive: true },
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        strategies
      });
    } catch (error) {
      console.error('Error al obtener estrategias activas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/strategies/statistics:
   *   get:
   *     summary: Obtener estadísticas generales de estrategias del usuario
   *     tags: [Strategies]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas generales de estrategias
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 statistics:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     active:
   *                       type: integer
   *                     inactive:
   *                       type: integer
   *                     profitable:
   *                       type: integer
   *                     totalProfit:
   *                       type: number
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   */
  static async getGeneralStatistics(req, res) {
    try {
      const userId = req.user.userId;

      // Obtener estadísticas generales
      const totalStrategies = await Strategy.count({
        where: { user_id: userId }
      });

      const activeStrategies = await Strategy.count({
        where: { 
          user_id: userId,
          isActive: true
        }
      });

      const inactiveStrategies = await Strategy.count({
        where: { 
          user_id: userId,
          isActive: false
        }
      });

      // Calcular estrategias rentables (simulado por ahora)
      const profitableStrategies = Math.floor(activeStrategies * 0.6); // 60% de las activas
      
      // Calcular ganancia total (simulado)
      const totalProfit = (Math.random() * 20 - 10).toFixed(2); // Entre -10% y +10%

      const statistics = {
        total: totalStrategies,
        active: activeStrategies,
        inactive: inactiveStrategies,
        profitable: profitableStrategies,
        totalProfit: parseFloat(totalProfit)
      };

      res.json({
        success: true,
        statistics
      });
    } catch (error) {
      console.error('Error al obtener estadísticas generales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/strategies/{id}/statistics:
   *   get:
   *     summary: Obtener estadísticas de una estrategia específica
   *     tags: [Strategies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la estrategia
   *     responses:
   *       200:
   *         description: Estadísticas de la estrategia
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 statistics:
   *                   type: object
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Estrategia no encontrada
   */
  static async getStrategyStatistics(req, res) {
    try {
      const { id } = req.params;

      const strategy = await Strategy.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!strategy) {
        return res.status(404).json({
          success: false,
          message: 'Estrategia no encontrada'
        });
      }

      res.json({
        success: true,
        statistics: strategy.statistics
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de estrategia:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/strategies/types:
   *   get:
   *     summary: Obtener tipos de estrategias disponibles
   *     tags: [Strategies]
   *     responses:
   *       200:
   *         description: Lista de tipos de estrategias
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 types:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       value:
   *                         type: string
   *                       label:
   *                         type: string
   *                       description:
   *                         type: string
   */
  static async getStrategyTypes(req, res) {
    try {
      const types = [
        {
          value: 'scalping',
          label: 'Scalping',
          description: 'Operaciones de segundos a minutos'
        },
        {
          value: 'day_trading',
          label: 'Day Trading',
          description: 'Operaciones dentro del mismo día'
        },
        {
          value: 'swing_trading',
          label: 'Swing Trading',
          description: 'Operaciones de días a semanas'
        },
        {
          value: 'position_trading',
          label: 'Position Trading',
          description: 'Operaciones de semanas a meses'
        },
        {
          value: 'arbitrage',
          label: 'Arbitraje',
          description: 'Aprovechar diferencias de precios entre mercados'
        },
        {
          value: 'grid_trading',
          label: 'Grid Trading',
          description: 'Trading automatizado con órdenes en grid'
        },
        {
          value: 'dca',
          label: 'DCA (Dollar Cost Averaging)',
          description: 'Promedio de costos en dólares'
        }
      ];

      res.json({
        success: true,
        types
      });
    } catch (error) {
      console.error('Error al obtener tipos de estrategias:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/strategies/{id}/execute:
   *   post:
   *     summary: Ejecutar estrategia en tiempo real
   *     tags: [Strategies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la estrategia
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               symbol:
   *                 type: string
   *                 description: Símbolo a analizar
   *               interval:
   *                 type: string
   *                 description: Intervalo de tiempo
   *               limit:
   *                 type: integer
   *                 description: Número de datos históricos
   *     responses:
   *       200:
   *         description: Resultado de la ejecución de la estrategia
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 result:
   *                   type: object
   *                   properties:
   *                     signal:
   *                       type: string
   *                     reason:
   *                       type: string
   *                     currentPrice:
   *                       type: number
   *                     indicators:
   *                       type: object
   *                     riskManagement:
   *                       type: object
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Estrategia no encontrada
   *       500:
   *         description: Error interno del servidor
   */
  static async executeStrategy(req, res) {
    try {
      const { id } = req.params;
      const { symbol = 'BTCUSDT', interval = '1h', limit = 100 } = req.body;

      // Verificar que la estrategia existe y pertenece al usuario
      const strategy = await Strategy.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!strategy) {
        return res.status(404).json({
          success: false,
          message: 'Estrategia no encontrada'
        });
      }

      // Verificar que la estrategia esté activa
      if (!strategy.isActive) {
        return res.status(400).json({
          success: false,
          message: 'La estrategia debe estar activa para ejecutarse'
        });
      }

      // Obtener datos históricos de Binance
      const klines = await binanceService.getKlines(symbol, interval, limit);
      
      // Convertir datos al formato requerido
      const marketData = klines.map(kline => ({
        openTime: kline.openTime,
        open: kline.open,
        high: kline.high,
        low: kline.low,
        close: kline.close,
        volume: kline.volume,
        closeTime: kline.closeTime
      }));

      // Ejecutar estrategia
      const result = await tradingStrategyService.executeStrategy(
        strategy.type,
        symbol,
        marketData,
        strategy.parameters || {}
      );

      // Guardar resultado en la base de datos
      await strategy.update({
        lastExecuted: new Date(),
        lastSignal: result.signal,
        lastPrice: result.currentPrice
      });

      res.json({
        success: true,
        result: {
          ...result,
          strategy: {
            id: strategy.id,
            name: strategy.name,
            type: strategy.type
          },
          executionTime: new Date()
        }
      });
    } catch (error) {
      console.error('Error al ejecutar estrategia:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/strategies/{id}/backtest:
   *   post:
   *     summary: Ejecutar backtest de la estrategia
   *     tags: [Strategies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la estrategia
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               symbol:
   *                 type: string
   *                 description: Símbolo a analizar
   *               interval:
   *                 type: string
   *                 description: Intervalo de tiempo
   *               startDate:
   *                 type: string
   *                 format: date
   *                 description: Fecha de inicio
   *               endDate:
   *                 type: string
   *                 format: date
   *                 description: Fecha de fin
   *     responses:
   *       200:
   *         description: Resultado del backtest
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 backtest:
   *                   type: object
   *                   properties:
   *                     totalTrades:
   *                       type: integer
   *                     winningTrades:
   *                       type: integer
   *                     losingTrades:
   *                       type: integer
   *                     winRate:
   *                       type: number
   *                     totalReturn:
   *                       type: number
   *                     maxDrawdown:
   *                       type: number
   *                     sharpeRatio:
   *                       type: number
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Estrategia no encontrada
   *       500:
   *         description: Error interno del servidor
   */
  static async backtestStrategy(req, res) {
    try {
      const { id } = req.params;
      const { 
        symbol = 'BTCUSDT', 
        interval = '1h', 
        startDate = null, 
        endDate = null 
      } = req.body;

      // Verificar que la estrategia existe y pertenece al usuario
      const strategy = await Strategy.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!strategy) {
        return res.status(404).json({
          success: false,
          message: 'Estrategia no encontrada'
        });
      }

      // Calcular fechas por defecto (últimos 30 días)
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));

      // Obtener datos históricos
      const klines = await binanceService.getKlines(
        symbol, 
        interval, 
        1000, 
        start.getTime(), 
        end.getTime()
      );

      // Convertir datos
      const marketData = klines.map(kline => ({
        openTime: kline.openTime,
        open: kline.open,
        high: kline.high,
        low: kline.low,
        close: kline.close,
        volume: kline.volume,
        closeTime: kline.closeTime
      }));

      // Ejecutar backtest
      const backtestResult = await this.runBacktest(strategy, marketData);

      res.json({
        success: true,
        backtest: backtestResult
      });
    } catch (error) {
      console.error('Error al ejecutar backtest:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * Ejecutar backtest de una estrategia
   */
  static async runBacktest(strategy, marketData) {
    try {
      let balance = 10000; // Capital inicial
      let position = null;
      const trades = [];
      let maxBalance = balance;
      let maxDrawdown = 0;

      for (let i = 50; i < marketData.length; i++) { // Empezar después de tener suficientes datos
        const currentData = marketData.slice(0, i + 1);
        const currentPrice = currentData[currentData.length - 1].close;

        // Ejecutar estrategia
        const result = await tradingStrategyService.executeStrategy(
          strategy.type,
          'SYMBOL',
          currentData,
          strategy.parameters || {}
        );

        // Procesar señales
        if (result.signal === 'BUY' && !position) {
          position = {
            entryPrice: currentPrice,
            entryTime: currentData[currentData.length - 1].openTime,
            size: balance * 0.95 / currentPrice // Usar 95% del balance
          };
        } else if (result.signal === 'SELL' && position) {
          const exitPrice = currentPrice;
          const profit = (exitPrice - position.entryPrice) * position.size;
          balance += profit;

          trades.push({
            entryPrice: position.entryPrice,
            exitPrice,
            profit,
            entryTime: position.entryTime,
            exitTime: currentData[currentData.length - 1].openTime
          });

          position = null;
        }

        // Actualizar métricas
        if (balance > maxBalance) {
          maxBalance = balance;
        }

        const drawdown = (maxBalance - balance) / maxBalance;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }

      // Calcular estadísticas
      const winningTrades = trades.filter(t => t.profit > 0);
      const losingTrades = trades.filter(t => t.profit < 0);
      const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;
      const totalReturn = (balance - 10000) / 10000;

      // Calcular Sharpe Ratio (simplificado)
      const returns = trades.map(t => t.profit / 10000);
      const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
      const variance = returns.length > 0 ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length : 0;
      const sharpeRatio = variance > 0 ? avgReturn / Math.sqrt(variance) : 0;

      return {
        totalTrades: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: winRate * 100,
        totalReturn: totalReturn * 100,
        maxDrawdown: maxDrawdown * 100,
        sharpeRatio,
        finalBalance: balance,
        trades: trades.slice(-10) // Últimas 10 operaciones
      };
    } catch (error) {
      console.error('Error en backtest:', error);
      throw error;
    }
  }
}

module.exports = StrategyController;
