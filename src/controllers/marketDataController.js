const { MarketData, Market } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     MarketData:
 *       type: object
 *       required:
 *         - market_id
 *         - symbol
 *         - price
 *         - volume
 *         - timestamp
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del dato de mercado
 *         market_id:
 *           type: integer
 *           description: ID del mercado asociado
 *         symbol:
 *           type: string
 *           description: Símbolo del instrumento financiero
 *         price:
 *           type: number
 *           format: float
 *           description: Precio actual
 *         volume:
 *           type: number
 *           format: float
 *           description: Volumen de transacciones
 *         high:
 *           type: number
 *           format: float
 *           description: Precio más alto del período
 *         low:
 *           type: number
 *           format: float
 *           description: Precio más bajo del período
 *         open:
 *           type: number
 *           format: float
 *           description: Precio de apertura
 *         close:
 *           type: number
 *           format: float
 *           description: Precio de cierre
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp del dato
 *         timeframe:
 *           type: string
 *           enum: [1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M]
 *           description: Timeframe del dato
 *         source:
 *           type: string
 *           description: Fuente de los datos
 *     MarketDataRequest:
 *       type: object
 *       required:
 *         - market_id
 *         - symbol
 *         - price
 *         - volume
 *         - timestamp
 *       properties:
 *         market_id:
 *           type: integer
 *         symbol:
 *           type: string
 *         price:
 *           type: number
 *         volume:
 *           type: number
 *         high:
 *           type: number
 *         low:
 *           type: number
 *         open:
 *           type: number
 *         close:
 *           type: number
 *         timestamp:
 *           type: string
 *           format: date-time
 *         timeframe:
 *           type: string
 *         source:
 *           type: string
 */

