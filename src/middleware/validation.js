const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validaciones para estrategias
const validateStrategy = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('type')
    .isIn(['scalping', 'day_trading', 'swing_trading', 'position_trading', 'arbitrage', 'grid_trading', 'dca'])
    .withMessage('Tipo de estrategia inválido'),
  body('riskLevel')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Nivel de riesgo inválido'),
  body('riskManagement.maxPositionSize')
    .optional()
    .isFloat({ min: 0.001, max: 1 })
    .withMessage('Tamaño máximo de posición debe estar entre 0.001 y 1'),
  body('riskManagement.stopLoss')
    .optional()
    .isFloat({ min: 0.001, max: 0.5 })
    .withMessage('Stop loss debe estar entre 0.1% y 50%'),
  handleValidationErrors
];

// Validaciones para órdenes
const validateOrder = [
  body('symbol')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Símbolo inválido'),
  body('side')
    .isIn(['buy', 'sell'])
    .withMessage('Lado de la orden inválido'),
  body('type')
    .isIn(['market', 'limit', 'stop', 'stop_limit'])
    .withMessage('Tipo de orden inválido'),
  body('quantity')
    .isFloat({ min: 0.000001 })
    .withMessage('Cantidad debe ser mayor a 0'),
  body('price')
    .optional()
    .isFloat({ min: 0.000001 })
    .withMessage('Precio debe ser mayor a 0'),
  handleValidationErrors
];

// Validaciones para posiciones
const validatePosition = [
  body('symbol')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Símbolo inválido'),
  body('side')
    .isIn(['long', 'short'])
    .withMessage('Lado de la posición inválido'),
  body('size')
    .isFloat({ min: 0.000001 })
    .withMessage('Tamaño debe ser mayor a 0'),
  body('entryPrice')
    .isFloat({ min: 0.000001 })
    .withMessage('Precio de entrada debe ser mayor a 0'),
  handleValidationErrors
];

// Validaciones para parámetros de consulta
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe estar entre 1 y 100'),
  handleValidationErrors
];

// Validaciones para IDs
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID debe ser un número entero válido'),
  handleValidationErrors
];

module.exports = {
  validateStrategy,
  validateOrder,
  validatePosition,
  validatePagination,
  validateId,
  handleValidationErrors
};
