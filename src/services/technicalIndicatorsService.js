const technicalIndicators = require('technicalindicators');
const { logger } = require('../utils/logger');

class TechnicalIndicatorsService {
  /**
   * Calcular Media Móvil Simple (SMA)
   */
  calculateSMA(data, period) {
    try {
      const sma = technicalIndicators.SMA.calculate({
        period: period,
        values: data.map(d => d.close)
      });
      
      return data.map((item, index) => ({
        ...item,
        sma: sma[index] || null
      }));
    } catch (error) {
      logger.error('Error calculating SMA:', error);
      throw error;
    }
  }

  /**
   * Calcular Media Móvil Exponencial (EMA)
   */
  calculateEMA(data, period) {
    try {
      const ema = technicalIndicators.EMA.calculate({
        period: period,
        values: data.map(d => d.close)
      });
      
      return data.map((item, index) => ({
        ...item,
        ema: ema[index] || null
      }));
    } catch (error) {
      logger.error('Error calculating EMA:', error);
      throw error;
    }
  }

  /**
   * Calcular RSI (Relative Strength Index)
   */
  calculateRSI(data, period = 14) {
    try {
      const rsi = technicalIndicators.RSI.calculate({
        period: period,
        values: data.map(d => d.close)
      });
      
      return data.map((item, index) => ({
        ...item,
        rsi: rsi[index] || null
      }));
    } catch (error) {
      logger.error('Error calculating RSI:', error);
      throw error;
    }
  }

  /**
   * Calcular MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    try {
      const macd = technicalIndicators.MACD.calculate({
        fastPeriod: fastPeriod,
        slowPeriod: slowPeriod,
        signalPeriod: signalPeriod,
        values: data.map(d => d.close)
      });
      
      return data.map((item, index) => ({
        ...item,
        macd: macd[index] ? {
          MACD: macd[index].MACD,
          signal: macd[index].signal,
          histogram: macd[index].histogram
        } : null
      }));
    } catch (error) {
      logger.error('Error calculating MACD:', error);
      throw error;
    }
  }

  /**
   * Calcular Bandas de Bollinger
   */
  calculateBollingerBands(data, period = 20, stdDev = 2) {
    try {
      const bb = technicalIndicators.BollingerBands.calculate({
        period: period,
        values: data.map(d => d.close),
        stdDev: stdDev
      });
      
      return data.map((item, index) => ({
        ...item,
        bollingerBands: bb[index] ? {
          upper: bb[index].upper,
          middle: bb[index].middle,
          lower: bb[index].lower
        } : null
      }));
    } catch (error) {
      logger.error('Error calculating Bollinger Bands:', error);
      throw error;
    }
  }

  /**
   * Calcular Estocástico
   */
  calculateStochastic(data, kPeriod = 14, dPeriod = 3) {
    try {
      const stochastic = technicalIndicators.Stochastic.calculate({
        high: data.map(d => d.high),
        low: data.map(d => d.low),
        close: data.map(d => d.close),
        period: kPeriod,
        signalPeriod: dPeriod
      });
      
      return data.map((item, index) => ({
        ...item,
        stochastic: stochastic[index] ? {
          k: stochastic[index].k,
          d: stochastic[index].d
        } : null
      }));
    } catch (error) {
      logger.error('Error calculating Stochastic:', error);
      throw error;
    }
  }

  /**
   * Calcular Williams %R
   */
  calculateWilliamsR(data, period = 14) {
    try {
      const williamsR = technicalIndicators.WilliamsR.calculate({
        high: data.map(d => d.high),
        low: data.map(d => d.low),
        close: data.map(d => d.close),
        period: period
      });
      
      return data.map((item, index) => ({
        ...item,
        williamsR: williamsR[index] || null
      }));
    } catch (error) {
      logger.error('Error calculating Williams %R:', error);
      throw error;
    }
  }

  /**
   * Calcular ATR (Average True Range)
   */
  calculateATR(data, period = 14) {
    try {
      const atr = technicalIndicators.ATR.calculate({
        high: data.map(d => d.high),
        low: data.map(d => d.low),
        close: data.map(d => d.close),
        period: period
      });
      
      return data.map((item, index) => ({
        ...item,
        atr: atr[index] || null
      }));
    } catch (error) {
      logger.error('Error calculating ATR:', error);
      throw error;
    }
  }

  /**
   * Calcular PSAR (Parabolic SAR)
   */
  calculatePSAR(data, acceleration = 0.02, maximum = 0.2) {
    try {
      const psar = technicalIndicators.PSAR.calculate({
        high: data.map(d => d.high),
        low: data.map(d => d.low),
        close: data.map(d => d.close),
        acceleration: acceleration,
        maximum: maximum
      });
      
      return data.map((item, index) => ({
        ...item,
        psar: psar[index] || null
      }));
    } catch (error) {
      logger.error('Error calculating PSAR:', error);
      throw error;
    }
  }

