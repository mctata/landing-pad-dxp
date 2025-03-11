const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Authentication and authorization middleware
 */
const authMiddleware = {
  /**
   * Authenticate a JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticate: (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development, allow requests without token
      if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
        logger.warn('Authentication bypassed in development mode');
        req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_dev');
      req.user = decoded;
      next();
    } catch (error) {
      logger.error(`Authentication error: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: error.message
      });
    }
  },

  /**
   * Check if user has admin role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  isAdmin: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    next();
  },

  /**
   * Check if user has a paid subscription
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  isPaidUser: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // In development, consider all users as paid users if configured
    if (process.env.NODE_ENV === 'development' && process.env.ASSUME_PAID_USER === 'true') {
      logger.warn('Paid user check bypassed in development mode');
      return next();
    }

    if (!req.user.subscription || req.user.subscription.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'This feature requires a paid subscription'
      });
    }

    next();
  },

  /**
   * Check if user has specific subscription tier
   * @param {string} tier - Required subscription tier
   * @returns {Function} Middleware function
   */
  hasSubscriptionTier: (tier) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // In development, consider all users as having any tier if configured
      if (process.env.NODE_ENV === 'development' && process.env.ASSUME_PAID_USER === 'true') {
        logger.warn(`Subscription tier ${tier} check bypassed in development mode`);
        return next();
      }

      if (
        !req.user.subscription || 
        req.user.subscription.status !== 'active' || 
        req.user.subscription.tier !== tier
      ) {
        return res.status(403).json({
          success: false,
          message: `This feature requires a ${tier} subscription`
        });
      }

      next();
    };
  }
};

module.exports = authMiddleware;