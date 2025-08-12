const User = require('./User');
const Market = require('./Market');
const Strategy = require('./Strategy');
const MarketData = require('./MarketData');
const Order = require('./Order');
const Position = require('./Position');
const TechnicalIndicator = require('./TechnicalIndicator');
const Backtest = require('./Backtest');
const Notification = require('./Notification');

// Definir relaciones entre modelos

// User - Strategy (1:N)
User.hasMany(Strategy, { foreignKey: 'user_id', as: 'strategies' });
Strategy.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Order (1:N)
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Position (1:N)
User.hasMany(Position, { foreignKey: 'user_id', as: 'positions' });
Position.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Backtest (1:N)
User.hasMany(Backtest, { foreignKey: 'user_id', as: 'backtests' });
Backtest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Notification (1:N)
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Market - MarketData (1:N)
Market.hasMany(MarketData, { foreignKey: 'market_id', as: 'marketData' });
MarketData.belongsTo(Market, { foreignKey: 'market_id', as: 'market' });

// Market - Order (1:N)
Market.hasMany(Order, { foreignKey: 'market_id', as: 'orders' });
Order.belongsTo(Market, { foreignKey: 'market_id', as: 'market' });

// Market - Position (1:N)
Market.hasMany(Position, { foreignKey: 'market_id', as: 'positions' });
Position.belongsTo(Market, { foreignKey: 'market_id', as: 'market' });

// Market - TechnicalIndicator (1:N)
Market.hasMany(TechnicalIndicator, { foreignKey: 'market_id', as: 'technicalIndicators' });
TechnicalIndicator.belongsTo(Market, { foreignKey: 'market_id', as: 'market' });

// Strategy - Order (1:N)
Strategy.hasMany(Order, { foreignKey: 'strategy_id', as: 'orders' });
Order.belongsTo(Strategy, { foreignKey: 'strategy_id', as: 'strategy' });

// Strategy - Position (1:N)
Strategy.hasMany(Position, { foreignKey: 'strategy_id', as: 'positions' });
Position.belongsTo(Strategy, { foreignKey: 'strategy_id', as: 'strategy' });

// Strategy - Backtest (1:N)
Strategy.hasMany(Backtest, { foreignKey: 'strategy_id', as: 'backtests' });
Backtest.belongsTo(Strategy, { foreignKey: 'strategy_id', as: 'strategy' });

// Exportar todos los modelos
module.exports = {
  User,
  Market,
  Strategy,
  MarketData,
  Order,
  Position,
  TechnicalIndicator,
  Backtest,
  Notification
};