  /**
   * Calcular VWAP (Volume Weighted Average Price)
   */
  calculateVWAP(data) {
    try {
      let cumulativeTPV = 0; // Total Price * Volume
      let cumulativeVolume = 0;
      
      return data.map((item, index) => {
        const typicalPrice = (item.high + item.low + item.close) / 3;
        const priceVolume = typicalPrice * item.volume;
        
        cumulativeTPV += priceVolume;
        cumulativeVolume += item.volume;
        
        const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null;
        
        return {
          ...item,
          vwap: vwap
        };
      });
    } catch (error) {
      logger.error('Error calculating VWAP:', error);
      throw error;
    }
  }

  /**
   * Calcular OBV (On Balance Volume)
   */
  calculateOBV(data) {
    try {
      const obv = technicalIndicators.OBV.calculate({
        close: data.map(d => d.close),
        volume: data.map(d => d.volume)
      });
      
      return data.map((item, index) => ({
        ...item,
        obv: obv[index] || null
      }));
    } catch (error) {
      logger.error('Error calculating OBV:', error);
      throw error;
    }
  }

  /**
   * Calcular MFI (Money Flow Index)
   */
  calculateMFI(data, period = 14) {
    try {
      const mfi = technicalIndicators.MFI.calculate({
        high: data.map(d => d.high),
        low: data.map(d => d.low),
        close: data.map(d => d.close),
        volume: data.map(d => d.volume),
        period: period
      });
      
      return data.map((item, index) => ({
        ...item,
        mfi: mfi[index] || null
      }));
    } catch (error) {
      logger.error('Error calculating MFI:', error);
      throw error;
    }
  }

  /**
   * Calcular Ichimoku Cloud
   */
  calculateIchimoku(data) {
    try {
      const ichimoku = technicalIndicators.IchimokuCloud.calculate({
        high: data.map(d => d.high),
        low: data.map(d => d.low),
        close: data.map(d => d.close)
      });
      
      return data.map((item, index) => ({
        ...item,
        ichimoku: ichimoku[index] ? {
          conversion: ichimoku[index].conversion,
          base: ichimoku[index].base,
          spanA: ichimoku[index].spanA,
          spanB: ichimoku[index].spanB,
          currentSpanA: ichimoku[index].currentSpanA,
          currentSpanB: ichimoku[index].currentSpanB
        } : null
      }));
    } catch (error) {
      logger.error('Error calculating Ichimoku Cloud:', error);
      throw error;
    }
  }

  /**
   * Calcular Fibonacci Retracement
   */
  calculateFibonacciRetracement(data, swingHigh, swingLow) {
    try {
      const range = swingHigh - swingLow;
      const levels = {
        0: swingLow,
        0.236: swingLow + (range * 0.236),
        0.382: swingLow + (range * 0.382),
        0.5: swingLow + (range * 0.5),
        0.618: swingLow + (range * 0.618),
        0.786: swingLow + (range * 0.786),
        1: swingHigh
      };
      
      return data.map(item => ({
        ...item,
        fibonacci: levels
      }));
    } catch (error) {
      logger.error('Error calculating Fibonacci Retracement:', error);
      throw error;
    }
  }

  /**
   * Calcular Soporte y Resistencia
   */
  calculateSupportResistance(data, window = 20) {
    try {
      const supports = [];
      const resistances = [];
      
      for (let i = window; i < data.length - window; i++) {
        const current = data[i];
        const leftWindow = data.slice(i - window, i);
        const rightWindow = data.slice(i + 1, i + window + 1);
        
        // Buscar soportes (mínimos locales)
        const isSupport = leftWindow.every(d => d.low >= current.low) &&
                         rightWindow.every(d => d.low >= current.low);
        
        if (isSupport) {
          supports.push({
            price: current.low,
            index: i,
            timestamp: current.openTime
          });
        }
        
        // Buscar resistencias (máximos locales)
        const isResistance = leftWindow.every(d => d.high <= current.high) &&
                           rightWindow.every(d => d.high <= current.high);
        
        if (isResistance) {
          resistances.push({
            price: current.high,
            index: i,
            timestamp: current.openTime
          });
        }
      }
      
      return data.map(item => ({
        ...item,
        supports: supports.filter(s => s.timestamp <= item.openTime),
        resistances: resistances.filter(r => r.timestamp <= item.openTime)
      }));
    } catch (error) {
      logger.error('Error calculating Support/Resistance:', error);
      throw error;
    }
  }

