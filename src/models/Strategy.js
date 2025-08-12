const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Strategy = sequelize.define('Strategy', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'scalping',
      'day_trading',
      'swing_trading',
      'position_trading',
      'arbitrage',
      'grid_trading',
      'dca'
    ),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
    allowNull: false
  },
  parameters: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  riskManagement: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      maxPositionSize: 0.02,
      stopLoss: 0.05,
      takeProfit: 0.10,
      maxDailyLoss: 0.05,
      maxMonthlyLoss: 0.20
    }
  },
  markets: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  timeframes: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  indicators: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  notifications: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      email: false,
      sms: false,
      push: false,
      webhook: false
    }
  },
  statistics: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      maxDrawdown: 0,
      sharpeRatio: 0
    }
  }
}, {
  tableName: 'strategies',
  timestamps: true,
  indexes: [
    {
              fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['riskLevel']
    }
  ]
});

// Métodos de instancia
Strategy.prototype.updateStatistics = function(trade) {
  const stats = this.statistics;
  
  stats.totalTrades++;
  
  if (trade.profit > 0) {
    stats.winningTrades++;
    stats.totalProfit += trade.profit;
    stats.averageWin = stats.totalProfit / stats.winningTrades;
  } else {
    stats.losingTrades++;
    stats.totalLoss += Math.abs(trade.profit);
    stats.averageLoss = stats.totalLoss / stats.losingTrades;
  }
  
  stats.winRate = (stats.winningTrades / stats.totalTrades) * 100;
  
  // Calcular drawdown si es necesario
  const currentDrawdown = this.calculateDrawdown();
  if (currentDrawdown > stats.maxDrawdown) {
    stats.maxDrawdown = currentDrawdown;
  }
  
  this.statistics = stats;
};

Strategy.prototype.calculateDrawdown = function() {
  // Implementar cálculo de drawdown
  return 0;
};

Strategy.prototype.isWithinRiskLimits = function(positionSize, dailyLoss, monthlyLoss) {
  const risk = this.riskManagement;
  
  if (positionSize > risk.maxPositionSize) return false;
  if (dailyLoss > risk.maxDailyLoss) return false;
  if (monthlyLoss > risk.maxMonthlyLoss) return false;
  
  return true;
};

Strategy.prototype.getParameter = function(key, defaultValue = null) {
  return this.parameters[key] !== undefined ? this.parameters[key] : defaultValue;
};

Strategy.prototype.setParameter = function(key, value) {
  this.parameters = { ...this.parameters, [key]: value };
};

module.exports = Strategy;
