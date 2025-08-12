const technicalIndicatorsService = require('./technicalIndicatorsService');
const binanceService = require('./binanceService');
const { logger } = require('../utils/logger');

class TradingStrategyService {
  /**
   * Estrategia de Scalping - Basada en RSI y MACD
   */
  async executeScalpingStrategy(symbol, data, options = {}) {
    try {
      const {
        rsiPeriod = 14,
        rsiOverbought = 70,
        rsiOversold = 30,
        macdFast = 12,
        macdSlow = 26,
        macdSignal = 9,
        stopLoss = 0.5, // 0.5%
        takeProfit = 1.0 // 1.0%
      } = options;

      // Calcular indicadores
      let result = technicalIndicatorsService.calculateRSI(data, rsiPeriod);
      result = technicalIndicatorsService.calculateMACD(result, macdFast, macdSlow, macdSignal);

      const current = result[result.length - 1];
      const previous = result[result.length - 2];

      if (!current || !previous) {
        return { signal: 'HOLD', confidence: 0, reason: 'Insufficient data' };
      }

      let signal = 'HOLD';
      let confidence = 0;
      let reason = '';

      // Lógica de scalping
      const rsiSignal = current.rsi < rsiOversold ? 'BUY' : 
                       current.rsi > rsiOverbought ? 'SELL' : 'HOLD';

      const macdSignalValue = current.macd && previous.macd ? 
                        (current.macd.histogram > 0 && previous.macd.histogram <= 0) ? 'BUY' :
                        (current.macd.histogram < 0 && previous.macd.histogram >= 0) ? 'SELL' : 'HOLD' : 'HOLD';

      // Combinar señales
      if (rsiSignal === 'BUY' && macdSignalValue === 'BUY') {
        signal = 'BUY';
        confidence = 0.8;
        reason = 'RSI oversold + MACD bullish crossover';
      } else if (rsiSignal === 'SELL' && macdSignalValue === 'SELL') {
        signal = 'SELL';
        confidence = 0.8;
        reason = 'RSI overbought + MACD bearish crossover';
      } else if (rsiSignal === 'BUY' || macdSignalValue === 'BUY') {
        signal = 'BUY';
        confidence = 0.6;
        reason = rsiSignal === 'BUY' ? 'RSI oversold' : 'MACD bullish crossover';
      } else if (rsiSignal === 'SELL' || macdSignalValue === 'SELL') {
        signal = 'SELL';
        confidence = 0.6;
        reason = rsiSignal === 'SELL' ? 'RSI overbought' : 'MACD bearish crossover';
      }

      return {
        signal,
        confidence,
        reason,
        currentPrice: current.close,
        indicators: {
          rsi: current.rsi,
          macd: current.macd,
          rsiSignal,
          macdSignal: macdSignalValue
        },
        riskManagement: {
          stopLoss: current.close * (1 - stopLoss / 100),
          takeProfit: current.close * (1 + takeProfit / 100)
        }
      };
    } catch (error) {
      logger.error('Error executing scalping strategy:', error);
      throw error;
    }
  }

