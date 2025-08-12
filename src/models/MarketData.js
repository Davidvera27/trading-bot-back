const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MarketData = sequelize.define('MarketData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
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
  timeframe: {
    type: DataTypes.ENUM(
      '1m', '3m', '5m', '15m', '30m',
      '1h', '2h', '4h', '6h', '8h', '12h',
      '1d', '3d', '1w', '1M'
    ),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  open: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  high: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  low: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  close: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  volume: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  quoteVolume: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  numberOfTrades: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  takerBuyBaseVolume: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  takerBuyQuoteVolume: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'market_data',
  timestamps: true,
  indexes: [
    {
              fields: ['market_id']
    },
    {
      fields: ['symbol']
    },
    {
      fields: ['timeframe']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['symbol', 'timeframe', 'timestamp'],
      unique: true
    }
  ]
});

// Métodos de instancia
MarketData.prototype.getOHLCV = function() {
  return {
    open: this.open,
    high: this.high,
    low: this.low,
    close: this.close,
    volume: this.volume
  };
};

MarketData.prototype.getPriceChange = function() {
  return this.close - this.open;
};

MarketData.prototype.getPriceChangePercent = function() {
  return ((this.close - this.open) / this.open) * 100;
};

MarketData.prototype.getHighLowRange = function() {
  return this.high - this.low;
};

MarketData.prototype.getHighLowRangePercent = function() {
  return ((this.high - this.low) / this.low) * 100;
};

MarketData.prototype.isBullish = function() {
  return this.close > this.open;
};

MarketData.prototype.isBearish = function() {
  return this.close < this.open;
};

MarketData.prototype.isDoji = function() {
  const bodySize = Math.abs(this.close - this.open);
  const totalRange = this.high - this.low;
  return bodySize <= totalRange * 0.1; // Doji si el cuerpo es <= 10% del rango total
};

// Métodos estáticos
MarketData.getLatestData = async function(symbol, timeframe, limit = 100) {
  return await this.findAll({
    where: { symbol, timeframe },
    order: [['timestamp', 'DESC']],
    limit
  });
};

MarketData.getDataRange = async function(symbol, timeframe, startTime, endTime) {
  return await this.findAll({
    where: {
      symbol,
      timeframe,
      timestamp: {
        [sequelize.Op.between]: [startTime, endTime]
      }
    },
    order: [['timestamp', 'ASC']]
  });
};

module.exports = MarketData;
