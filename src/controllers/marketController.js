const { Market } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     Market:
 *       type: object
 *       required:
 *         - name
 *         - symbol
 *         - type
 *         - baseAsset
 *         - quoteAsset
 *         - exchange
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del mercado
 *         name:
 *           type: string
 *           description: Nombre del mercado
 *         symbol:
 *           type: string
 *           description: Símbolo del mercado
 *         type:
 *           type: string
 *           enum: [spot, futures, options]
 *           description: Tipo de mercado
 *         baseAsset:
 *           type: string
 *           description: Activo base
 *         quoteAsset:
 *           type: string
 *           description: Activo cotizado
 *         exchange:
 *           type: string
 *           description: Exchange donde se opera
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Estado activo del mercado
 *         minQuantity:
 *           type: number
 *           format: decimal
 *           description: Cantidad mínima de trading
 *         maxQuantity:
 *           type: number
 *           format: decimal
 *           description: Cantidad máxima de trading
 *         tickSize:
 *           type: number
 *           format: decimal
 *           description: Tamaño mínimo del tick
 *         stepSize:
 *           type: number
 *           format: decimal
 *           description: Tamaño del paso
 *         commission:
 *           type: number
 *           format: decimal
 *           default: 0.001
 *           description: Comisión del mercado
 *         metadata:
 *           type: object
 *           description: Metadatos adicionales
 *     MarketCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - symbol
 *         - type
 *         - baseAsset
 *         - quoteAsset
 *         - exchange
 *       properties:
 *         name:
 *           type: string
 *         symbol:
 *           type: string
 *         type:
 *           type: string
 *           enum: [spot, futures, options]
 *         baseAsset:
 *           type: string
 *         quoteAsset:
 *           type: string
 *         exchange:
 *           type: string
 *         isActive:
 *           type: boolean
 *         minQuantity:
 *           type: number
 *         maxQuantity:
 *           type: number
 *         tickSize:
 *           type: number
 *         stepSize:
 *           type: number
 *         commission:
 *           type: number
 *         metadata:
 *           type: object
 *     MarketUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         symbol:
 *           type: string
 *         type:
 *           type: string
 *           enum: [spot, futures, options]
 *         baseAsset:
 *           type: string
 *         quoteAsset:
 *           type: string
 *         exchange:
 *           type: string
 *         isActive:
 *           type: boolean
 *         minQuantity:
 *           type: number
 *         maxQuantity:
 *           type: number
 *         tickSize:
 *           type: number
 *         stepSize:
 *           type: number
 *         commission:
 *           type: number
 *         metadata:
 *           type: object
 *     MarketListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         markets:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Market'
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

