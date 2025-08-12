const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TechnicalIndicator = sequelize.define('TechnicalIndicator', {
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
  indicatorType: {
    type: DataTypes.ENUM(
      'SMA', 'EMA', 'WMA', 'RSI', 'MACD', 'BB', 'ATR',
      'STOCH', 'CCI', 'ADX', 'OBV', 'VWAP', 'PIVOT',
      'FIBONACCI', 'WILLIAMS_R', 'ROC', 'MFI', 'KST'
    ),
    allowNull: false
  },
  parameters: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  values: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  signals: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'technical_indicators',
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
      fields: ['indicatorType']
    },
    {
      fields: ['symbol', 'timeframe', 'indicatorType', 'timestamp'],
      unique: true
    }
  ]
});

// Métodos de instancia
TechnicalIndicator.prototype.getValue = function(key) {
  return this.values[key];
};

TechnicalIndicator.prototype.setValue = function(key, value) {
  this.values = { ...this.values, [key]: value };
};

TechnicalIndicator.prototype.getParameter = function(key, defaultValue = null) {
  return this.parameters[key] !== undefined ? this.parameters[key] : defaultValue;
};

TechnicalIndicator.prototype.setParameter = function(key, value) {
  this.parameters = { ...this.parameters, [key]: value };
};

TechnicalIndicator.prototype.getSignal = function(key) {
  return this.signals[key];
};

TechnicalIndicator.prototype.setSignal = function(key, value) {
  this.signals = { ...this.signals, [key]: value };
};

TechnicalIndicator.prototype.isBullish = function() {
  return this.signals.signal === 'buy' || this.signals.signal === 'bullish';
};

TechnicalIndicator.prototype.isBearish = function() {
  return this.signals.signal === 'sell' || this.signals.signal === 'bearish';
};

TechnicalIndicator.prototype.isNeutral = function() {
  return this.signals.signal === 'neutral' || this.signals.signal === 'hold';
};

// Métodos estáticos
TechnicalIndicator.getLatestIndicator = async function(symbol, timeframe, indicatorType) {
  return await this.findOne({
    where: { symbol, timeframe, indicatorType },
    order: [['timestamp', 'DESC']]
  });
};

TechnicalIndicator.getIndicatorHistory = async function(symbol, timeframe, indicatorType, limit = 100) {
  return await this.findAll({
    where: { symbol, timeframe, indicatorType },
    order: [['timestamp', 'ASC']],
    limit
  });
};

TechnicalIndicator.getIndicatorsByTimeRange = async function(symbol, timeframe, indicatorType, startTime, endTime) {
  return await this.findAll({
    where: {
      symbol,
      timeframe,
      indicatorType,
      timestamp: {
        [sequelize.Op.between]: [startTime, endTime]
      }
    },
    order: [['timestamp', 'ASC']]
  });
};

// Métodos específicos por tipo de indicador
TechnicalIndicator.prototype.getRSIValue = function() {
  if (this.indicatorType === 'RSI') {
    return this.getValue('rsi');
  }
  return null;
};

TechnicalIndicator.prototype.getMACDValues = function() {
  if (this.indicatorType === 'MACD') {
    return {
      macd: this.getValue('macd'),
      signal: this.getValue('signal'),
      histogram: this.getValue('histogram')
    };
  }
  return null;
};

TechnicalIndicator.prototype.getBollingerBands = function() {
  if (this.indicatorType === 'BB') {
    return {
      upper: this.getValue('upper'),
      middle: this.getValue('middle'),
      lower: this.getValue('lower')
    };
  }
  return null;
};

TechnicalIndicator.prototype.getMovingAverage = function() {
  if (['SMA', 'EMA', 'WMA'].includes(this.indicatorType)) {
    return this.getValue('value');
  }
  return null;
};

module.exports = TechnicalIndicator;
