const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  // Handle specific error types
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: {
        message: 'Validation error',
        type: err.name,
        errors: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Authentication failed',
        type: 'AuthenticationError',
        details: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Authentication failed',
        type: 'AuthenticationError',
        details: 'Token expired',
        expired: true
      }
    });
  }

  // For multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: {
        message: 'File too large',
        type: 'FileUploadError',
        details: 'The uploaded file exceeds the size limit'
      }
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: {
        message: 'Invalid file upload',
        type: 'FileUploadError',
        details: 'Unexpected field in file upload'
      }
    });
  }

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Prepare response object
  const response = {
    error: {
      message: err.message || 'Internal Server Error',
      type: err.name || 'Error'
    }
  };

  // Add validation errors if available
  if (err.errors) {
    response.error.errors = err.errors;
  }
  
  // Add code and details if available (for APIError instances)
  if (err.code) {
    response.error.code = err.code;
  }
  
  if (err.details) {
    response.error.details = err.details;
  }
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  // Return error response
  return res.status(statusCode).json(response);
};

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = null, details = null, errors = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.errors = errors;
  }
}

/**
 * Middleware to validate request using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation error',
        type: 'ValidationError',
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value
        }))
      }
    });
  }
  next();
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res) => {
  res.status(404).json({
    error: {
      message: 'Resource not found',
      type: 'NotFoundError',
      path: req.originalUrl
    }
  });
};

module.exports = {
  errorHandler,
  APIError,
  validate,
  notFound
};
