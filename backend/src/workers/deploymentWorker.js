/**
 * Deployment worker
 * This process is responsible for processing deployments from the queue
 */
require('dotenv').config();
const logger = require('../utils/logger');
const queueService = require('../services/queueService');

// Get queue instances
const deploymentQueue = queueService.getDeploymentQueue();
const domainVerificationQueue = queueService.getDomainVerificationQueue();

/**
 * Main worker function
 */
async function startWorker() {
  logger.info('Starting deployment worker');
  
  try {
    // Log queue status at startup
    const queueStatus = await queueService.getQueueStatus();
    logger.info('Queue status at startup:', queueStatus);
    
    // Set up signal handlers for graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await shutdown();
    });
    
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await shutdown();
    });
    
    // Log when the worker is ready
    logger.info('Deployment worker is now processing jobs');
  } catch (error) {
    logger.error('Error starting deployment worker:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown function
 */
async function shutdown() {
  logger.info('Closing queue connections');
  
  try {
    await deploymentQueue.close();
    await domainVerificationQueue.close();
    logger.info('Queue connections closed');
    
    // Exit after a small delay to ensure logs are written
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the worker if this file is run directly
if (require.main === module) {
  startWorker().catch(err => {
    logger.error('Fatal error in deployment worker:', err);
    process.exit(1);
  });
}

module.exports = { startWorker, shutdown };