class MarketController {
  /**
   * @swagger
   * /api/markets:
   *   get:
   *     summary: Obtener lista de mercados
   *     tags: [Markets]
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
   *         description: Buscar por nombre o símbolo
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [spot, futures, options]
   *         description: Filtrar por tipo de mercado
   *       - in: query
   *         name: exchange
   *         schema:
   *           type: string
   *         description: Filtrar por exchange
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo
   *     responses:
   *       200:
   *         description: Lista de mercados
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MarketListResponse'
   */
  static async getMarkets(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Construir filtros
      const where = {};
      if (req.query.search) {
        where[require('sequelize').Op.or] = [
          { name: { [require('sequelize').Op.iLike]: `%${req.query.search}%` } },
          { symbol: { [require('sequelize').Op.iLike]: `%${req.query.search}%` } }
        ];
      }
      if (req.query.type) {
        where.type = req.query.type;
      }
      if (req.query.exchange) {
        where.exchange = req.query.exchange;
      }
      if (req.query.isActive !== undefined) {
        where.isActive = req.query.isActive === 'true';
      }

      // Obtener mercados con paginación
      const { count, rows: markets } = await Market.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        markets,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error al obtener mercados:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/markets/{id}:
   *   get:
   *     summary: Obtener mercado por ID
   *     tags: [Markets]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del mercado
   *     responses:
   *       200:
   *         description: Mercado encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 market:
   *                   $ref: '#/components/schemas/Market'
   *       404:
   *         description: Mercado no encontrado
   */
  static async getMarketById(req, res) {
    try {
      const { id } = req.params;

      const market = await Market.findByPk(id);

      if (!market) {
        return res.status(404).json({
          success: false,
          message: 'Mercado no encontrado'
        });
      }

      res.json({
        success: true,
        market
      });
    } catch (error) {
      console.error('Error al obtener mercado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/markets:
   *   post:
   *     summary: Crear nuevo mercado (solo admin)
   *     tags: [Markets]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MarketCreateRequest'
   *     responses:
   *       201:
   *         description: Mercado creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 market:
   *                   $ref: '#/components/schemas/Market'
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       409:
   *         description: Mercado ya existe
   */
  static async createMarket(req, res) {
    try {
      // Verificar si es admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden crear mercados.'
        });
      }

      const marketData = req.body;

      // Verificar si el mercado ya existe
      const existingMarket = await Market.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { symbol: marketData.symbol },
            { name: marketData.name }
          ]
        }
      });

      if (existingMarket) {
        return res.status(409).json({
          success: false,
          message: 'El mercado ya existe'
        });
      }

      const market = await Market.create(marketData);

      res.status(201).json({
        success: true,
        message: 'Mercado creado exitosamente',
        market
      });
    } catch (error) {
      console.error('Error al crear mercado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/markets/{id}:
   *   put:
   *     summary: Actualizar mercado (solo admin)
   *     tags: [Markets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del mercado
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MarketUpdateRequest'
   *     responses:
   *       200:
   *         description: Mercado actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 market:
   *                   $ref: '#/components/schemas/Market'
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Acceso denegado
   *       404:
   *         description: Mercado no encontrado
   *       409:
   *         description: Mercado ya existe
   */
  static async updateMarket(req, res) {
    try {
      // Verificar si es admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden actualizar mercados.'
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const market = await Market.findByPk(id);

      if (!market) {
        return res.status(404).json({
          success: false,
          message: 'Mercado no encontrado'
        });
      }

      // Verificar si el símbolo o nombre ya existe (si se está actualizando)
      if (updateData.symbol || updateData.name) {
        const existingMarket = await Market.findOne({
          where: {
            [require('sequelize').Op.and]: [
              {
                [require('sequelize').Op.or]: [
                  updateData.symbol ? { symbol: updateData.symbol } : {},
                  updateData.name ? { name: updateData.name } : {}
                ]
              },
              { id: { [require('sequelize').Op.ne]: id } }
            ]
          }
        });

        if (existingMarket) {
          return res.status(409).json({
            success: false,
            message: 'El símbolo o nombre ya está en uso'
          });
        }
      }

      await market.update(updateData);

      res.json({
        success: true,
        message: 'Mercado actualizado exitosamente',
        market
      });
    } catch (error) {
      console.error('Error al actualizar mercado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/markets/{id}:
   *   delete:
   *     summary: Eliminar mercado (solo admin)
   *     tags: [Markets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del mercado
   *     responses:
   *       200:
   *         description: Mercado eliminado exitosamente
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
   *         description: Mercado no encontrado
   */
  static async deleteMarket(req, res) {
    try {
      // Verificar si es admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden eliminar mercados.'
        });
      }

      const { id } = req.params;

      const market = await Market.findByPk(id);

      if (!market) {
        return res.status(404).json({
          success: false,
          message: 'Mercado no encontrado'
        });
      }

      await market.destroy();

      res.json({
        success: true,
        message: 'Mercado eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar mercado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/markets/active:
   *   get:
   *     summary: Obtener mercados activos
   *     tags: [Markets]
   *     responses:
   *       200:
   *         description: Lista de mercados activos
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 markets:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Market'
   */
  static async getActiveMarkets(req, res) {
    try {
      const markets = await Market.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        markets
      });
    } catch (error) {
      console.error('Error al obtener mercados activos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/markets/symbol/{symbol}:
   *   get:
   *     summary: Obtener mercado por símbolo
   *     tags: [Markets]
   *     parameters:
   *       - in: path
   *         name: symbol
   *         required: true
   *         schema:
   *           type: string
   *         description: Símbolo del mercado
   *     responses:
   *       200:
   *         description: Mercado encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 market:
   *                   $ref: '#/components/schemas/Market'
   *       404:
   *         description: Mercado no encontrado
   */
  static async getMarketBySymbol(req, res) {
    try {
      const { symbol } = req.params;

      const market = await Market.findOne({
        where: { symbol: symbol.toUpperCase() }
      });

      if (!market) {
        return res.status(404).json({
          success: false,
          message: 'Mercado no encontrado'
        });
      }

      res.json({
        success: true,
        market
      });
    } catch (error) {
      console.error('Error al obtener mercado por símbolo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/markets/exchanges:
   *   get:
   *     summary: Obtener lista de exchanges disponibles
   *     tags: [Markets]
   *     responses:
   *       200:
   *         description: Lista de exchanges
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 exchanges:
   *                   type: array
   *                   items:
   *                     type: string
   */
  static async getExchanges(req, res) {
    try {
      const exchanges = await Market.findAll({
        attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('exchange')), 'exchange']],
        raw: true
      });

      const exchangeList = exchanges.map(item => item.exchange);

      res.json({
        success: true,
        exchanges: exchangeList
      });
    } catch (error) {
      console.error('Error al obtener exchanges:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = MarketController;
