const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const deploymentService = require('../services/deploymentService');
const websiteService = require('../services/websiteService');
const domainService = require('../services/domainService');
const queueService = require('../services/queueService');

/**
 * Controller responsible for website publishing and deployment
 */
const publishController = {
  /**
   * Handle deployment status webhook from Vercel
   * @route POST /api/websites/webhook/deployment
   */
  async handleDeploymentWebhook(req, res, next) {
    try {
      const { verifySignature } = require('../utils/webhookUtils');
      
      // Verify webhook signature
      if (!verifySignature(req)) {
        logger.warn('Invalid webhook signature received');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      const payload = req.body;
      logger.info('Received deployment webhook', { deploymentId: payload.id, status: payload.state });
      
      // Extract deployment information from payload
      const { id: vercelDeploymentId, name, url, state } = payload;
      
      // Find our deployment record using metadata from Vercel
      // Assuming we store our deployment ID in Vercel's metadata when creating deployments
      const deploymentId = payload.meta?.deploymentId;
      
      if (!deploymentId) {
        logger.warn('No deployment ID found in webhook payload', { vercelDeploymentId });
        return res.status(200).json({ received: true }); // Acknowledge receipt but do nothing
      }
      
      // Map Vercel deployment states to our states
      const statusMap = {
        READY: 'success',
        ERROR: 'failed',
        BUILDING: 'in_progress',
        QUEUED: 'queued',
        CANCELED: 'canceled'
      };
      
      const status = statusMap[state] || 'unknown';
      
      // Update our deployment status
      await deploymentService.updateDeployment(deploymentId, {
        status,
        deploymentUrl: url,
        completedAt: ['success', 'failed', 'canceled'].includes(status) ? new Date() : null,
        errorMessage: state === 'ERROR' ? 'Deployment failed on Vercel' : null
      });
      
      // If successful, update the website with the new URL
      if (status === 'success') {
        const deployment = await deploymentService.getDeploymentById(deploymentId);
        if (deployment) {
          await websiteService.updateWebsite(deployment.websiteId, {
            lastDeployedAt: new Date(),
            lastSuccessfulDeploymentId: deploymentId,
            publicUrl: url
          });
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Error processing deployment webhook:', error);
      // Always return 200 to Vercel to acknowledge receipt
      res.status(200).json({ received: true });
    }
  },
  /**
   * Publish a website
   * @route POST /api/websites/:websiteId/publish
   */
  async publishWebsite(req, res, next) {
    // Use a transaction for related operations
    const t = await sequelize.transaction();
    
    try {
      const { websiteId } = req.params;
      const userId = req.user.id;
      
      // Check if website exists and belongs to the user
      const website = await websiteService.getWebsiteById(websiteId, userId);
      if (!website) {
        throw new APIError('Website not found', 404);
      }
      
      // Check if website already has active deployments
      const hasActiveDeployments = await deploymentService.hasActiveDeployments(websiteId);
      if (hasActiveDeployments) {
        throw new APIError('A deployment is already in progress for this website', 409);
      }
      
      logger.info(`Publishing website ${websiteId} for user ${userId}`);
      
      // Generate a new deployment
      const version = generateVersion();
      
      try {
        // Create a new deployment record within the transaction
        const deployment = await deploymentService.createDeployment({
          websiteId,
          userId,
          status: 'queued',
          version,
          commitMessage: 'User initiated deployment',
        });
        
        // Update the website's lastPublishedAt timestamp within the transaction
        await websiteService.updateWebsite(websiteId, { 
          lastPublishedAt: new Date()
        });
        
        // Commit the transaction
        await t.commit();
        
        // Queue the actual deployment process using the queue service
        await queueService.queueDeployment(deployment.id, websiteId, userId);
        
        res.status(200).json({
          message: 'Website publishing initiated',
          deployment: {
            id: deployment.id,
            version: deployment.version,
            status: deployment.status,
            createdAt: deployment.createdAt
          }
        });
      } catch (dbError) {
        // Rollback transaction on database errors
        await t.rollback();
        
        if (dbError instanceof ValidationError) {
          logger.error('Validation error during deployment creation', dbError);
          throw new APIError('Invalid deployment data', 400);
        } else if (dbError instanceof ForeignKeyConstraintError) {
          logger.error('Foreign key constraint error during deployment creation', dbError);
          throw new APIError('Referenced entity does not exist', 400);
        } else {
          logger.error('Database error during deployment creation', dbError);
          throw dbError;
        }
      }
    } catch (error) {
      // If transaction hasn't been committed or rolled back yet
      if (t && !t.finished) {
        await t.rollback();
      }
      next(error);
    }
  },
  
  /**
   * Get deployments for a website
   * @route GET /api/websites/:websiteId/deployments
   */
  async getDeployments(req, res, next) {
    try {
      const { websiteId } = req.params;
      const userId = req.user.id;
      const { limit = 10, page = 1 } = req.query;
      
      // Check if website exists and belongs to the user
      const website = await websiteService.getWebsiteById(websiteId, userId);
      if (!website) {
        throw new APIError('Website not found', 404);
      }
      
      // Get deployments
      const deployments = await deploymentService.getDeployments(websiteId, {
        limit: parseInt(limit, 10),
        page: parseInt(page, 10)
      });
      
      res.status(200).json({
        deployments: deployments.items,
        pagination: deployments.pagination
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a specific deployment
   * @route GET /api/websites/:websiteId/deployments/:deploymentId
   */
  async getDeployment(req, res, next) {
    try {
      const { websiteId, deploymentId } = req.params;
      const userId = req.user.id;
      
      // Check if website exists and belongs to the user
      const website = await websiteService.getWebsiteById(websiteId, userId);
      if (!website) {
        throw new APIError('Website not found', 404);
      }
      
      // Get deployment
      const deployment = await deploymentService.getDeploymentById(deploymentId);
      if (!deployment || deployment.websiteId !== websiteId) {
        throw new APIError('Deployment not found', 404);
      }
      
      res.status(200).json({ deployment });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get domains for a website
   * @route GET /api/websites/:websiteId/domains
   */
  async getDomains(req, res, next) {
    try {
      const { websiteId } = req.params;
      const userId = req.user.id;
      
      // Check if website exists and belongs to the user
      const website = await websiteService.getWebsiteById(websiteId, userId);
      if (!website) {
        throw new APIError('Website not found', 404);
      }
      
      // Get domains
      const domains = await domainService.getDomainsByWebsiteId(websiteId);
      
      res.status(200).json({ domains });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Add a domain to a website
   * @route POST /api/websites/:websiteId/domains
   */
  async addDomain(req, res, next) {
    // Use a transaction for domain creation
    const t = await sequelize.transaction();
    
    try {
      const { websiteId } = req.params;
      const { name } = req.body;
      const userId = req.user.id;
      
      // Validate domain name
      if (!name || !/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(name)) {
        throw new APIError('Invalid domain name', 400);
      }
      
      // Check if website exists and belongs to the user
      const website = await websiteService.getWebsiteById(websiteId, userId);
      if (!website) {
        throw new APIError('Website not found', 404);
      }
      
      // Check if domain already exists
      const existingDomain = await domainService.getDomainByName(name);
      if (existingDomain) {
        throw new APIError('This domain is already in use', 400);
      }
      
      // Create DNS records for the domain
      const dnsRecords = [
        {
          type: 'CNAME',
          host: name.startsWith('www.') ? name : `www.${name}`,
          value: `${websiteId}.landingpad.digital`,
          ttl: 3600
        },
        {
          type: 'A',
          host: name.startsWith('www.') ? name.substring(4) : name,
          value: '76.76.21.21', // Example IP for Vercel
          ttl: 3600
        }
      ];
      
      try {
        // Create domain with transaction
        const domain = await domainService.createDomain({
          name,
          websiteId,
          userId,
          status: 'pending',
          verificationStatus: 'pending',
          isPrimary: false,
          dnsRecords
        }, { transaction: t });
        
        // If this is the first domain for the website and no primary is set,
        // automatically make it the primary domain
        const domains = await domainService.getDomainsByWebsiteId(websiteId);
        if (domains.length === 1) {
          await domainService.setPrimaryDomain(websiteId, domain.id, { transaction: t });
        }
        
        // Commit the transaction
        await t.commit();
        
        res.status(201).json({ 
          message: 'Domain added successfully',
          domain 
        });
      } catch (dbError) {
        // Rollback transaction on database errors
        await t.rollback();
        
        if (dbError instanceof ValidationError) {
          logger.error('Validation error during domain creation', dbError);
          throw new APIError('Invalid domain data', 400);
        } else if (dbError instanceof UniqueConstraintError) {
          logger.error('Unique constraint error during domain creation', dbError);
          throw new APIError('This domain is already in use', 400);
        } else if (dbError instanceof ForeignKeyConstraintError) {
          logger.error('Foreign key constraint error during domain creation', dbError);
          throw new APIError('Referenced entity does not exist', 400);
        } else {
          logger.error('Database error during domain creation', dbError);
          throw dbError;
        }
      }
    } catch (error) {
      // If transaction hasn't been committed or rolled back yet
      if (t && !t.finished) {
        await t.rollback();
      }
      next(error);
    }
  },
  
  /**
   * Remove a domain from a website
   * @route DELETE /api/websites/:websiteId/domains/:domainId
   */
  async removeDomain(req, res, next) {
    try {
      const { websiteId, domainId } = req.params;
      const userId = req.user.id;
      
      // Check if website exists and belongs to the user
      const website = await websiteService.getWebsiteById(websiteId, userId);
      if (!website) {
        throw new APIError('Website not found', 404);
      }
      
      // Get domain
      const domain = await domainService.getDomainById(domainId);
      if (!domain || domain.websiteId !== websiteId) {
        throw new APIError('Domain not found', 404);
      }
      
      // If the domain is the primary domain, can't remove it
      if (domain.isPrimary) {
        throw new APIError('Cannot remove the primary domain. Please set another domain as primary first.', 400);
      }
      
      // Remove domain
      await domainService.deleteDomain(domainId);
      
      res.status(200).json({ 
        message: 'Domain removed successfully' 
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Set a domain as primary
   * @route PUT /api/websites/:websiteId/domains/:domainId/primary
   */
  async setPrimaryDomain(req, res, next) {
    try {
      const { websiteId, domainId } = req.params;
      const userId = req.user.id;
      
      // Check if website exists and belongs to the user
      const website = await websiteService.getWebsiteById(websiteId, userId);
      if (!website) {
        throw new APIError('Website not found', 404);
      }
      
      // Get domain
      const domain = await domainService.getDomainById(domainId);
      if (!domain || domain.websiteId !== websiteId) {
        throw new APIError('Domain not found', 404);
      }
      
      // If the domain is not active, can't set it as primary
      if (domain.status !== 'active' || domain.verificationStatus !== 'verified') {
        throw new APIError('Domain must be active and verified to set as primary', 400);
      }
      
      // Set as primary
      await domainService.setPrimaryDomain(websiteId, domainId);
      
      res.status(200).json({ 
        message: 'Domain set as primary successfully' 
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Verify a domain
   * @route POST /api/websites/:websiteId/domains/:domainId/verify
   */
  async verifyDomain(req, res, next) {
    try {
      const { websiteId, domainId } = req.params;
      const userId = req.user.id;
      
      // Check if website exists and belongs to the user
      const website = await websiteService.getWebsiteById(websiteId, userId);
      if (!website) {
        throw new APIError('Website not found', 404);
      }
      
      // Get domain
      const domain = await domainService.getDomainById(domainId);
      if (!domain || domain.websiteId !== websiteId) {
        throw new APIError('Domain not found', 404);
      }
      
      // Don't reverify domains that are already verified
      if (domain.verificationStatus === 'verified' && domain.status === 'active') {
        return res.status(200).json({ 
          message: 'Domain is already verified',
          status: 'verified'
        });
      }
      
      try {
        // Queue the domain verification task
        await queueService.queueDomainVerification(domainId, websiteId);
        
        res.status(200).json({ 
          message: 'Domain verification initiated',
          status: 'pending'
        });
      } catch (dbError) {
        if (dbError instanceof ValidationError) {
          logger.error('Validation error during domain verification', dbError);
          throw new APIError('Invalid domain data', 400);
        } else if (dbError instanceof ForeignKeyConstraintError) {
          logger.error('Foreign key constraint error during domain verification', dbError);
          throw new APIError('Referenced entity does not exist', 400);
        } else {
          logger.error('Database error during domain verification', dbError);
          throw new APIError('An error occurred during domain verification', 500);
        }
      }
    } catch (error) {
      next(error);
    }
  }
};

// Helper function to generate a version string
function generateVersion() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0')
  ].join('.');
}

// Function to process the deployment
async function processDeployment(deploymentId, websiteId, userId) {
  logger.info(`Processing deployment ${deploymentId} for website ${websiteId}`);
  
  try {
    // Use the enhanced deployment service to process the deployment
    await deploymentService.processDeployment(deploymentId);
    logger.info(`Deployment ${deploymentId} processed successfully`);
  } catch (error) {
    // Critical error that prevented deployment processing
    logger.error(`Critical deployment error: ${error.message}`, { deploymentId, websiteId });
    
    // Try one more time to update the status to failed if it wasn't already updated
    try {
      const deployment = await deploymentService.getDeploymentById(deploymentId);
      if (deployment && deployment.status !== 'failed') {
        await deploymentService.updateDeployment(deploymentId, {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: `Critical error: ${error.message}`,
        });
      }
    } catch (finalError) {
      logger.error(`Failed to update deployment failure status: ${finalError.message}`, { deploymentId });
    }
  }
}

module.exports = publishController;