const Redis = require('ioredis');
const { logger } = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.defaultTTL = 300; // 5 minutos por defecto
  }

  /**
   * Obtener valor del caché
   */
  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Error getting cache value:', error);
      return null;
    }
  }

  /**
   * Establecer valor en caché
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error('Error setting cache value:', error);
      return false;
    }
  }

  /**
   * Eliminar clave del caché
   */
  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Error deleting cache key:', error);
      return false;
    }
  }

  /**
   * Eliminar múltiples claves
   */
  async delPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Error deleting cache pattern:', error);
      return false;
    }
  }

  /**
   * Verificar si existe una clave
   */
  async exists(key) {
    try {
      return await this.redis.exists(key);
    } catch (error) {
      logger.error('Error checking cache key existence:', error);
      return false;
    }
  }

  /**
   * Obtener o establecer caché (get or set)
   */
  async getOrSet(key, callback, ttl = this.defaultTTL) {
    try {
      // Intentar obtener del caché
      let value = await this.get(key);
      
      if (value !== null) {
        return value;
      }

      // Si no existe, ejecutar callback y guardar
      value = await callback();
      
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      logger.error('Error in getOrSet:', error);
      // En caso de error, ejecutar callback directamente
      return await callback();
    }
  }

  /**
   * Invalidar caché por patrón
   */
  async invalidatePattern(pattern) {
    return await this.delPattern(pattern);
  }

  /**
   * Obtener estadísticas del caché
   */
  async getStats() {
    try {
      const info = await this.redis.info();
      const keys = await this.redis.dbsize();
      
      return {
        keys,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Limpiar todo el caché
   */
  async flush() {
    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      logger.error('Error flushing cache:', error);
      return false;
    }
  }

  // Métodos específicos para el trading bot

  /**
   * Caché para datos de mercado
   */
  async getMarketData(symbol, timeframe) {
    const key = `market_data:${symbol}:${timeframe}`;
    return await this.get(key);
  }

  async setMarketData(symbol, timeframe, data, ttl = 60) {
    const key = `market_data:${symbol}:${timeframe}`;
    return await this.set(key, data, ttl);
  }

  /**
   * Caché para indicadores técnicos
   */
  async getTechnicalIndicator(symbol, timeframe, indicator) {
    const key = `indicator:${symbol}:${timeframe}:${indicator}`;
    return await this.get(key);
  }

  async setTechnicalIndicator(symbol, timeframe, indicator, data, ttl = 300) {
    const key = `indicator:${symbol}:${timeframe}:${indicator}`;
    return await this.set(key, data, ttl);
  }

  /**
   * Caché para estadísticas de usuario
   */
  async getUserStats(userId) {
    const key = `user_stats:${userId}`;
    return await this.get(key);
  }

  async setUserStats(userId, stats, ttl = 600) {
    const key = `user_stats:${userId}`;
    return await this.set(key, stats, ttl);
  }

  /**
   * Caché para órdenes pendientes
   */
  async getPendingOrders(userId) {
    const key = `pending_orders:${userId}`;
    return await this.get(key);
  }

  async setPendingOrders(userId, orders, ttl = 30) {
    const key = `pending_orders:${userId}`;
    return await this.set(key, orders, ttl);
  }

  /**
   * Invalidar caché de usuario
   */
  async invalidateUserCache(userId) {
    const patterns = [
      `user_stats:${userId}`,
      `pending_orders:${userId}`,
      `user_*:${userId}`
    ];

    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
  }

  /**
   * Invalidar caché de mercado
   */
  async invalidateMarketCache(symbol) {
    const patterns = [
      `market_data:${symbol}:*`,
      `indicator:${symbol}:*`
    ];

    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
  }
}

// Instancia singleton
const cacheService = new CacheService();

module.exports = cacheService;
