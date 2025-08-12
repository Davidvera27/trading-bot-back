const winston = require('winston');
const path = require('path');

// Configuración de formatos personalizados
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Configuración de transportes
const transports = [
  // Consola para desarrollo
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    )
  }),
  
  // Archivo para todos los logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/app.log'),
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Archivo separado para errores
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Crear logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false
});

// Logger específico para trading
const tradingLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/trading.log'),
      format: customFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Logger específico para API
const apiLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/api.log'),
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Funciones helper para logging estructurado
const logTrading = (action, data) => {
  tradingLogger.info('Trading Action', {
    action,
    timestamp: new Date().toISOString(),
    data
  });
};

const logOrder = (orderId, action, details) => {
  tradingLogger.info('Order Action', {
    orderId,
    action,
    timestamp: new Date().toISOString(),
    details
  });
};

const logPosition = (positionId, action, details) => {
  tradingLogger.info('Position Action', {
    positionId,
    action,
    timestamp: new Date().toISOString(),
    details
  });
};

const logStrategy = (strategyId, action, details) => {
  tradingLogger.info('Strategy Action', {
    strategyId,
    action,
    timestamp: new Date().toISOString(),
    details
  });
};

const logError = (error, context = {}) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

const logApiRequest = (req, res, responseTime) => {
  apiLogger.info('API Request', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.userId,
    timestamp: new Date().toISOString()
  });
};

// Middleware para logging de requests
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logApiRequest(req, res, responseTime);
  });
  
  next();
};

module.exports = {
  logger,
  tradingLogger,
  apiLogger,
  logTrading,
  logOrder,
  logPosition,
  logStrategy,
  logError,
  requestLogger
};
