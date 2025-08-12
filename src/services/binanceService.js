const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

class BinanceService {
  constructor() {
    this.baseURL = process.env.BINANCE_TESTNET === 'true' 
      ? 'https://testnet.binance.vision'
      : 'https://api.binance.com';
    
    this.apiKey = process.env.BINANCE_API_KEY;
    this.apiSecret = process.env.BINANCE_API_SECRET;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'X-MBX-APIKEY': this.apiKey
      }
    });
  }

  /**
   * Generar firma para autenticación
   */
  generateSignature(queryString) {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Obtener información de la cuenta
   */
  async getAccountInfo() {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await this.client.get(`/api/v3/account?${queryString}&signature=${signature}`);
      
      logger.info('Account info retrieved successfully', { 
        makerCommission: response.data.makerCommission,
        takerCommission: response.data.takerCommission 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error getting account info:', error);
      throw error;
    }
  }

  /**
   * Obtener balance de la cuenta
   */
  async getAccountBalance() {
    try {
      const accountInfo = await this.getAccountInfo();
      return accountInfo.balances.filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0);
    } catch (error) {
      logger.error('Error getting account balance:', error);
      throw error;
    }
  }

  /**
   * Obtener datos históricos (klines)
   */
  async getKlines(symbol, interval = '1h', limit = 100, startTime = null, endTime = null) {
    try {
      let url = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      
      if (startTime) url += `&startTime=${startTime}`;
      if (endTime) url += `&endTime=${endTime}`;
      
      const response = await this.client.get(url);
      
      const klines = response.data.map(kline => ({
        openTime: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: kline[6],
        quoteAssetVolume: parseFloat(kline[7]),
        numberOfTrades: parseInt(kline[8]),
        takerBuyBaseAssetVolume: parseFloat(kline[9]),
        takerBuyQuoteAssetVolume: parseFloat(kline[10])
      }));
      
      logger.info('Klines retrieved successfully', { symbol, interval, count: klines.length });
      return klines;
    } catch (error) {
      logger.error('Error getting klines:', error);
      throw error;
    }
  }

  /**
   * Obtener precio actual de un símbolo
   */
  async getCurrentPrice(symbol) {
    try {
      const response = await this.client.get(`/api/v3/ticker/price?symbol=${symbol}`);
      const price = parseFloat(response.data.price);
      
      logger.info('Current price retrieved', { symbol, price });
      return price;
    } catch (error) {
      logger.error('Error getting current price:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los precios
   */
  async getAllPrices() {
    try {
      const response = await this.client.get('/api/v3/ticker/price');
      const prices = response.data.map(item => ({
        symbol: item.symbol,
        price: parseFloat(item.price)
      }));
      
      logger.info('All prices retrieved', { count: prices.length });
      return prices;
    } catch (error) {
      logger.error('Error getting all prices:', error);
      throw error;
    }
  }

  /**
   * Crear orden de mercado
   */
  async createMarketOrder(symbol, side, quantity, quoteOrderQty = null) {
    try {
      const timestamp = Date.now();
      let queryString = `symbol=${symbol}&side=${side.toUpperCase()}&type=MARKET&timestamp=${timestamp}`;
      
      if (quoteOrderQty) {
        queryString += `&quoteOrderQty=${quoteOrderQty}`;
      } else {
        queryString += `&quantity=${quantity}`;
      }
      
      const signature = this.generateSignature(queryString);
      const response = await this.client.post(`/api/v3/order?${queryString}&signature=${signature}`);
      
      logger.info('Market order created successfully', { 
        symbol, 
        side, 
        quantity, 
        orderId: response.data.orderId 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error creating market order:', error);
      throw error;
    }
  }

  /**
   * Crear orden límite
   */
  async createLimitOrder(symbol, side, quantity, price, timeInForce = 'GTC') {
    try {
      const timestamp = Date.now();
      const queryString = `symbol=${symbol}&side=${side.toUpperCase()}&type=LIMIT&timeInForce=${timeInForce}&quantity=${quantity}&price=${price}&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await this.client.post(`/api/v3/order?${queryString}&signature=${signature}`);
      
      logger.info('Limit order created successfully', { 
        symbol, 
        side, 
        quantity, 
        price, 
        orderId: response.data.orderId 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error creating limit order:', error);
      throw error;
    }
  }

  /**
   * Crear orden stop loss
   */
  async createStopLossOrder(symbol, side, quantity, stopPrice, price = null) {
    try {
      const timestamp = Date.now();
      let queryString = `symbol=${symbol}&side=${side.toUpperCase()}&type=${price ? 'STOP_LOSS_LIMIT' : 'STOP_MARKET'}&quantity=${quantity}&stopPrice=${stopPrice}&timestamp=${timestamp}`;
      
      if (price) {
        queryString += `&price=${price}&timeInForce=GTC`;
      }
      
      const signature = this.generateSignature(queryString);
      const response = await this.client.post(`/api/v3/order?${queryString}&signature=${signature}`);
      
      logger.info('Stop loss order created successfully', { 
        symbol, 
        side, 
        quantity, 
        stopPrice, 
        orderId: response.data.orderId 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error creating stop loss order:', error);
      throw error;
    }
  }

  /**
   * Cancelar orden
   */
  async cancelOrder(symbol, orderId) {
    try {
      const timestamp = Date.now();
      const queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await this.client.delete(`/api/v3/order?${queryString}&signature=${signature}`);
      
      logger.info('Order cancelled successfully', { symbol, orderId });
      return response.data;
    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de una orden
   */
  async getOrderStatus(symbol, orderId) {
    try {
      const timestamp = Date.now();
      const queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await this.client.get(`/api/v3/order?${queryString}&signature=${signature}`);
      
      logger.info('Order status retrieved', { symbol, orderId, status: response.data.status });
      return response.data;
    } catch (error) {
      logger.error('Error getting order status:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de órdenes
   */
  async getOrderHistory(symbol, limit = 500) {
    try {
      const timestamp = Date.now();
      const queryString = `symbol=${symbol}&limit=${limit}&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await this.client.get(`/api/v3/allOrders?${queryString}&signature=${signature}`);
      
      logger.info('Order history retrieved', { symbol, count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Error getting order history:', error);
      throw error;
    }
  }

  /**
   * Obtener información del símbolo
   */
  async getSymbolInfo(symbol) {
    try {
      const response = await this.client.get(`/api/v3/exchangeInfo`);
      const symbolInfo = response.data.symbols.find(s => s.symbol === symbol);
      
      if (!symbolInfo) {
        throw new Error(`Symbol ${symbol} not found`);
      }
      
      logger.info('Symbol info retrieved', { symbol });
      return symbolInfo;
    } catch (error) {
      logger.error('Error getting symbol info:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de 24 horas
   */
  async get24hrStats(symbol) {
    try {
      const response = await this.client.get(`/api/v3/ticker/24hr?symbol=${symbol}`);
      
      logger.info('24hr stats retrieved', { symbol });
      return response.data;
    } catch (error) {
      logger.error('Error getting 24hr stats:', error);
      throw error;
    }
  }

  /**
   * Obtener libro de órdenes
   */
  async getOrderBook(symbol, limit = 100) {
    try {
      const response = await this.client.get(`/api/v3/depth?symbol=${symbol}&limit=${limit}`);
      
      logger.info('Order book retrieved', { symbol, limit });
      return response.data;
    } catch (error) {
      logger.error('Error getting order book:', error);
      throw error;
    }
  }

  /**
   * Obtener trades recientes
   */
  async getRecentTrades(symbol, limit = 500) {
    try {
      const response = await this.client.get(`/api/v3/trades?symbol=${symbol}&limit=${limit}`);
      
      logger.info('Recent trades retrieved', { symbol, count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Error getting recent trades:', error);
      throw error;
    }
  }

  /**
   * Probar conexión
   */
  async testConnection() {
    try {
      const response = await this.client.get('/api/v3/ping');
      logger.info('Binance connection test successful');
      return true;
    } catch (error) {
      logger.error('Binance connection test failed:', error);
      return false;
    }
  }

  /**
   * Obtener tiempo del servidor
   */
  async getServerTime() {
    try {
      const response = await this.client.get('/api/v3/time');
      return response.data.serverTime;
    } catch (error) {
      logger.error('Error getting server time:', error);
      throw error;
    }
  }
}

module.exports = new BinanceService();
