const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid token, authentication failed' });
  }
};

// Check if user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

// Check if user is subscribed to Pro or Enterprise plan
exports.isPaidUser = (req, res, next) => {
  if (req.user && (req.user.subscription === 'pro' || req.user.subscription === 'enterprise')) {
    next();
  } else {
    res.status(403).json({ message: 'This feature requires a paid subscription' });
  }
};

// Check if user is on Enterprise plan
exports.isEnterprise = (req, res, next) => {
  if (req.user && req.user.subscription === 'enterprise') {
    next();
  } else {
    res.status(403).json({ message: 'This feature requires an Enterprise subscription' });
  }
};
