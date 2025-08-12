const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Position = sequelize.define('Position', {
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
  symbol: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      len: [1, 20]
    }
  },
  side: {
    type: DataTypes.ENUM('long', 'short'),
    allowNull: false
  },
  size: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  entryPrice: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  markPrice: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  unrealizedPnl: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0
  },
  realizedPnl: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0
  },
  liquidationPrice: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  marginType: {
    type: DataTypes.ENUM('isolated', 'cross'),
    defaultValue: 'cross'
  },
  isolatedMargin: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  isAutoAddMargin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  positionSide: {
    type: DataTypes.ENUM('BOTH', 'LONG', 'SHORT'),
    defaultValue: 'BOTH'
  },
  notional: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  breakEvenPrice: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  stopLoss: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  takeProfit: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  trailingStop: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'positions',
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
      fields: ['side']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Métodos de instancia
Position.prototype.updateUnrealizedPnl = function(currentPrice) {
  if (this.side === 'long') {
    this.unrealizedPnl = (currentPrice - this.entryPrice) * this.size;
  } else {
    this.unrealizedPnl = (this.entryPrice - currentPrice) * this.size;
  }
  this.markPrice = currentPrice;
};

Position.prototype.getTotalPnl = function() {
  return this.unrealizedPnl + this.realizedPnl;
};

Position.prototype.getPnlPercentage = function() {
  const totalValue = this.size * this.entryPrice;
  return totalValue > 0 ? (this.getTotalPnl() / totalValue) * 100 : 0;
};

Position.prototype.isProfitable = function() {
  return this.getTotalPnl() > 0;
};

Position.prototype.isLong = function() {
  return this.side === 'long';
};

Position.prototype.isShort = function() {
  return this.side === 'short';
};

Position.prototype.getPositionValue = function() {
  return this.size * this.markPrice;
};

Position.prototype.getNotionalValue = function() {
  return this.notional || this.getPositionValue();
};

Position.prototype.isAtRisk = function() {
  if (!this.liquidationPrice) return false;
  
  if (this.isLong()) {
    return this.markPrice <= this.liquidationPrice;
  } else {
    return this.markPrice >= this.liquidationPrice;
  }
};

Position.prototype.getRiskPercentage = function() {
  if (!this.liquidationPrice) return 0;
  
  const distance = Math.abs(this.markPrice - this.liquidationPrice);
  return (distance / this.markPrice) * 100;
};

// Métodos estáticos
Position.getActivePositions = async function(userId, symbol = null) {
  const where = {
    user_id: userId,
    size: { [sequelize.Op.gt]: 0 }
  };
  
  if (symbol) {
    where.symbol = symbol;
  }
  
  return await this.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });
};

Position.getPositionsByStrategy = async function(userId, strategyId) {
  return await this.findAll({
    where: {
      user_id: userId,
      strategy_id: strategyId,
      size: { [sequelize.Op.gt]: 0 }
    },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = Position;
