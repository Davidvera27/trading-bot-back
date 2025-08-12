const { User, Position, Order } = require('../models');
const { Op } = require('sequelize');
const { logError } = require('../utils/logger');

class RiskManagementService {
  /**
   * Validar si una operación cumple con los límites de riesgo
   */
  static async validateOrderRisk(userId, orderData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const validations = {
        positionSize: await this.validatePositionSize(userId, orderData),
        dailyLoss: await this.validateDailyLoss(userId, orderData),
        monthlyLoss: await this.validateMonthlyLoss(userId, orderData),
        leverage: await this.validateLeverage(orderData),
        marketHours: await this.validateMarketHours(orderData.symbol)
      };

      const hasErrors = Object.values(validations).some(v => !v.valid);
      
      return {
        valid: !hasErrors,
        validations,
        message: hasErrors ? 'Operación rechazada por límites de riesgo' : 'Operación aprobada'
      };
    } catch (error) {
      logError(error, { userId, orderData });
      return {
        valid: false,
        message: 'Error en validación de riesgo'
      };
    }
  }

  /**
   * Validar tamaño de posición
   */
  static async validatePositionSize(userId, orderData) {
    try {
      const user = await User.findByPk(userId);
      const maxPositionSize = user.riskSettings?.maxPositionSize || 0.02; // 2% por defecto
      
      // Calcular valor total de la posición
      const positionValue = orderData.quantity * orderData.price;
      
      // Obtener balance total del usuario (simulado)
      const totalBalance = 10000; // Esto debería venir de la API de Binance
      
      const positionSizePercentage = positionValue / totalBalance;
      
      return {
        valid: positionSizePercentage <= maxPositionSize,
        value: positionSizePercentage,
        limit: maxPositionSize,
        message: positionSizePercentage > maxPositionSize 
          ? `Tamaño de posición (${(positionSizePercentage * 100).toFixed(2)}%) excede el límite (${(maxPositionSize * 100).toFixed(2)}%)`
          : 'Tamaño de posición válido'
      };
    } catch (error) {
      logError(error, { userId, orderData });
      return { valid: false, message: 'Error validando tamaño de posición' };
    }
  }

  /**
   * Validar pérdida diaria
   */
  static async validateDailyLoss(userId, orderData) {
    try {
      const user = await User.findByPk(userId);
      const maxDailyLoss = user.riskSettings?.maxDailyLoss || 0.05; // 5% por defecto
      
      // Calcular pérdidas del día actual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
             const dailyOrders = await Order.findAll({
         where: {
           user_id: userId,
           createdAt: {
             [Op.gte]: today
           }
         }
       });

      const dailyPnL = dailyOrders.reduce((total, order) => {
        return total + (order.realizedPnl || 0);
      }, 0);

      const totalBalance = 10000; // Debería venir de Binance
      const dailyLossPercentage = Math.abs(Math.min(dailyPnL, 0)) / totalBalance;
      
      return {
        valid: dailyLossPercentage <= maxDailyLoss,
        value: dailyLossPercentage,
        limit: maxDailyLoss,
        message: dailyLossPercentage > maxDailyLoss
          ? `Pérdida diaria (${(dailyLossPercentage * 100).toFixed(2)}%) excede el límite (${(maxDailyLoss * 100).toFixed(2)}%)`
          : 'Pérdida diaria dentro del límite'
      };
    } catch (error) {
      logError(error, { userId, orderData });
      return { valid: false, message: 'Error validando pérdida diaria' };
    }
  }

  /**
   * Validar pérdida mensual
   */
  static async validateMonthlyLoss(userId, orderData) {
    try {
      const user = await User.findByPk(userId);
      const maxMonthlyLoss = user.riskSettings?.maxMonthlyLoss || 0.20; // 20% por defecto
      
      // Calcular pérdidas del mes actual
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
             const monthlyOrders = await Order.findAll({
         where: {
           user_id: userId,
           createdAt: {
             [Op.gte]: firstDayOfMonth
           }
         }
       });

      const monthlyPnL = monthlyOrders.reduce((total, order) => {
        return total + (order.realizedPnl || 0);
      }, 0);

      const totalBalance = 10000; // Debería venir de Binance
      const monthlyLossPercentage = Math.abs(Math.min(monthlyPnL, 0)) / totalBalance;
      
      return {
        valid: monthlyLossPercentage <= maxMonthlyLoss,
        value: monthlyLossPercentage,
        limit: maxMonthlyLoss,
        message: monthlyLossPercentage > maxMonthlyLoss
          ? `Pérdida mensual (${(monthlyLossPercentage * 100).toFixed(2)}%) excede el límite (${(maxMonthlyLoss * 100).toFixed(2)}%)`
          : 'Pérdida mensual dentro del límite'
      };
    } catch (error) {
      logError(error, { userId, orderData });
      return { valid: false, message: 'Error validando pérdida mensual' };
    }
  }

  /**
   * Validar apalancamiento
   */
  static async validateLeverage(orderData) {
    try {
      const maxLeverage = 10; // Configurable
      const leverage = orderData.leverage || 1;
      
      return {
        valid: leverage <= maxLeverage,
        value: leverage,
        limit: maxLeverage,
        message: leverage > maxLeverage
          ? `Apalancamiento (${leverage}x) excede el límite (${maxLeverage}x)`
          : 'Apalancamiento válido'
      };
    } catch (error) {
      logError(error, { orderData });
      return { valid: false, message: 'Error validando apalancamiento' };
    }
  }

  /**
   * Validar horarios de mercado
   */
  static async validateMarketHours(symbol) {
    try {
      // Para crypto, el mercado está abierto 24/7
      // Para otros activos, implementar validación de horarios
      const isCrypto = symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH');
      
      if (isCrypto) {
        return {
          valid: true,
          message: 'Mercado abierto (crypto)'
        };
      }
      
      // Implementar validación para otros mercados
      return {
        valid: true,
        message: 'Validación de horarios no implementada'
      };
    } catch (error) {
      logError(error, { symbol });
      return { valid: false, message: 'Error validando horarios de mercado' };
    }
  }

  /**
   * Calcular tamaño de posición óptimo (Kelly Criterion)
   */
  static calculateOptimalPositionSize(winRate, avgWin, avgLoss, totalBalance) {
    try {
      if (winRate <= 0 || winRate >= 1) {
        return 0.02; // 2% por defecto si no hay datos suficientes
      }

      const kellyPercentage = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
      const conservativeKelly = kellyPercentage * 0.25; // Usar 25% del Kelly para ser conservador
      
      return Math.max(0.01, Math.min(0.1, conservativeKelly)); // Entre 1% y 10%
    } catch (error) {
      logError(error);
      return 0.02; // 2% por defecto en caso de error
    }
  }

  /**
   * Validar correlación entre posiciones existentes
   */
  static async validateCorrelation(userId, newSymbol) {
    try {
      const openPositions = await Position.findAll({
        where: {
          user_id: userId,
          isOpen: true
        }
      });

      // Implementar lógica de correlación
      // Por ahora, limitar a 3 posiciones abiertas
      const maxOpenPositions = 3;
      
      return {
        valid: openPositions.length < maxOpenPositions,
        value: openPositions.length,
        limit: maxOpenPositions,
        message: openPositions.length >= maxOpenPositions
          ? `Máximo número de posiciones abiertas alcanzado (${maxOpenPositions})`
          : 'Número de posiciones dentro del límite'
      };
    } catch (error) {
      logError(error, { userId, newSymbol });
      return { valid: false, message: 'Error validando correlación' };
    }
  }
}

module.exports = RiskManagementService;
