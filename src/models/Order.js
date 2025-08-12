const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  strategy_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'strategies',
      key: 'id'
    }
  },
  market_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'markets',
      key: 'id'
    }
  },
  exchangeOrderId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  symbol: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      len: [1, 20]
    }
  },
  side: {
    type: DataTypes.ENUM('buy', 'sell'),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('market', 'limit', 'stop', 'stop_limit', 'oco', 'trailing_stop'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  price: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  stopPrice: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  executedQuantity: {
    type: DataTypes.DECIMAL(20, 8),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  averagePrice: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'filled', 'partially_filled', 'cancelled', 'rejected', 'expired'),
    defaultValue: 'pending'
  },
  commission: {
    type: DataTypes.DECIMAL(20, 8),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  commissionAsset: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [1, 20]
    }
  },
  timeInForce: {
    type: DataTypes.ENUM('GTC', 'IOC', 'FOK'),
    defaultValue: 'GTC'
  },
  isReduceOnly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isClosePosition: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  activatePrice: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  callbackRate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  workingType: {
    type: DataTypes.ENUM('CONTRACT_PRICE', 'MARK_PRICE'),
    defaultValue: 'CONTRACT_PRICE'
  },
  priceProtect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  newOrderRespType: {
    type: DataTypes.ENUM('ACK', 'RESULT', 'FULL'),
    defaultValue: 'RESULT'
  },
  priceMatch: {
    type: DataTypes.ENUM('NONE', 'OPPONENT', 'OPPONENT_5', 'OPPONENT_10', 'OPPONENT_20', 'QTY', 'QTY_5', 'QTY_10', 'QTY_20'),
    defaultValue: 'NONE'
  },
  selfTradePreventionMode: {
    type: DataTypes.ENUM('NONE', 'EXPIRE_TAKER', 'EXPIRE_MAKER', 'EXPIRE_BOTH'),
    defaultValue: 'NONE'
  },
  goodTillDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    {
              fields: ['user_id']
      },
      {
        fields: ['strategy_id']
      },
      {
        fields: ['market_id']
    },
    {
      fields: ['symbol']
    },
    {
      fields: ['status']
    },
    {
      fields: ['side']
    },
    {
      fields: ['type']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['exchangeOrderId']
    }
  ]
});

// Métodos de instancia
Order.prototype.getRemainingQuantity = function() {
  return this.quantity - this.executedQuantity;
};

Order.prototype.getFilledPercentage = function() {
  return (this.executedQuantity / this.quantity) * 100;
};

Order.prototype.isFullyFilled = function() {
  return this.executedQuantity >= this.quantity;
};

Order.prototype.isPartiallyFilled = function() {
  return this.executedQuantity > 0 && this.executedQuantity < this.quantity;
};

Order.prototype.isPending = function() {
  return this.status === 'pending';
};

Order.prototype.isActive = function() {
  return ['pending', 'partially_filled'].includes(this.status);
};

Order.prototype.canCancel = function() {
  return ['pending', 'partially_filled'].includes(this.status);
};

Order.prototype.getTotalValue = function() {
  return this.quantity * (this.price || this.averagePrice || 0);
};

Order.prototype.getExecutedValue = function() {
  return this.executedQuantity * (this.averagePrice || 0);
};

// Métodos estáticos
Order.getActiveOrders = async function(userId, symbol = null) {
  const where = {
    user_id: userId,
    status: ['pending', 'partially_filled']
  };
  
  if (symbol) {
    where.symbol = symbol;
  }
  
  return await this.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });
};

  Order.getOrderHistory = async function(userId, limit = 50) {
    return await this.findAll({
      where: { user_id: userId },
    order: [['createdAt', 'DESC']],
    limit
  });
};

module.exports = Order;
