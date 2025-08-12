const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Market = sequelize.define('Market', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 50]
    }
  },
  symbol: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 20]
    }
  },
  type: {
    type: DataTypes.ENUM('crypto', 'forex', 'stock', 'commodity', 'index'),
    allowNull: false
  },
  baseAsset: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      len: [1, 20]
    }
  },
  quoteAsset: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      len: [1, 20]
    }
  },
  exchange: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  minQuantity: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  maxQuantity: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  tickSize: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  stepSize: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  commission: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0.001,
    allowNull: false,
    validate: {
      min: 0,
      max: 1
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'markets',
  timestamps: true,
  indexes: [
    {
      fields: ['symbol']
    },
    {
      fields: ['type']
    },
    {
      fields: ['exchange']
    },
    {
      fields: ['isActive']
    }
  ]
});

// Métodos de instancia
Market.prototype.getFullSymbol = function() {
  return `${this.baseAsset}${this.quoteAsset}`;
};

Market.prototype.isValidQuantity = function(quantity) {
  if (this.minQuantity && quantity < this.minQuantity) return false;
  if (this.maxQuantity && quantity > this.maxQuantity) return false;
  return true;
};

Market.prototype.roundQuantity = function(quantity) {
  if (!this.stepSize) return quantity;
  const steps = Math.round(quantity / this.stepSize);
  return steps * this.stepSize;
};

Market.prototype.roundPrice = function(price) {
  if (!this.tickSize) return price;
  const ticks = Math.round(price / this.tickSize);
  return ticks * this.tickSize;
};

module.exports = Market;
