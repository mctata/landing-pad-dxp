const logger = require('../utils/logger');

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

  // Return error response
  return res.status(statusCode).json(response);
};

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

module.exports = {
  errorHandler,
  APIError
};