  /**
   * Calcular todos los indicadores para un conjunto de datos
   */
  calculateAllIndicators(data, options = {}) {
    try {
      let result = [...data];
      
      // Configuración por defecto
      const config = {
        sma: { periods: [20, 50, 200] },
        ema: { periods: [12, 26] },
        rsi: { period: 14 },
        macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
        bollingerBands: { period: 20, stdDev: 2 },
        stochastic: { kPeriod: 14, dPeriod: 3 },
        williamsR: { period: 14 },
        atr: { period: 14 },
        psar: { acceleration: 0.02, maximum: 0.2 },
        ...options
      };
      
      // Calcular indicadores básicos
      config.sma.periods.forEach(period => {
        result = this.calculateSMA(result, period);
      });
      
      config.ema.periods.forEach(period => {
        result = this.calculateEMA(result, period);
      });
      
      result = this.calculateRSI(result, config.rsi.period);
      result = this.calculateMACD(result, config.macd.fastPeriod, config.macd.slowPeriod, config.macd.signalPeriod);
      result = this.calculateBollingerBands(result, config.bollingerBands.period, config.bollingerBands.stdDev);
      result = this.calculateStochastic(result, config.stochastic.kPeriod, config.stochastic.dPeriod);
      result = this.calculateWilliamsR(result, config.williamsR.period);
      result = this.calculateATR(result, config.atr.period);
      result = this.calculatePSAR(result, config.psar.acceleration, config.psar.maximum);
      result = this.calculateVWAP(result);
      result = this.calculateOBV(result);
      result = this.calculateMFI(result, 14);
      result = this.calculateIchimoku(result);
      
      // Calcular soporte y resistencia
      const { supports, resistances } = this.calculateSupportResistance(result);
      
      logger.info('All technical indicators calculated successfully', {
        dataPoints: result.length,
        supports: supports.length,
        resistances: resistances.length
      });
      
      return {
        data: result,
        supports,
        resistances
      };
    } catch (error) {
      logger.error('Error calculating all indicators:', error);
      throw error;
    }
  }

  /**
   * Generar señales de trading basadas en indicadores
   */
  generateSignals(data) {
    const signals = [];
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      const signal = {
        timestamp: current.openTime,
        price: current.close,
        strength: 0,
        indicators: {}
      };
      
      // RSI
      if (current.rsi !== null && previous.rsi !== null) {
        if (current.rsi < 30 && previous.rsi >= 30) {
          signal.strength += 1;
          signal.indicators.rsi = 'BUY';
        } else if (current.rsi > 70 && previous.rsi <= 70) {
          signal.strength -= 1;
          signal.indicators.rsi = 'SELL';
        }
      }
      
      // MACD
      if (current.macd && previous.macd) {
        if (current.macd.histogram > 0 && previous.macd.histogram <= 0) {
          signal.strength += 1;
          signal.indicators.macd = 'BUY';
        } else if (current.macd.histogram < 0 && previous.macd.histogram >= 0) {
          signal.strength -= 1;
          signal.indicators.macd = 'SELL';
        }
      }
      
      // Bollinger Bands
      if (current.bollingerBands) {
        if (current.close <= current.bollingerBands.lower) {
          signal.strength += 1;
          signal.indicators.bollingerBands = 'BUY';
        } else if (current.close >= current.bollingerBands.upper) {
          signal.strength -= 1;
          signal.indicators.bollingerBands = 'SELL';
        }
      }
      
      // Stochastic
      if (current.stochastic && previous.stochastic) {
        if (current.stochastic.k < 20 && previous.stochastic.k >= 20) {
          signal.strength += 1;
          signal.indicators.stochastic = 'BUY';
        } else if (current.stochastic.k > 80 && previous.stochastic.k <= 80) {
          signal.strength -= 1;
          signal.indicators.stochastic = 'SELL';
        }
      }
      
      // Determinar señal final
      if (signal.strength >= 2) {
        signal.action = 'BUY';
      } else if (signal.strength <= -2) {
        signal.action = 'SELL';
      } else {
        signal.action = 'HOLD';
      }
      
      signals.push(signal);
    }
    
    return signals;
  }

  /**
   * Calcular puntuación de señales
   */
  calculateSignalScore(signals) {
    const buySignals = signals.filter(s => s.action === 'BUY');
    const sellSignals = signals.filter(s => s.action === 'SELL');
    
    const buyScore = buySignals.reduce((sum, signal) => sum + signal.strength, 0);
    const sellScore = sellSignals.reduce((sum, signal) => sum + Math.abs(signal.strength), 0);
    
    return {
      buyScore,
      sellScore,
      netScore: buyScore - sellScore,
      buyCount: buySignals.length,
      sellCount: sellSignals.length,
      totalSignals: signals.length
    };
  }
}

module.exports = new TechnicalIndicatorsService();
