const Queue = require('bull');
const logger = require('../utils/logger');
const path = require('path');
const deploymentService = require('./deploymentService');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

// Create the deployment queue
const deploymentQueue = new Queue('deployment-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100, // Keep the last 100 completed jobs
    removeOnFail: 200, // Keep the last 200 failed jobs
  }
});

// Create a domain verification queue
const domainVerificationQueue = new Queue('domain-verification-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 10000
    },
    removeOnComplete: 50,
    removeOnFail: 100,
  }
});

// Set up queue event listeners for logging
const setupQueueEvents = (queue, queueName) => {
  queue.on('error', (error) => {
    logger.error(`Queue ${queueName} error:`, error);
  });

  queue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} in queue ${queueName} failed:`, error);
  });

  queue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} in queue ${queueName} completed`);
  });

  queue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} in queue ${queueName} stalled`);
  });
};

// Set up event listeners
setupQueueEvents(deploymentQueue, 'deployment-queue');
setupQueueEvents(domainVerificationQueue, 'domain-verification-queue');

// Process the deployment queue
deploymentQueue.process(async (job) => {
  const { deploymentId, websiteId, userId } = job.data;
  logger.info(`Processing deployment ${deploymentId} for website ${websiteId} from queue`);

  try {
    // Process the deployment
    await deploymentService.processDeployment(deploymentId);
    return { success: true, deploymentId };
  } catch (error) {
    logger.error(`Error processing deployment ${deploymentId}:`, error);
    
    // Try to update deployment status to failed
    try {
      const deployment = await deploymentService.getDeploymentById(deploymentId);
      if (deployment && deployment.status !== 'failed') {
        await deploymentService.updateDeployment(deploymentId, {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: `Queue processing error: ${error.message}`,
        });
      }
    } catch (updateError) {
      logger.error(`Failed to update deployment failure status: ${updateError.message}`, { deploymentId });
    }
    
    throw error; // Rethrow to let Bull handle the job failure
  }
});

// Process the domain verification queue
domainVerificationQueue.process(async (job) => {
  const { domainId, websiteId } = job.data;
  logger.info(`Processing domain verification ${domainId} for website ${websiteId} from queue`);

  try {
    // Import the domain service only here to avoid circular dependencies
    const domainService = require('./domainService');
    
    // Verify the domain
    const result = await domainService.verifyDomain(domainId);
    return result;
  } catch (error) {
    logger.error(`Error verifying domain ${domainId}:`, error);
    throw error;
  }
});

// Create utility functions to add jobs to the queues
const queueService = {
  /**
   * Add a deployment job to the queue
   * @param {string} deploymentId - The ID of the deployment to process
   * @param {string} websiteId - The ID of the website being deployed
   * @param {string} userId - The ID of the user who initiated the deployment
   * @param {Object} options - Additional options for the job
   * @returns {Promise<Object>} - The queued job
   */
  async queueDeployment(deploymentId, websiteId, userId, options = {}) {
    const jobOptions = {
      priority: options.priority || 0,
      delay: options.delay || 0,
      jobId: deploymentId, // Use the deployment ID as the job ID to avoid duplicates
      ...options
    };
    
    const job = await deploymentQueue.add(
      {
        deploymentId,
        websiteId,
        userId,
        timestamp: new Date().toISOString()
      },
      jobOptions
    );
    
    logger.info(`Deployment ${deploymentId} queued as job ${job.id}`);
    return job;
  },
  
  /**
   * Add a domain verification job to the queue
   * @param {string} domainId - The ID of the domain to verify
   * @param {string} websiteId - The ID of the website the domain belongs to
   * @param {Object} options - Additional options for the job
   * @returns {Promise<Object>} - The queued job
   */
  async queueDomainVerification(domainId, websiteId, options = {}) {
    const jobOptions = {
      priority: options.priority || 0,
      delay: options.delay || 0,
      jobId: `domain-${domainId}`, // Use a prefixed domain ID as the job ID
      ...options
    };
    
    const job = await domainVerificationQueue.add(
      {
        domainId,
        websiteId,
        timestamp: new Date().toISOString()
      },
      jobOptions
    );
    
    logger.info(`Domain verification for ${domainId} queued as job ${job.id}`);
    return job;
  },
  
  /**
   * Get the deployment queue instance
   * @returns {Queue} The deployment queue
   */
  getDeploymentQueue() {
    return deploymentQueue;
  },
  
  /**
   * Get the domain verification queue instance
   * @returns {Queue} The domain verification queue
   */
  getDomainVerificationQueue() {
    return domainVerificationQueue;
  },
  
  /**
   * Get the status of all queues
   * @returns {Promise<Object>} Status of all queues
   */
  async getQueueStatus() {
    const [
      deploymentCounts,
      domainVerificationCounts
    ] = await Promise.all([
      deploymentQueue.getJobCounts(),
      domainVerificationQueue.getJobCounts()
    ]);
    
    return {
      deployment: deploymentCounts,
      domainVerification: domainVerificationCounts
    };
  },
  
  /**
   * Process all queued deployments immediately
   * Force processing of all waiting deployments
   * @returns {Promise<Object>} - Result of the operation
   */
  async processQueuedDeployments() {
    // This will now return all waiting jobs in the queue
    const waitingJobs = await deploymentQueue.getJobs(['waiting', 'delayed']);
    
    logger.info(`Processing ${waitingJobs.length} queued deployments immediately`);
    
    // Promote all delayed jobs to waiting
    const promotionPromises = waitingJobs
      .filter(job => job.status === 'delayed')
      .map(job => job.promote());
      
    await Promise.all(promotionPromises);
    
    return {
      message: `Triggered processing of ${waitingJobs.length} queued deployments`,
      count: waitingJobs.length
    };
  },
  
  /**
   * Clean up completed and failed jobs older than the specified grace period
   * @param {number} olderThan - Time in milliseconds. Default is 7 days.
   * @returns {Promise<Object>} - Result of the cleanup operation
   */
  async cleanupOldJobs(olderThan = 7 * 24 * 60 * 60 * 1000) {
    const deploymentCleanup = await deploymentQueue.clean(olderThan, 'completed');
    const deploymentFailedCleanup = await deploymentQueue.clean(olderThan, 'failed');
    const domainCleanup = await domainVerificationQueue.clean(olderThan, 'completed');
    const domainFailedCleanup = await domainVerificationQueue.clean(olderThan, 'failed');
    
    return {
      message: 'Queue cleanup completed',
      deploymentCompleted: deploymentCleanup.length,
      deploymentFailed: deploymentFailedCleanup.length,
      domainCompleted: domainCleanup.length,
      domainFailed: domainFailedCleanup.length
    };
  },
  
  /**
   * Pause the deployment queue
   * @returns {Promise<void>}
   */
  async pauseDeploymentQueue() {
    await deploymentQueue.pause();
    logger.info('Deployment queue paused');
  },
  
  /**
   * Resume the deployment queue
   * @returns {Promise<void>}
   */
  async resumeDeploymentQueue() {
    await deploymentQueue.resume();
    logger.info('Deployment queue resumed');
  }
};

module.exports = queueService;