const Queue = require('bull');
const logger = require('../utils/logger');
const path = require('path');
const axios = require('axios');
const deploymentService = require('./deploymentService');

/**
 * Categorize deployment errors to help with debugging and recovery
 * @param {Error} error - The error to categorize
 * @returns {string} - Error category
 */
function categorizeDeploymentError(error) {
  const message = error.message.toLowerCase();
  
  // Network and connectivity errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || 
      message.includes('network') || message.includes('connection')) {
    return 'network_error';
  }
  
  // Timeout errors
  if (error.code === 'ETIMEDOUT' || message.includes('timeout')) {
    return 'timeout';
  }
  
  // Authentication errors
  if (message.includes('unauthorized') || message.includes('authentication') || 
      message.includes('auth') || message.includes('token') || 
      error.response?.status === 401 || error.response?.status === 403) {
    return 'authentication_error';
  }
  
  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests') || 
      error.response?.status === 429) {
    return 'rate_limit';
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || 
      error.response?.status === 400 || error.response?.status === 422) {
    return 'validation_error';
  }
  
  // Resource not found
  if (message.includes('not found') || error.response?.status === 404) {
    return 'resource_not_found';
  }
  
  // Resource conflicts
  if (message.includes('conflict') || error.response?.status === 409) {
    return 'resource_conflict';
  }
  
  // Provider specific errors
  if (message.includes('vercel') || message.includes('deploy')) {
    return 'provider_error';
  }
  
  // Provider unavailable
  if (error.response?.status >= 500) {
    return 'provider_unavailable';
  }
  
  // File system errors
  if (message.includes('enoent') || message.includes('file') || 
      message.includes('directory') || message.includes('permission')) {
    return 'filesystem_error';
  }
  
  // Database errors
  if (message.includes('database') || message.includes('sql') || 
      message.includes('sequelize')) {
    return 'database_error';
  }
  
  // Default: unknown error
  return 'unknown_error';
}

/**
 * Send notification for deployment events
 * @param {string} deploymentId - The deployment ID
 * @param {string} status - The deployment status (success, failed)
 * @param {string} [errorCategory] - Error category for failed deployments
 */
/**
 * Categorize domain verification errors to help with debugging and recovery
 * @param {Error} error - The error to categorize
 * @returns {string} - Error category
 */
function categorizeDomainError(error) {
  const message = error.message.toLowerCase();
  
  // DNS propagation issues
  if (message.includes('dns') || message.includes('propagation') || 
      message.includes('txt record') || message.includes('cname')) {
    return 'dns_propagation_delay';
  }
  
  // HTTP verification issues
  if (message.includes('http verification') || message.includes('site not reachable')) {
    return 'http_verification_error';
  }
  
  // Domain ownership issues
  if (message.includes('ownership') || message.includes('already claimed') || 
      message.includes('not authorized')) {
    return 'ownership_verification_error';
  }
  
  // SSL/TLS issues
  if (message.includes('ssl') || message.includes('tls') || 
      message.includes('certificate')) {
    return 'ssl_error';
  }
  
  // Domain provider issues
  if (message.includes('registrar') || message.includes('provider')) {
    return 'domain_provider_error';
  }
  
  // Network and connectivity errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || 
      message.includes('network') || message.includes('connection')) {
    return 'network_error';
  }
  
  // Timeout errors
  if (error.code === 'ETIMEDOUT' || message.includes('timeout')) {
    return 'timeout';
  }
  
  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests') || 
      error.response?.status === 429) {
    return 'rate_limit';
  }
  
  // Bad DNS configuration
  if (message.includes('invalid') || message.includes('malformed') || 
      message.includes('incorrect')) {
    return 'bad_dns_configuration';
  }
  
  // Default: unknown error
  return 'unknown_domain_error';
}

/**
 * Send notification for deployment events
 * @param {string} deploymentId - The deployment ID
 * @param {string} status - The deployment status (success, failed)
 * @param {string} [errorCategory] - Error category for failed deployments
 */
