/**
 * Landing Pad API Server
 * 
 * Main entry point for the API server. Handles middleware setup,
 * route configuration, and database initialization.
 */

// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import middleware and utilities
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const { sequelize, testConnection, initializeDatabase, closeConnection } = require('./config/database');
const logger = require('./utils/logger');
const { loadDevDefaults, checkEnv } = require('./utils/envValidator');

// Add graceful shutdown logic
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  // Close database connection
  await closeConnection();
  
  // Exit process
  logger.info('Shutdown complete');
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// In development, load default environment variables
loadDevDefaults();

// Validate environment variables
checkEnv();

// Trust proxy for secure cookies in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// === Security middleware ===

// Set security headers if enabled (default in production)
if (process.env.ENABLE_HELMET !== 'false') {
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production'
  }));
}

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow cookies to be sent with requests (for refresh token)
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // Default 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),               // Default 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// === Performance middleware ===

// Configure Morgan logging
const morganFormat = process.env.LOG_FORMAT || (process.env.NODE_ENV === 'production' ? 'combined' : 'dev');
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim())
  },
  skip: (req, res) => req.path === '/health' // Skip logging health checks
}));

// Enable compression if configured
if (process.env.ENABLE_COMPRESSION !== 'false') {
  app.use(compression());
}

// === Request parsing middleware ===

// Parse JSON bodies with size limit
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Parse cookies (for refresh token)
app.use(cookieParser());

// Serve files from the uploads directory if not using S3
const path = require('path');
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadDir)));
logger.info(`Serving static files from: ${path.join(process.cwd(), uploadDir)}`);

// === Routes ===

// API version prefix
const API_VERSION = process.env.API_VERSION || '1';
const API_PREFIX = `/api/v${API_VERSION}`;

// Mount API routes
app.use(API_PREFIX, routes);

// API index route
app.get('/', (req, res) => {
  res.json({
    name: 'Landing Pad Digital API',
    version: API_VERSION,
    docs: '/docs/api-reference.md',
    env: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    
    // Check storage service health
    let storageStatus = { service: 'not configured' };
    try {
      const storageService = require('./services/storageService');
      const storageHealthCheck = await storageService.healthCheck();
      storageStatus = storageHealthCheck.success
        ? { service: storageHealthCheck.storage, status: 'connected', details: storageHealthCheck.message }
        : { service: storageHealthCheck.storage, status: 'error', details: storageHealthCheck.error };
    } catch (storageError) {
      logger.warn('Storage service health check failed:', storageError.message);
      storageStatus = { service: 'error', status: 'disconnected', details: storageError.message };
    }
    
    res.status(200).json({ 
      status: 'healthy',
      env: process.env.NODE_ENV || 'development',
      database: dbStatus ? 'connected' : 'disconnected',
      storage: storageStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

/**
 * Initialize database and start server
 * @returns {Promise<void>}
 */
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Database connection failed. Check your database configuration.');
      throw new Error('Database connection failed');
    }
    
    // Initialize database with proper options
    const forceReset = process.env.DB_FORCE_RESET === 'true';
    const alterTables = process.env.DB_ALTER_TABLES === 'true';
    
    await initializeDatabase(forceReset, alterTables);
    
    // Start server if not in test mode
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        logger.info(`API available at http://localhost:${PORT}${API_PREFIX}`);
        logger.info(`Health check available at http://localhost:${PORT}/health`);
        
        // Log database connection info
        if (process.env.DB_URL) {
          logger.info('Connected to database using connection URL');
        } else {
          const dbInfo = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'landing_pad_dev',
            ssl: process.env.DB_SSL === 'true' ? 'enabled' : 'disabled'
          };
          logger.info(`Database connected: ${JSON.stringify(dbInfo)}`);
        }
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Export for testing
module.exports = app;