  /**
   * Estrategia de Day Trading - Basada en múltiples timeframes
   */
  async executeDayTradingStrategy(symbol, data, options = {}) {
    try {
      const {
        smaShort = 20,
        smaLong = 50,
        rsiPeriod = 14,
        volumeThreshold = 1.5, // 1.5x volumen promedio
        stopLoss = 2.0, // 2%
        takeProfit = 4.0 // 4%
      } = options;

      // Calcular indicadores
      let result = technicalIndicatorsService.calculateSMA(data, smaShort);
      result = technicalIndicatorsService.calculateSMA(result, smaLong);
      result = technicalIndicatorsService.calculateRSI(result, rsiPeriod);

      const current = result[result.length - 1];
      const previous = result[result.length - 2];

      if (!current || !previous) {
        return { signal: 'HOLD', confidence: 0, reason: 'Insufficient data' };
      }

      // Calcular volumen promedio
      const avgVolume = data.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;
      const volumeRatio = current.volume / avgVolume;

      let signal = 'HOLD';
      let confidence = 0;
      let reason = '';

      // Lógica de day trading
      const trendSignal = current.sma > current.smaLong ? 'BULLISH' : 'BEARISH';
      const rsiSignal = current.rsi < 30 ? 'BUY' : current.rsi > 70 ? 'SELL' : 'HOLD';
      const volumeSignal = volumeRatio > volumeThreshold ? 'HIGH' : 'NORMAL';

      // Combinar señales
      if (trendSignal === 'BULLISH' && rsiSignal === 'BUY' && volumeSignal === 'HIGH') {
        signal = 'BUY';
        confidence = 0.9;
        reason = 'Bullish trend + RSI oversold + High volume';
      } else if (trendSignal === 'BEARISH' && rsiSignal === 'SELL' && volumeSignal === 'HIGH') {
        signal = 'SELL';
        confidence = 0.9;
        reason = 'Bearish trend + RSI overbought + High volume';
      } else if (trendSignal === 'BULLISH' && rsiSignal === 'BUY') {
        signal = 'BUY';
        confidence = 0.7;
        reason = 'Bullish trend + RSI oversold';
      } else if (trendSignal === 'BEARISH' && rsiSignal === 'SELL') {
        signal = 'SELL';
        confidence = 0.7;
        reason = 'Bearish trend + RSI overbought';
      }

      return {
        signal,
        confidence,
        reason,
        currentPrice: current.close,
        indicators: {
          smaShort: current.sma,
          smaLong: current.smaLong,
          rsi: current.rsi,
          volumeRatio,
          trendSignal,
          rsiSignal,
          volumeSignal
        },
        riskManagement: {
          stopLoss: current.close * (1 - stopLoss / 100),
          takeProfit: current.close * (1 + takeProfit / 100)
        }
      };
    } catch (error) {
      logger.error('Error executing day trading strategy:', error);
      throw error;
    }
  }

  /**
   * Estrategia de Swing Trading - Basada en tendencias y soporte/resistencia
   */
  async executeSwingTradingStrategy(symbol, data, options = {}) {
    try {
      const {
        emaShort = 12,
        emaLong = 26,
        rsiPeriod = 14,
        atrPeriod = 14,
        stopLossMultiplier = 2,
        takeProfitMultiplier = 3
      } = options;

      // Calcular indicadores
      let result = technicalIndicatorsService.calculateEMA(data, emaShort);
      result = technicalIndicatorsService.calculateEMA(result, emaLong);
      result = technicalIndicatorsService.calculateRSI(result, rsiPeriod);
      result = technicalIndicatorsService.calculateATR(result, atrPeriod);

      const current = result[result.length - 1];
      const previous = result[result.length - 2];

      if (!current || !previous) {
        return { signal: 'HOLD', confidence: 0, reason: 'Insufficient data' };
      }

      let signal = 'HOLD';
      let confidence = 0;
      let reason = '';

      // Lógica de swing trading
      const trendSignal = current.ema > current.emaLong ? 'BULLISH' : 'BEARISH';
      const rsiSignal = current.rsi < 40 ? 'BUY' : current.rsi > 60 ? 'SELL' : 'HOLD';
      const momentumSignal = current.ema > previous.ema ? 'BULLISH' : 'BEARISH';

      // Combinar señales
      if (trendSignal === 'BULLISH' && rsiSignal === 'BUY' && momentumSignal === 'BULLISH') {
        signal = 'BUY';
        confidence = 0.85;
        reason = 'Bullish trend + RSI oversold + Bullish momentum';
      } else if (trendSignal === 'BEARISH' && rsiSignal === 'SELL' && momentumSignal === 'BEARISH') {
        signal = 'SELL';
        confidence = 0.85;
        reason = 'Bearish trend + RSI overbought + Bearish momentum';
      } else if (trendSignal === 'BULLISH' && rsiSignal === 'BUY') {
        signal = 'BUY';
        confidence = 0.7;
        reason = 'Bullish trend + RSI oversold';
      } else if (trendSignal === 'BEARISH' && rsiSignal === 'SELL') {
        signal = 'SELL';
        confidence = 0.7;
        reason = 'Bearish trend + RSI overbought';
      }

      // Calcular stop loss y take profit basados en ATR
      const atr = current.atr || 0;
      const stopLoss = signal === 'BUY' ? 
        current.close - (atr * stopLossMultiplier) : 
        current.close + (atr * stopLossMultiplier);
      
      const takeProfit = signal === 'BUY' ? 
        current.close + (atr * takeProfitMultiplier) : 
        current.close - (atr * takeProfitMultiplier);

      return {
        signal,
        confidence,
        reason,
        currentPrice: current.close,
        indicators: {
          emaShort: current.ema,
          emaLong: current.emaLong,
          rsi: current.rsi,
          atr: current.atr,
          trendSignal,
          rsiSignal,
          momentumSignal
        },
        riskManagement: {
          stopLoss,
          takeProfit
        }
      };
    } catch (error) {
      logger.error('Error executing swing trading strategy:', error);
      throw error;
    }
  }