class MarketDataController {
  /**
   * @swagger
   * /api/market-data:
   *   get:
   *     summary: Obtener datos de mercado
   *     tags: [Market Data]
   *     parameters:
   *       - in: query
   *         name: symbol
   *         schema:
   *           type: string
   *         description: Filtrar por símbolo
   *       - in: query
   *         name: timeframe
   *         schema:
   *           type: string
   *         description: Filtrar por timeframe
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
   *           default: 100
   *         description: Número máximo de registros
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número de página
   *     responses:
   *       200:
   *         description: Lista de datos de mercado
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
   *                     $ref: '#/components/schemas/MarketData'
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
   */
  static async getMarketData(req, res) {
    try {
      const {
        symbol,
        timeframe,
        startDate,
        endDate,
        limit = 100,
        page = 1
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (symbol) where.symbol = symbol;
      if (timeframe) where.timeframe = timeframe;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp[require('sequelize').Op.gte] = new Date(startDate);
        if (endDate) where.timestamp[require('sequelize').Op.lte] = new Date(endDate);
      }

      const { count, rows } = await MarketData.findAndCountAll({
        where,
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ],
        order: [['timestamp', 'DESC']],
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
      console.error('Error al obtener datos de mercado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/market-data/{id}:
   *   get:
   *     summary: Obtener dato de mercado por ID
   *     tags: [Market Data]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del dato de mercado
   *     responses:
   *       200:
   *         description: Dato de mercado encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/MarketData'
   *       404:
   *         description: Dato de mercado no encontrado
   */
  static async getMarketDataById(req, res) {
    try {
      const { id } = req.params;

      const marketData = await MarketData.findByPk(id, {
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ]
      });

      if (!marketData) {
        return res.status(404).json({
          success: false,
          message: 'Dato de mercado no encontrado'
        });
      }

      res.json({
        success: true,
        data: marketData
      });
    } catch (error) {
      console.error('Error al obtener dato de mercado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/market-data:
   *   post:
   *     summary: Crear nuevo dato de mercado
   *     tags: [Market Data]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MarketDataRequest'
   *     responses:
   *       201:
   *         description: Dato de mercado creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/MarketData'
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   */
  static async createMarketData(req, res) {
    try {
      const marketData = await MarketData.create(req.body);

      const createdData = await MarketData.findByPk(marketData.id, {
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdData
      });
    } catch (error) {
      console.error('Error al crear dato de mercado:', error);
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
   * /api/market-data/{id}:
   *   put:
   *     summary: Actualizar dato de mercado
   *     tags: [Market Data]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del dato de mercado
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MarketDataRequest'
   *     responses:
   *       200:
   *         description: Dato de mercado actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/MarketData'
   *       404:
   *         description: Dato de mercado no encontrado
   *       400:
   *         description: Datos inválidos
   */
  static async updateMarketData(req, res) {
    try {
      const { id } = req.params;

      const marketData = await MarketData.findByPk(id);

      if (!marketData) {
        return res.status(404).json({
          success: false,
          message: 'Dato de mercado no encontrado'
        });
      }

      await marketData.update(req.body);

      const updatedData = await MarketData.findByPk(id, {
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedData
      });
    } catch (error) {
      console.error('Error al actualizar dato de mercado:', error);
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
   * /api/market-data/{id}:
   *   delete:
   *     summary: Eliminar dato de mercado
   *     tags: [Market Data]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del dato de mercado
   *     responses:
   *       200:
   *         description: Dato de mercado eliminado exitosamente
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
   *         description: Dato de mercado no encontrado
   */
  static async deleteMarketData(req, res) {
    try {
      const { id } = req.params;

      const marketData = await MarketData.findByPk(id);

      if (!marketData) {
        return res.status(404).json({
          success: false,
          message: 'Dato de mercado no encontrado'
        });
      }

      await marketData.destroy();

      res.json({
        success: true,
        message: 'Dato de mercado eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar dato de mercado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/market-data/latest/{symbol}:
   *   get:
   *     summary: Obtener el último dato de mercado por símbolo
   *     tags: [Market Data]
   *     parameters:
   *       - in: path
   *         name: symbol
   *         required: true
   *         schema:
   *           type: string
   *         description: Símbolo del instrumento
   *       - in: query
   *         name: timeframe
   *         schema:
   *           type: string
   *         description: Timeframe específico
   *     responses:
   *       200:
   *         description: Último dato de mercado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/MarketData'
   *       404:
   *         description: No se encontraron datos para el símbolo
   */
  static async getLatestMarketData(req, res) {
    try {
      const { symbol } = req.params;
      const { timeframe } = req.query;

      const where = { symbol };
      if (timeframe) where.timeframe = timeframe;

      const marketData = await MarketData.findOne({
        where,
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ],
        order: [['timestamp', 'DESC']]
      });

      if (!marketData) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron datos para el símbolo especificado'
        });
      }

      res.json({
        success: true,
        data: marketData
      });
    } catch (error) {
      console.error('Error al obtener último dato de mercado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/market-data/history/{symbol}:
   *   get:
   *     summary: Obtener historial de datos de mercado
   *     tags: [Market Data]
   *     parameters:
   *       - in: path
   *         name: symbol
   *         required: true
   *         schema:
   *           type: string
   *         description: Símbolo del instrumento
   *       - in: query
   *         name: timeframe
   *         schema:
   *           type: string
   *         description: Timeframe específico
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
   *           default: 1000
   *         description: Número máximo de registros
   *     responses:
   *       200:
   *         description: Historial de datos de mercado
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
   *                     $ref: '#/components/schemas/MarketData'
   *       404:
   *         description: No se encontraron datos para el símbolo
   */
  static async getMarketDataHistory(req, res) {
    try {
      const { symbol } = req.params;
      const { timeframe, startDate, endDate, limit = 1000 } = req.query;

      const where = { symbol };
      if (timeframe) where.timeframe = timeframe;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp[require('sequelize').Op.gte] = new Date(startDate);
        if (endDate) where.timestamp[require('sequelize').Op.lte] = new Date(endDate);
      }

      const marketData = await MarketData.findAll({
        where,
        include: [
          {
            model: Market,
            as: 'market',
            attributes: ['id', 'name', 'symbol', 'exchange']
          }
        ],
        order: [['timestamp', 'ASC']],
        limit: parseInt(limit)
      });

      if (marketData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron datos para el símbolo especificado'
        });
      }

      res.json({
        success: true,
        data: marketData
      });
    } catch (error) {
      console.error('Error al obtener historial de datos de mercado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = MarketDataController;
