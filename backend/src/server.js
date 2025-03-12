const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const routes = require('./routes');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(hpp()); // Protect against HTTP Parameter Pollution attacks

// Rate limiting and brute force protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: options.message,
    });
  }
});

// Apply more strict limits to sensitive routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 login/auth attempts per hour
  message: 'Too many authentication attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: options.message,
    });
  }
});

// Speed limiter for API
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes without delay
  delayMs: (hits) => hits * 100, // add 100ms delay per hit above the limit
  onLimitReached: (req, res, options) => {
    logger.warn(`Speed limit reached for IP: ${req.ip}`);
  }
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/', speedLimiter);

// Limit JSON and URL encoded payload size
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging middleware
app.use(morgan('combined'));

// Add security headers
app.use((req, res, next) => {
  // Add Content-Security-Policy for admin routes
  if (req.path.startsWith('/api/admin')) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"
    );
  }
  
  // Prevent content type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Additional security headers
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// Mount routes
app.use(routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log OpenAI configuration
  if (process.env.OPENAI_API_KEY) {
    logger.info(`OpenAI API is configured with model: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}`);
  } else {
    logger.warn('OpenAI API key is not set. AI features will not function properly.');
  }
  
  // Start worker in development mode or when RUN_WORKER_IN_PROCESS is true
  if (process.env.NODE_ENV === 'development' || process.env.RUN_WORKER_IN_PROCESS === 'true') {
    try {
      const { startWorker } = require('./workers/deploymentWorker');
      await startWorker();
      logger.info('Deployment worker started in-process');
    } catch (error) {
      logger.error('Failed to start deployment worker:', error);
    }
  } else {
    logger.info('Deployment worker not started in-process. Should be running as a separate process in production.');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;