  /**
   * Estrategia de Grid Trading
   */
  async executeGridTradingStrategy(symbol, data, options = {}) {
    try {
      const {
        gridLevels = 10,
        gridSpacing = 1.0, // 1% entre niveles
        basePrice = null,
        totalInvestment = 1000
      } = options;

      const currentPrice = data[data.length - 1].close;
      const basePriceValue = basePrice || currentPrice;

      // Calcular niveles de la grid
      const gridLevelsArray = [];
      const investmentPerLevel = totalInvestment / gridLevels;

      for (let i = 0; i < gridLevels; i++) {
        const buyPrice = basePriceValue * (1 - (gridSpacing / 100) * (i + 1));
        const sellPrice = basePriceValue * (1 + (gridSpacing / 100) * (i + 1));
        
        gridLevelsArray.push({
          level: i + 1,
          buyPrice,
          sellPrice,
          investment: investmentPerLevel,
          quantity: investmentPerLevel / buyPrice
        });
      }

      // Encontrar el nivel más cercano al precio actual
      const currentLevel = gridLevelsArray.find(level => 
        currentPrice >= level.buyPrice && currentPrice <= level.sellPrice
      );

      let signal = 'HOLD';
      let confidence = 0.5;
      let reason = 'Grid trading - monitoring levels';

      if (currentLevel) {
        const distanceToBuy = Math.abs(currentPrice - currentLevel.buyPrice) / currentPrice;
        const distanceToSell = Math.abs(currentPrice - currentLevel.sellPrice) / currentPrice;

        if (distanceToBuy < 0.1) { // 0.1% del precio
          signal = 'BUY';
          confidence = 0.8;
          reason = `Grid buy level ${currentLevel.level} reached`;
        } else if (distanceToSell < 0.1) {
          signal = 'SELL';
          confidence = 0.8;
          reason = `Grid sell level ${currentLevel.level} reached`;
        }
      }

      return {
        signal,
        confidence,
        reason,
        currentPrice,
        gridLevels: gridLevelsArray,
        currentLevel,
        strategy: 'grid'
      };
    } catch (error) {
      logger.error('Error executing grid trading strategy:', error);
      throw error;
    }
  }

  /**
   * Estrategia de Arbitraje Triangular
   */
  async executeTriangularArbitrageStrategy(symbols, data, options = {}) {
    try {
      const { minProfitThreshold = 0.5 } = options; // 0.5% mínimo

      // Obtener precios actuales de los símbolos
      const prices = {};
      for (const symbol of symbols) {
        try {
          prices[symbol] = await binanceService.getCurrentPrice(symbol);
        } catch (error) {
          logger.error(`Error getting price for ${symbol}:`, error);
          return { signal: 'HOLD', confidence: 0, reason: 'Error getting prices' };
        }
      }

      // Calcular oportunidades de arbitraje
      const opportunities = [];
      
      // Ejemplo: BTC/USDT -> ETH/BTC -> ETH/USDT
      if (prices['BTCUSDT'] && prices['ETHBTC'] && prices['ETHUSDT']) {
        const path1 = 1 / prices['BTCUSDT']; // USDT -> BTC
        const path2 = path1 / prices['ETHBTC']; // BTC -> ETH
        const path3 = path2 * prices['ETHUSDT']; // ETH -> USDT
        
        const profit = ((path3 - 1) * 100);
        
        if (profit > minProfitThreshold) {
          opportunities.push({
            path: 'USDT -> BTC -> ETH -> USDT',
            profit,
            trades: [
              { from: 'USDT', to: 'BTC', rate: prices['BTCUSDT'] },
              { from: 'BTC', to: 'ETH', rate: prices['ETHBTC'] },
              { from: 'ETH', to: 'USDT', rate: prices['ETHUSDT'] }
            ]
          });
        }
      }

      if (opportunities.length > 0) {
        const bestOpportunity = opportunities.reduce((best, current) => 
          current.profit > best.profit ? current : best
        );

        return {
          signal: 'ARBITRAGE',
          confidence: 0.9,
          reason: `Arbitrage opportunity: ${bestOpportunity.profit.toFixed(2)}% profit`,
          opportunities,
          bestOpportunity,
          strategy: 'arbitrage'
        };
      }

      return {
        signal: 'HOLD',
        confidence: 0.5,
        reason: 'No arbitrage opportunities found',
        opportunities: []
      };
    } catch (error) {
      logger.error('Error executing triangular arbitrage strategy:', error);
      throw error;
    }
  }

