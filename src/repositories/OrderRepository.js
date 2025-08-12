const { Order, Market, Strategy, User } = require('../models');
const { Op } = require('sequelize');

class OrderRepository {
  /**
   * Crear una nueva orden
   */
  static async create(orderData) {
    return await Order.create(orderData);
  }

  /**
   * Obtener orden por ID con includes
   */
  static async findById(id, userId) {
    return await Order.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: Market,
          as: 'market',
          attributes: ['id', 'name', 'symbol', 'type', 'exchange']
        },
        {
          model: Strategy,
          as: 'strategy',
          attributes: ['id', 'name', 'type', 'description']
        }
      ]
    });
  }

  /**
   * Obtener órdenes con filtros y paginación
   */
  static async findWithFilters(filters, userId) {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      symbol,
      strategy_id,
      side,
      startDate,
      endDate
    } = filters;

    const where = { user_id: userId };
    const offset = (page - 1) * limit;

    // Aplicar filtros
    if (status) where.status = status;
    if (type) where.type = type;
    if (symbol) where.symbol = symbol;
    if (strategy_id) where.strategy_id = strategy_id;
    if (side) where.side = side;

    // Filtros de fecha
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Market,
          as: 'market',
          attributes: ['id', 'name', 'symbol', 'type']
        },
        {
          model: Strategy,
          as: 'strategy',
          attributes: ['id', 'name', 'type']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      orders: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Obtener órdenes pendientes
   */
  static async findPending(userId) {
    return await Order.findAll({
      where: {
        user_id: userId,
        status: 'pending'
      },
      include: [
        {
          model: Market,
          as: 'market',
          attributes: ['id', 'name', 'symbol']
        }
      ],
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * Actualizar orden
   */
  static async update(id, userId, updateData) {
    const [updatedRows] = await Order.update(updateData, {
      where: { id, user_id: userId }
    });
    
    if (updatedRows === 0) {
      throw new Error('Orden no encontrada o no autorizada');
    }
    
    return await this.findById(id, userId);
  }

  /**
   * Eliminar orden
   */
  static async delete(id, userId) {
    const deletedRows = await Order.destroy({
      where: { id, user_id: userId }
    });
    
    if (deletedRows === 0) {
      throw new Error('Orden no encontrada o no autorizada');
    }
    
    return true;
  }

  /**
   * Obtener estadísticas de órdenes
   */
  static async getStatistics(userId) {
    const total = await Order.count({ where: { user_id: userId } });
    const pending = await Order.count({ 
      where: { user_id: userId, status: 'pending' } 
    });
    const filled = await Order.count({ 
      where: { user_id: userId, status: 'filled' } 
    });
    const cancelled = await Order.count({ 
      where: { user_id: userId, status: 'cancelled' } 
    });
    const rejected = await Order.count({ 
      where: { user_id: userId, status: 'rejected' } 
    });

    // Calcular valor total de órdenes
    const totalValue = await Order.sum('quantity * price', {
      where: { user_id: userId }
    });

    return {
      total,
      pending,
      filled,
      cancelled,
      rejected,
      totalValue: totalValue || 0
    };
  }

  /**
   * Obtener órdenes por estrategia
   */
  static async findByStrategy(strategyId, userId) {
    return await Order.findAll({
      where: {
        strategy_id: strategyId,
        user_id: userId
      },
      include: [
        {
          model: Market,
          as: 'market',
          attributes: ['id', 'name', 'symbol']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Obtener órdenes por símbolo
   */
  static async findBySymbol(symbol, userId, limit = 100) {
    return await Order.findAll({
      where: {
        symbol,
        user_id: userId
      },
      include: [
        {
          model: Strategy,
          as: 'strategy',
          attributes: ['id', 'name', 'type']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  /**
   * Obtener órdenes del día
   */
  static async getTodayOrders(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await Order.findAll({
      where: {
        user_id: userId,
        createdAt: {
          [Op.gte]: today
        }
      },
      include: [
        {
          model: Market,
          as: 'market',
          attributes: ['id', 'name', 'symbol']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Obtener órdenes por rango de fechas
   */
  static async getOrdersByDateRange(userId, startDate, endDate) {
    return await Order.findAll({
      where: {
        user_id: userId,
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [
        {
          model: Market,
          as: 'market',
          attributes: ['id', 'name', 'symbol']
        },
        {
          model: Strategy,
          as: 'strategy',
          attributes: ['id', 'name', 'type']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = OrderRepository;
