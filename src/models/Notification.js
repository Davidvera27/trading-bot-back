const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
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
  type: {
    type: DataTypes.ENUM(
      'order_executed',
      'order_cancelled',
      'position_opened',
      'position_closed',
      'stop_loss_triggered',
      'take_profit_triggered',
      'strategy_activated',
      'strategy_deactivated',
      'error_occurred',
      'system_alert',
      'price_alert',
      'backtest_completed'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveryMethods: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      email: false,
      sms: false,
      push: false,
      webhook: false
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
              fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['isRead']
    },
    {
      fields: ['isSent']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Métodos de instancia
Notification.prototype.markAsRead = function() {
  this.isRead = true;
};

Notification.prototype.markAsUnread = function() {
  this.isRead = false;
};

Notification.prototype.markAsSent = function() {
  this.isSent = true;
  this.sentAt = new Date();
};

Notification.prototype.isCritical = function() {
  return this.priority === 'critical';
};

Notification.prototype.isHighPriority = function() {
  return this.priority === 'high' || this.priority === 'critical';
};

Notification.prototype.shouldSendEmail = function() {
  return this.deliveryMethods.email === true;
};

Notification.prototype.shouldSendSMS = function() {
  return this.deliveryMethods.sms === true;
};

Notification.prototype.shouldSendPush = function() {
  return this.deliveryMethods.push === true;
};

Notification.prototype.shouldSendWebhook = function() {
  return this.deliveryMethods.webhook === true;
};

Notification.prototype.getMetadata = function(key, defaultValue = null) {
  return this.metadata && this.metadata[key] !== undefined ? this.metadata[key] : defaultValue;
};

Notification.prototype.setMetadata = function(key, value) {
  this.metadata = { ...this.metadata, [key]: value };
};

// Métodos estáticos
  Notification.getUnreadNotifications = async function(userId, limit = 50) {
    return await this.findAll({
      where: { user_id: userId, isRead: false },
    order: [['createdAt', 'DESC']],
    limit
  });
};

  Notification.getNotificationsByType = async function(userId, type, limit = 20) {
    return await this.findAll({
      where: { user_id: userId, type },
    order: [['createdAt', 'DESC']],
    limit
  });
};

Notification.getHighPriorityNotifications = async function(userId, limit = 20) {
  return await this.findAll({
          where: {
        user_id: userId,
        priority: ['high', 'critical']
      },
    order: [['createdAt', 'DESC']],
    limit
  });
};

  Notification.getUnsentNotifications = async function(userId, limit = 50) {
    return await this.findAll({
      where: { user_id: userId, isSent: false },
    order: [['createdAt', 'ASC']],
    limit
  });
};

  Notification.markAllAsRead = async function(userId) {
    return await this.update(
      { isRead: true },
      { where: { user_id: userId, isRead: false } }
    );
};

Notification.deleteOldNotifications = async function(userId, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.destroy({
    where: {
      user_id: userId,
      createdAt: {
        [sequelize.Op.lt]: cutoffDate
      }
    }
  });
};

// Métodos de creación de notificaciones específicas
Notification.createOrderExecuted = async function(userId, orderData) {
  return await this.create({
    user_id: userId,
    type: 'order_executed',
    title: 'Orden Ejecutada',
    message: `La orden ${orderData.symbol} ${orderData.side} ha sido ejecutada exitosamente.`,
    priority: 'medium',
    metadata: { orderId: orderData.id, symbol: orderData.symbol, side: orderData.side }
  });
};

Notification.createPriceAlert = async function(userId, symbol, price, condition) {
  return await this.create({
    user_id: userId,
    type: 'price_alert',
    title: 'Alerta de Precio',
    message: `El precio de ${symbol} ha alcanzado ${price} (${condition}).`,
    priority: 'high',
    metadata: { symbol, price, condition }
  });
};

Notification.createSystemAlert = async function(userId, title, message, priority = 'medium') {
  return await this.create({
    user_id: userId,
    type: 'system_alert',
    title,
    message,
    priority
  });
};

module.exports = Notification;
