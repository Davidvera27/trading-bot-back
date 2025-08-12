const { Backtest, User, Strategy } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     Backtest:
 *       type: object
 *       required:
 *         - user_id
 *         - strategy_id
 *         - name
 *         - startDate
 *         - endDate
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del backtest
 *         user_id:
 *           type: integer
 *           description: ID del usuario propietario
 *         strategy_id:
 *           type: integer
 *           description: ID de la estrategia
 *         name:
 *           type: string
 *           description: Nombre del backtest
 *         description:
 *           type: string
 *           description: Descripción del backtest
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de inicio del backtest
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de fin del backtest
 *         status:
 *           type: string
 *           enum: [pending, running, completed, failed]
 *           default: pending
 *           description: Estado del backtest
 *         initialCapital:
 *           type: number
 *           format: float
 *           description: Capital inicial
 *         finalCapital:
 *           type: number
 *           format: float
 *           description: Capital final
 *         totalReturn:
 *           type: number
 *           format: float
 *           description: Retorno total
 *         totalReturnPercentage:
 *           type: number
 *           format: float
 *           description: Porcentaje de retorno total
 *         maxDrawdown:
 *           type: number
 *           format: float
 *           description: Máximo drawdown
 *         sharpeRatio:
 *           type: number
 *           format: float
 *           description: Ratio de Sharpe
 *         totalTrades:
 *           type: integer
 *           description: Número total de trades
 *         winningTrades:
 *           type: integer
 *           description: Número de trades ganadores
 *         losingTrades:
 *           type: integer
 *           description: Número de trades perdedores
 *         winRate:
 *           type: number
 *           format: float
 *           description: Tasa de acierto
 *         averageWin:
 *           type: number
 *           format: float
 *           description: Ganancia promedio
 *         averageLoss:
 *           type: number
 *           format: float
 *           description: Pérdida promedio
 *         profitFactor:
 *           type: number
 *           format: float
 *           description: Factor de beneficio
 *         parameters:
 *           type: object
 *           description: Parámetros del backtest
 *         results:
 *           type: object
 *           description: Resultados detallados del backtest
 *         errorMessage:
 *           type: string
 *           description: Mensaje de error si falló
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de finalización
 *     BacktestRequest:
 *       type: object
 *       required:
 *         - strategy_id
 *         - name
 *         - startDate
 *         - endDate
 *         - initialCapital
 *       properties:
 *         strategy_id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         initialCapital:
 *           type: number
 *         parameters:
 *           type: object
 */

