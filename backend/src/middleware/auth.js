const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

// Middleware to authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authentication failed', 
        details: 'No authentication token provided' 
      });
    }
    
    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
    );
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Authentication failed', 
        details: 'User not found' 
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      if (user.status === 'pending') {
        return res.status(403).json({ 
          message: 'Account not active',
          details: 'Email verification required',
          verificationRequired: true
        });
      } else {
        return res.status(403).json({ 
          message: 'Account suspended',
          details: 'Please contact support' 
        });
      }
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Authentication failed', 
        details: 'Token expired',
        expired: true
      });
    }
    
    res.status(401).json({ 
      message: 'Authentication failed', 
      details: 'Invalid token' 
    });
  }
};

// Optional authentication middleware
// Will authenticate user if token is valid, but continue anyway if not
exports.optionalAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }
    
    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
    );
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (user && user.status === 'active') {
      // Add user to request object if found and active
      req.user = user;
    }
    
    // Continue regardless of authentication result
    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

// Check if user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied', 
      details: 'Admin privileges required' 
    });
  }
};

// Check if user has a paid subscription
exports.isPaidUser = (req, res, next) => {
  const paidTiers = ['basic', 'advanced', 'pro'];
  
  if (req.user && paidTiers.includes(req.user.subscriptionTier)) {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied', 
      details: 'This feature requires a paid subscription',
      subscriptionRequired: true
    });
  }
};

// Check if user has a specific subscription tier or higher
exports.hasSubscriptionTier = (tier) => {
  const tiers = ['free', 'basic', 'advanced', 'pro'];
  const tierIndex = tiers.indexOf(tier);
  
  if (tierIndex === -1) {
    throw new Error(`Invalid subscription tier: ${tier}`);
  }
  
  return (req, res, next) => {
    const userTierIndex = tiers.indexOf(req.user.subscriptionTier);
    
    if (userTierIndex >= tierIndex) {
      next();
    } else {
      res.status(403).json({ 
        message: 'Access denied', 
        details: `This feature requires a ${tier} subscription or higher`,
        requiredTier: tier,
        subscriptionRequired: true
      });
    }
  };
};

// Rate limit specific to user
exports.userRateLimit = (limiter) => {
  return (req, res, next) => {
    // If user is authenticated, use user ID as key for rate limiting
    if (req.user && req.user.id) {
      req.rateLimit = {
        key: req.user.id, 
        prefix: 'user-'
      };
    }
    
    limiter(req, res, next);
  };
};
