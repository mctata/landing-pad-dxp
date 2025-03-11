const rateLimit = require('express-rate-limit');

/**
 * Rate limiters for different API categories
 */
const rateLimiter = {
  /**
   * General API rate limiter
   * 100 requests per 15 minutes
   */
  generalLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    }
  }),

  /**
   * AI API rate limiter
   * More restrictive due to cost and resource usage
   * 20 requests per 15 minutes
   */
  aiLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per windowMs for AI endpoints
    standardHeaders: true, 
    legacyHeaders: false,
    message: {
      success: false,
      message: 'AI request limit exceeded, please try again later.'
    }
  }),

  /**
   * Auth API rate limiter
   * Helps prevent brute force attacks
   * 10 requests per 15 minutes
   */
  authLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per windowMs for auth endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    }
  })
};

module.exports = rateLimiter;