class BacktestController {
  /**
   * @swagger
   * /api/backtests:
   *   get:
   *     summary: Obtener backtests del usuario
   *     tags: [Backtests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, running, completed, failed]
   *         description: Filtrar por estado
   *       - in: query
   *         name: strategy_id
   *         schema:
   *           type: integer
   *         description: Filtrar por estrategia
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Número máximo de registros
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número de página
   *     responses:
   *       200:
   *         description: Lista de backtests
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
   *                     $ref: '#/components/schemas/Backtest'
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
  static async getBacktests(req, res) {
    try {
      const {
        status,
        strategy_id,
        limit = 20,
        page = 1
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { user_id: req.user.userId };

      if (status) where.status = status;
      if (strategy_id) where.strategy_id = strategy_id;

      const { count, rows } = await Backtest.findAndCountAll({
        where,
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
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
      console.error('Error al obtener backtests:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/backtests/{id}:
   *   get:
   *     summary: Obtener backtest por ID
   *     tags: [Backtests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del backtest
   *     responses:
   *       200:
   *         description: Backtest encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Backtest'
   *       404:
   *         description: Backtest no encontrado
   *       401:
   *         description: No autorizado
   */
  static async getBacktestById(req, res) {
    try {
      const { id } = req.params;

      const backtest = await Backtest.findOne({
        where: { id, user_id: req.user.userId },
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          }
        ]
      });

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: 'Backtest no encontrado'
        });
      }

      res.json({
        success: true,
        data: backtest
      });
    } catch (error) {
      console.error('Error al obtener backtest:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/backtests:
   *   post:
   *     summary: Crear nuevo backtest
   *     tags: [Backtests]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/BacktestRequest'
   *     responses:
   *       201:
   *         description: Backtest creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Backtest'
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   */
  static async createBacktest(req, res) {
    try {
      const backtestData = {
        ...req.body,
        user_id: req.user.userId,
        status: 'pending'
      };

      const backtest = await Backtest.create(backtestData);

      const createdBacktest = await Backtest.findByPk(backtest.id, {
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdBacktest
      });
    } catch (error) {
      console.error('Error al crear backtest:', error);
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
   * /api/backtests/{id}:
   *   put:
   *     summary: Actualizar backtest
   *     tags: [Backtests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del backtest
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/BacktestRequest'
   *     responses:
   *       200:
   *         description: Backtest actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Backtest'
   *       404:
   *         description: Backtest no encontrado
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   */
  static async updateBacktest(req, res) {
    try {
      const { id } = req.params;

      const backtest = await Backtest.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: 'Backtest no encontrado'
        });
      }

      // Solo permitir actualizar si el backtest no está en ejecución
      if (backtest.status === 'running') {
        return res.status(400).json({
          success: false,
          message: 'No se puede actualizar un backtest en ejecución'
        });
      }

      await backtest.update(req.body);

      const updatedBacktest = await Backtest.findByPk(id, {
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedBacktest
      });
    } catch (error) {
      console.error('Error al actualizar backtest:', error);
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
   * /api/backtests/{id}:
   *   delete:
   *     summary: Eliminar backtest
   *     tags: [Backtests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del backtest
   *     responses:
   *       200:
   *         description: Backtest eliminado exitosamente
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
   *         description: Backtest no encontrado
   *       400:
   *         description: No se puede eliminar un backtest en ejecución
   *       401:
   *         description: No autorizado
   */
  static async deleteBacktest(req, res) {
    try {
      const { id } = req.params;

      const backtest = await Backtest.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: 'Backtest no encontrado'
        });
      }

      // No permitir eliminar si está en ejecución
      if (backtest.status === 'running') {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un backtest en ejecución'
        });
      }

      await backtest.destroy();

      res.json({
        success: true,
        message: 'Backtest eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar backtest:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/backtests/{id}/start:
   *   post:
   *     summary: Iniciar backtest
   *     tags: [Backtests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del backtest
   *     responses:
   *       200:
   *         description: Backtest iniciado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Backtest'
   *       404:
   *         description: Backtest no encontrado
   *       400:
   *         description: Backtest no puede ser iniciado
   *       401:
   *         description: No autorizado
   */
  static async startBacktest(req, res) {
    try {
      const { id } = req.params;

      const backtest = await Backtest.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: 'Backtest no encontrado'
        });
      }

      if (backtest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden iniciar backtests pendientes'
        });
      }

      // Aquí iría la lógica para ejecutar el backtest
      // Por ahora, solo actualizamos el estado
      await backtest.update({ status: 'running' });

      res.json({
        success: true,
        message: 'Backtest iniciado exitosamente',
        data: backtest
      });
    } catch (error) {
      console.error('Error al iniciar backtest:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/backtests/{id}/stop:
   *   post:
   *     summary: Detener backtest
   *     tags: [Backtests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del backtest
   *     responses:
   *       200:
   *         description: Backtest detenido exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Backtest'
   *       404:
   *         description: Backtest no encontrado
   *       400:
   *         description: Backtest no puede ser detenido
   *       401:
   *         description: No autorizado
   */
  static async stopBacktest(req, res) {
    try {
      const { id } = req.params;

      const backtest = await Backtest.findOne({
        where: { id, user_id: req.user.userId }
      });

      if (!backtest) {
        return res.status(404).json({
          success: false,
          message: 'Backtest no encontrado'
        });
      }

      if (backtest.status !== 'running') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden detener backtests en ejecución'
        });
      }

      await backtest.update({ 
        status: 'failed',
        errorMessage: 'Backtest detenido manualmente'
      });

      res.json({
        success: true,
        message: 'Backtest detenido exitosamente',
        data: backtest
      });
    } catch (error) {
      console.error('Error al detener backtest:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/backtests/completed:
   *   get:
   *     summary: Obtener backtests completados
   *     tags: [Backtests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: strategy_id
   *         schema:
   *           type: integer
   *         description: Filtrar por estrategia
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Número máximo de registros
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número de página
   *     responses:
   *       200:
   *         description: Lista de backtests completados
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
   *                     $ref: '#/components/schemas/Backtest'
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
  static async getCompletedBacktests(req, res) {
    try {
      const {
        strategy_id,
        limit = 20,
        page = 1
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { 
        user_id: req.user.userId,
        status: 'completed'
      };

      if (strategy_id) where.strategy_id = strategy_id;

      const { count, rows } = await Backtest.findAndCountAll({
        where,
        include: [
          {
            model: Strategy,
            as: 'strategy',
            attributes: ['id', 'name', 'description']
          }
        ],
        order: [['completedAt', 'DESC']],
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
      console.error('Error al obtener backtests completados:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/backtests/summary:
   *   get:
   *     summary: Obtener resumen de backtests
   *     tags: [Backtests]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Resumen de backtests
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
   *                     totalBacktests:
   *                       type: integer
   *                     completedBacktests:
   *                       type: integer
   *                     runningBacktests:
   *                       type: integer
   *                     failedBacktests:
   *                       type: integer
   *                     averageReturn:
   *                       type: number
   *                     bestReturn:
   *                       type: number
   *                     worstReturn:
   *                       type: number
   *                     averageSharpeRatio:
   *                       type: number
   *                     averageMaxDrawdown:
   *                       type: number
   *       401:
   *         description: No autorizado
   */
  static async getBacktestSummary(req, res) {
    try {
      const backtests = await Backtest.findAll({
        where: { user_id: req.user.userId }
      });

      const totalBacktests = backtests.length;
      const completedBacktests = backtests.filter(b => b.status === 'completed').length;
      const runningBacktests = backtests.filter(b => b.status === 'running').length;
      const failedBacktests = backtests.filter(b => b.status === 'failed').length;

      const completedBacktestsData = backtests.filter(b => b.status === 'completed');
      
      const averageReturn = completedBacktestsData.length > 0 
        ? completedBacktestsData.reduce((sum, b) => sum + (b.totalReturnPercentage || 0), 0) / completedBacktestsData.length 
        : 0;
      
      const bestReturn = completedBacktestsData.length > 0 
        ? Math.max(...completedBacktestsData.map(b => b.totalReturnPercentage || 0))
        : 0;
      
      const worstReturn = completedBacktestsData.length > 0 
        ? Math.min(...completedBacktestsData.map(b => b.totalReturnPercentage || 0))
        : 0;
      
      const averageSharpeRatio = completedBacktestsData.length > 0 
        ? completedBacktestsData.reduce((sum, b) => sum + (b.sharpeRatio || 0), 0) / completedBacktestsData.length 
        : 0;
      
      const averageMaxDrawdown = completedBacktestsData.length > 0 
        ? completedBacktestsData.reduce((sum, b) => sum + (b.maxDrawdown || 0), 0) / completedBacktestsData.length 
        : 0;

      res.json({
        success: true,
        data: {
          totalBacktests,
          completedBacktests,
          runningBacktests,
          failedBacktests,
          averageReturn,
          bestReturn,
          worstReturn,
          averageSharpeRatio,
          averageMaxDrawdown
        }
      });
    } catch (error) {
      console.error('Error al obtener resumen de backtests:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = BacktestController;
