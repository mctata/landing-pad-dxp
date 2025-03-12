const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const routes = require('./routes');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

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