async function sendDeploymentNotification(deploymentId, status, errorCategory = null) {
  try {
    // Get deployment details
    const deployment = await deploymentService.getDeploymentById(deploymentId);
    if (!deployment) return;
    
    // Get website details
    const website = await require('../models').Website.findByPk(deployment.websiteId);
    if (!website) return;
    
    // Get user details
    const user = await require('../models').User.findByPk(deployment.userId);
    if (!user) return;
    
    logger.info(`Sending ${status} notification for deployment ${deploymentId}`);
    
    // In a real implementation, this would send an email, Slack message, or other notification
    // For now we'll just log it
    const message = status === 'success'
      ? `Deployment of ${website.name} completed successfully. URL: ${deployment.deploymentUrl}`
      : `Deployment of ${website.name} failed. Error: ${errorCategory}: ${deployment.errorMessage}`;
    
    logger.info(`NOTIFICATION to ${user.email}: ${message}`);
    
    // Example of webhook notification if configured for the website
    if (website.webhookUrl) {
      try {
        await axios.post(website.webhookUrl, {
          event: `deployment.${status}`,
          deploymentId: deployment.id,
          websiteId: website.id,
          websiteName: website.name,
          status,
          timestamp: new Date().toISOString(),
          url: deployment.deploymentUrl,
          error: status === 'failed' ? {
            category: errorCategory,
            message: deployment.errorMessage
          } : null
        });
      } catch (webhookError) {
        logger.error(`Failed to send webhook notification: ${webhookError.message}`);
      }
    }
  } catch (error) {
    logger.error(`Error sending deployment notification: ${error.message}`);
  }
}

/**
 * Send notification for domain verification events
 * @param {string} domainId - The domain ID
 * @param {string} status - The verification status (verified, failed)
 * @param {string} [errorCategory] - Error category for failed verifications
 */
