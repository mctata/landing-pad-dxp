const rateLimit = require('express-rate-limit');
const { APIError } = require('./errorHandler');

/**
 * Rate limiter middleware for AI endpoints
 * Limits are set based on different operations
 */
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    throw new APIError('Rate limit exceeded. Please try again later.', 429);
  },
  // More permissive rate limit for development
  skip: () => process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true',
});

module.exports = {
  rateLimiter
};