  /**
   * Estrategia de Mean Reversion
   */
  async executeMeanReversionStrategy(symbol, data, options = {}) {
    try {
      const {
        lookbackPeriod = 20,
        stdDevThreshold = 2,
        rsiPeriod = 14,
        stopLoss = 3.0, // 3%
        takeProfit = 2.0 // 2%
      } = options;

      // Calcular media móvil y desviación estándar
      const prices = data.map(d => d.close);
      const recentPrices = prices.slice(-lookbackPeriod);
      const mean = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
      const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / recentPrices.length;
      const stdDev = Math.sqrt(variance);

      // Calcular RSI
      let result = technicalIndicatorsService.calculateRSI(data, rsiPeriod);
      const current = result[result.length - 1];

      if (!current) {
        return { signal: 'HOLD', confidence: 0, reason: 'Insufficient data' };
      }

      const currentPrice = current.close;
      const zScore = (currentPrice - mean) / stdDev;

      let signal = 'HOLD';
      let confidence = 0;
      let reason = '';

      // Lógica de mean reversion
      if (zScore > stdDevThreshold && current.rsi > 70) {
        signal = 'SELL';
        confidence = 0.8;
        reason = `Price ${zScore.toFixed(2)} standard deviations above mean + RSI overbought`;
      } else if (zScore < -stdDevThreshold && current.rsi < 30) {
        signal = 'BUY';
        confidence = 0.8;
        reason = `Price ${Math.abs(zScore).toFixed(2)} standard deviations below mean + RSI oversold`;
      } else if (zScore > stdDevThreshold) {
        signal = 'SELL';
        confidence = 0.6;
        reason = `Price ${zScore.toFixed(2)} standard deviations above mean`;
      } else if (zScore < -stdDevThreshold) {
        signal = 'BUY';
        confidence = 0.6;
        reason = `Price ${Math.abs(zScore).toFixed(2)} standard deviations below mean`;
      }

      return {
        signal,
        confidence,
        reason,
        currentPrice,
        indicators: {
          mean,
          stdDev,
          zScore,
          rsi: current.rsi
        },
        riskManagement: {
          stopLoss: signal === 'BUY' ? 
            currentPrice * (1 - stopLoss / 100) : 
            currentPrice * (1 + stopLoss / 100),
          takeProfit: signal === 'BUY' ? 
            currentPrice * (1 + takeProfit / 100) : 
            currentPrice * (1 - takeProfit / 100)
        }
      };
    } catch (error) {
      logger.error('Error executing mean reversion strategy:', error);
      throw error;
    }
  }

  /**
   * Ejecutar estrategia basada en el tipo
   */
  async executeStrategy(strategyType, symbol, data, options = {}) {
    try {
      switch (strategyType.toLowerCase()) {
        case 'scalping':
          return await this.executeScalpingStrategy(symbol, data, options);
        
        case 'day_trading':
          return await this.executeDayTradingStrategy(symbol, data, options);
        
        case 'swing_trading':
          return await this.executeSwingTradingStrategy(symbol, data, options);
        
        case 'grid_trading':
          return await this.executeGridTradingStrategy(symbol, data, options);
        
        case 'mean_reversion':
          return await this.executeMeanReversionStrategy(symbol, data, options);
        
        default:
          throw new Error(`Unknown strategy type: ${strategyType}`);
      }
    } catch (error) {
      logger.error('Error executing strategy:', error);
      throw error;
    }
  }
}

module.exports = new TradingStrategyService();