async function sendDomainVerificationNotification(domainId, status, errorCategory = null) {
  try {
    // Import the domain service to avoid circular dependencies
    const domainService = require('./domainService');
    
    // Get domain details
    const domain = await domainService.getDomainById(domainId);
    if (!domain) return;
    
    // Get website details
    const website = await require('../models').Website.findByPk(domain.websiteId);
    if (!website) return;
    
    // Get user details
    const User = require('../models').User;
    const user = await User.findByPk(domain.userId || website.userId);
    if (!user) return;
    
    logger.info(`Sending ${status} domain verification notification for ${domain.name}`);
    
    // In a real implementation, this would send an email, Slack message, or other notification
    // For now we'll just log it
    let message;
    
    if (status === 'verified') {
      message = `Domain ${domain.name} has been successfully verified for website ${website.name}`;
    } else if (status === 'failed') {
      message = `Domain verification failed for ${domain.name}: ${errorCategory}: ${domain.verificationErrors}`;
      
      // Add helpful troubleshooting tips based on error category
      if (errorCategory === 'dns_propagation_delay') {
        message += `. DNS changes can take up to 48 hours to propagate. Please check your DNS settings and try again later.`;
      } else if (errorCategory === 'bad_dns_configuration') {
        message += `. Please check that your DNS records are correctly configured as specified in the domain settings.`;
      } else if (errorCategory === 'ownership_verification_error') {
        message += `. Please verify that you have full control over this domain and try again.`;
      }
    } else {
      message = `Domain ${domain.name} verification status updated to ${status}`;
    }
    
    logger.info(`NOTIFICATION to ${user.email}: ${message}`);
    
    // Example of webhook notification if configured for the website
    if (website.webhookUrl) {
      try {
        await axios.post(website.webhookUrl, {
          event: `domain.${status}`,
          domainId: domain.id,
          domainName: domain.name,
          websiteId: website.id,
          websiteName: website.name,
          status,
          timestamp: new Date().toISOString(),
          error: status === 'failed' ? {
            category: errorCategory,
            message: domain.verificationErrors
          } : null
        });
      } catch (webhookError) {
        logger.error(`Failed to send webhook notification: ${webhookError.message}`);
      }
    }
  } catch (error) {
    logger.error(`Error sending domain verification notification: ${error.message}`);
  }
}

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
    // Check if deployment exists before processing
    const deployment = await deploymentService.getDeploymentById(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found in database`);
    }

    // Check if website exists
    const website = await require('../models').Website.findByPk(websiteId);
    if (!website) {
      throw new Error(`Website ${websiteId} not found in database`);
    }

    // Record job start and attempt count
    const attemptCount = job.attemptsMade + 1;
    await deploymentService.updateDeployment(deploymentId, {
      status: 'in_progress',
      buildLogs: `Deployment attempt ${attemptCount} started at ${new Date().toISOString()}\n${deployment.buildLogs || ''}`
    });

    // Process the deployment
    await deploymentService.processDeployment(deploymentId);
    
    // Send notification of successful deployment
    await sendDeploymentNotification(deploymentId, 'success');
    
    return { success: true, deploymentId };
  } catch (error) {
    // Categorize the error
    const errorCategory = categorizeDeploymentError(error);
    logger.error(`Error processing deployment ${deploymentId} (${errorCategory}):`, error);
    
    // Try to update deployment status to failed with categorized error
    try {
      const deployment = await deploymentService.getDeploymentById(deploymentId);
      if (deployment && deployment.status !== 'failed') {
        // Determine if this is a temporary error that should be retried
        const isRetryable = ['network_error', 'timeout', 'provider_unavailable', 'resource_conflict'].includes(errorCategory);
        
        // Record detailed error information
        await deploymentService.updateDeployment(deploymentId, {
          status: isRetryable && job.attemptsMade < job.opts.attempts - 1 ? 'retry' : 'failed',
          completedAt: isRetryable && job.attemptsMade < job.opts.attempts - 1 ? null : new Date(),
          errorMessage: `${errorCategory}: ${error.message}`,
          errorCategory: errorCategory,
          attemptCount: job.attemptsMade + 1,
          buildLogs: `${deployment.buildLogs || ''}\n[ERROR] ${new Date().toISOString()} - ${errorCategory}: ${error.message}`
        });
        
        // Send notification for failed deployment
        if (!isRetryable || job.attemptsMade >= job.opts.attempts - 1) {
          await sendDeploymentNotification(deploymentId, 'failed', errorCategory);
        }
      }
    } catch (updateError) {
      logger.error(`Failed to update deployment failure status: ${updateError.message}`, { deploymentId });
    }
    
    // For certain errors, add a delay before retry
    if (error.message.includes('rate limit') && job.attemptsMade < job.opts.attempts - 1) {
      // Increase delay for rate limit errors
      await new Promise(resolve => setTimeout(resolve, 30000 + (job.attemptsMade * 30000)));
    }
    
    throw error; // Rethrow to let Bull handle the job failure
  }
});

// Process the domain verification queue
domainVerificationQueue.process(async (job) => {
  const { domainId, websiteId } = job.data;
  logger.info(`Processing domain verification ${domainId} for website ${websiteId} from queue (attempt ${job.attemptsMade + 1})`);

  try {
    // Import the domain service only here to avoid circular dependencies
    const domainService = require('./domainService');
    
    // Check if domain exists before processing
    const domain = await domainService.getDomainById(domainId);
    if (!domain) {
      throw new Error(`Domain ${domainId} not found in database`);
    }

    // Check if website exists
    const website = await require('../models').Website.findByPk(websiteId);
    if (!website) {
      throw new Error(`Website ${websiteId} not found in database`);
    }
    
    // Update status to show verification in progress
    await domainService.updateDomain(domainId, {
      verificationStatus: 'in_progress',
      lastVerificationAttempt: new Date(),
      verificationAttemptCount: (domain.verificationAttemptCount || 0) + 1
    });
    
    // Verify the domain
    const result = await domainService.verifyDomain(domainId);
    
    // Send notification based on verification result
    await sendDomainVerificationNotification(domainId, result.verificationStatus);
    
    return result;
  } catch (error) {
    // Categorize the error
    const errorCategory = categorizeDomainError(error);
    logger.error(`Error verifying domain ${domainId} (${errorCategory}):`, error);
    
    try {
      // Import the domain service only here to avoid circular dependencies
      const domainService = require('./domainService');
      const domain = await domainService.getDomainById(domainId);
      
      if (domain) {
        // Determine if this is a temporary error that should be retried
        const isRetryable = ['network_error', 'dns_propagation_delay', 'timeout', 'provider_unavailable'].includes(errorCategory);
        
        // Update domain with error details
        await domainService.updateDomain(domainId, {
          verificationStatus: isRetryable && job.attemptsMade < job.opts.attempts - 1 ? 'pending' : 'failed',
          status: isRetryable && job.attemptsMade < job.opts.attempts - 1 ? 'pending' : 'error',
          verificationErrors: `${errorCategory}: ${error.message}`,
          errorCategory: errorCategory
        });
        
        // For DNS propagation delays, we want to wait longer
        if (errorCategory === 'dns_propagation_delay' && job.attemptsMade < job.opts.attempts - 1) {
          // Add exponential backoff
          const delayMs = 60000 * Math.pow(2, job.attemptsMade); // 1min, 2min, 4min, 8min...
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        // Send notification if this is the final attempt or a non-retryable error
        if (!isRetryable || job.attemptsMade >= job.opts.attempts - 1) {
          await sendDomainVerificationNotification(domainId, 'failed', errorCategory);
        }
      }
    } catch (updateError) {
      logger.error(`Failed to update domain verification status: ${updateError.message}`, { domainId });
    }
    
    throw error; // Rethrow to let Bull handle the job failure
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