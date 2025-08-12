const { Strategy, User } = require('../models');

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
}

module.exports = StrategyController;
