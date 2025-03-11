require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const { sequelize, testConnection } = require('./config/database');
const logger = require('./utils/logger');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for secure cookies in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(helmet()); // Set security headers

// Configure Morgan logging
const morganFormat = process.env.LOG_FORMAT || 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow cookies to be sent with requests (for refresh token)
}));

// Request parsers
app.use(express.json({ limit: '1mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies (for refresh token)

// API version prefix
const API_PREFIX = `/api${process.env.API_VERSION ? `/v${process.env.API_VERSION}` : ''}`;

// API Routes
app.use(API_PREFIX, routes);

// API index route
app.get('/', (req, res) => {
  res.json({
    name: 'Landing Pad Digital API',
    version: process.env.API_VERSION || '1.0.0',
    docs: '/docs/api-reference.md'
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    
    res.status(200).json({ 
      status: 'healthy',
      env: process.env.NODE_ENV || 'development',
      database: dbStatus ? 'connected' : 'disconnected',
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

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models if not in production
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: process.env.DB_FORCE_RESET === 'true' });
      logger.info('Database synced');
    }
    
    // Start server if not in test mode
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        logger.info(`API available at http://localhost:${PORT}${API_PREFIX}`);
        logger.info(`Health check available at http://localhost:${PORT}/health`);
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

module.exports = app; // Export for testing
