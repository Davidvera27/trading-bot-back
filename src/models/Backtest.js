const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Backtest = sequelize.define('Backtest', {
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
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  initialCapital: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  finalCapital: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  totalReturn: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    validate: {
      min: -100,
      max: 10000
    }
  },
  totalTrades: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  winningTrades: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  losingTrades: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  winRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  profitFactor: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  sharpeRatio: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0
  },
  maxDrawdown: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  maxDrawdownDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  averageWin: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  averageLoss: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  largestWin: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  largestLoss: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  consecutiveWins: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  consecutiveLosses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  parameters: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
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
  status: {
    type: DataTypes.ENUM('running', 'completed', 'failed', 'cancelled'),
    defaultValue: 'running'
  },
  progress: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'backtests',
  timestamps: true,
  indexes: [
    {
              fields: ['user_id']
      },
      {
        fields: ['strategy_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['startDate']
    },
    {
      fields: ['endDate']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Métodos de instancia
Backtest.prototype.updateProgress = function(progress) {
  this.progress = Math.min(100, Math.max(0, progress));
};

Backtest.prototype.calculateMetrics = function() {
  if (this.totalTrades > 0) {
    this.winRate = (this.winningTrades / this.totalTrades) * 100;
  }
  
  if (this.totalReturn !== 0) {
    this.finalCapital = this.initialCapital * (1 + this.totalReturn / 100);
  }
  
  if (this.averageLoss > 0) {
    this.profitFactor = this.averageWin / this.averageLoss;
  }
};

Backtest.prototype.isCompleted = function() {
  return this.status === 'completed';
};

Backtest.prototype.isRunning = function() {
  return this.status === 'running';
};

Backtest.prototype.isFailed = function() {
  return this.status === 'failed';
};

Backtest.prototype.isCancelled = function() {
  return this.status === 'cancelled';
};

Backtest.prototype.getDuration = function() {
  return this.endDate - this.startDate;
};

Backtest.prototype.getDurationInDays = function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
};

Backtest.prototype.getAbsoluteReturn = function() {
  return this.finalCapital - this.initialCapital;
};

Backtest.prototype.getReturnPercentage = function() {
  return this.totalReturn;
};

// Métodos estáticos
Backtest.getUserBacktests = async function(userId, limit = 50) {
  return await this.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
    limit
  });
};

Backtest.getStrategyBacktests = async function(userId, strategyId, limit = 20) {
  return await this.findAll({
    where: { user_id: userId, strategy_id: strategyId },
    order: [['createdAt', 'DESC']],
    limit
  });
};

Backtest.getCompletedBacktests = async function(userId, limit = 20) {
  return await this.findAll({
    where: { user_id: userId, status: 'completed' },
    order: [['createdAt', 'DESC']],
    limit
  });
};

module.exports = Backtest;
