/**
 * Server entry point
 * 
 * This file starts the API server and background worker processes.
 * The actual Express app configuration is in index.js.
 */

// Import the configured Express app
const app = require('./index');
const logger = require('./utils/logger');

// Get port from environment or use default
const PORT = process.env.PORT || 3001;

// Start server
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, async () => {
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
  
  // Graceful shutdown handling for server
  const serverShutdown = () => {
    logger.info('Shutting down server...');
    server.close(() => {
      logger.info('Server shut down successfully');
    });
  };
  
  // Add shutdown handlers for server
  process.on('SIGTERM', serverShutdown);
  process.on('SIGINT', serverShutdown);
}

// Export for testing
module.exports = app;