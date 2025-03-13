const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { User } = require('../models');

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
  authenticate: async (req, res, next) => {
    try {
      // First check for token in Authorization header
      let token = null;
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (req.cookies && req.cookies.accessToken) {
        // Alternatively, check for token in cookie
        token = req.cookies.accessToken;
      }

      // If no token found in header or cookie
      if (!token) {
        // For development, allow requests without token if configured
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

      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
      );
      
      // Set basic user info from token
      req.user = decoded;
      
      // For extended auth flow, fetch full user from database
      if (process.env.AUTH_FETCH_USER === 'true') {
        const user = await User.findByPk(decoded.id);
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found or deleted'
          });
        }
        
        // Check if user is active
        if (user.status !== 'active') {
          return res.status(403).json({
            success: false,
            message: 'Account is not active'
          });
        }
        
        // Extend token data with full user info (excluding sensitive data)
        req.user = user;
      }
      
      next();
    } catch (error) {
      logger.error(`Authentication error: ${error.message}`);
      
      // Return appropriate error based on type
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          tokenExpired: true
        });
      } 
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      logger.warn(`User ${req.user.id} attempted to access admin-only resource`);
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
      logger.debug(`Paid user check bypassed for user ${req.user.id} in development mode`);
      return next();
    }

    // Admin users can access paid features
    if (req.user.role === 'admin') {
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
   * @param {string|string[]} tier - Required subscription tier(s)
   * @returns {Function} Middleware function
   */
  hasSubscriptionTier: (tier) => {
    // Convert to array if single string provided
    const requiredTiers = Array.isArray(tier) ? tier : [tier];
    
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // In development, consider all users as having any tier if configured
      if (process.env.NODE_ENV === 'development' && process.env.ASSUME_PAID_USER === 'true') {
        logger.debug(`Subscription tier check bypassed for user ${req.user.id} in development mode`);
        return next();
      }

      // Admin users can access any tier's features
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user's subscription tier is in the list of required tiers
      if (
        !req.user.subscription || 
        req.user.subscription.status !== 'active' || 
        !requiredTiers.includes(req.user.subscription.tier)
      ) {
        return res.status(403).json({
          success: false,
          message: `This feature requires a ${requiredTiers.join(' or ')} subscription`
        });
      }

      next();
    };
  },
  
  /**
   * Validate user owns a resource by ID
   * @param {Function} getResourceOwnerId - Function to get owner ID from resource
   * @returns {Function} Middleware function
   */
  ownsResource: (getResourceOwnerId) => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // Admin users can access any resource
        if (req.user.role === 'admin') {
          return next();
        }

        // Get the owner ID for the resource
        const ownerId = await getResourceOwnerId(req);
        
        // If owner ID could not be determined
        if (!ownerId) {
          return res.status(404).json({
            success: false,
            message: 'Resource not found'
          });
        }

        // Check if current user is the owner
        if (ownerId !== req.user.id) {
          logger.warn(`User ${req.user.id} attempted to access resource owned by ${ownerId}`);
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this resource'
          });
        }

        next();
      } catch (error) {
        logger.error('Error in ownership validation:', error);
        return res.status(500).json({
          success: false,
          message: 'Error checking resource ownership'
        });
      }
    };
  }
};

module.exports = authMiddleware;