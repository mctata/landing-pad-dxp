const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const deploymentService = require('../services/deploymentService');
const websiteService = require('../services/websiteService');
const domainService = require('../services/domainService');

/**
 * Controller responsible for website publishing and deployment
 */
const publishController = {
  /**
   * Publish a website
   * @route POST /api/websites/:websiteId/publish
   */
  async publishWebsite(req, res, next) {
    try {
      const { websiteId } = req.params;
      const userId = req.user.id;
      
      // Check if website exists and belongs to the user
      const website = await websiteService.getWebsiteById(websiteId, userId);
      if (!website) {
        throw new APIError('Website not found', 404);
      }
      
      logger.info(`Publishing website ${websiteId} for user ${userId}`);
      
      // Generate a new deployment
      const deploymentId = uuidv4();
      const version = generateVersion();
      
      // Create a new deployment record
      const deployment = await deploymentService.createDeployment({
        id: deploymentId,
        websiteId,
        userId,
        status: 'queued',
        version,
        commitMessage: 'User initiated deployment',
      });
      
      // Queue the actual deployment process
      // This would be better handled by a queue service in production
      setTimeout(() => {
        processDeployment(deploymentId, websiteId, userId)
          .catch(err => {
            logger.error(`Deployment processing error: ${err.message}`, { deploymentId, websiteId });
          });
      }, 100);
      
      // Update the website's lastPublishedAt timestamp
      await websiteService.updateWebsite(websiteId, { 
        lastPublishedAt: new Date().toISOString() 
      });
      
      res.status(200).json({
        message: 'Website publishing initiated',
        deployment: {
          id: deployment.id,
          version: deployment.version,
          status: deployment.status,
          createdAt: deployment.createdAt
        }
      });
    } catch (error) {
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
      
      // Create domain
      const domain = await domainService.createDomain({
        name,
        websiteId,
        userId,
        status: 'pending',
        verificationStatus: 'pending',
        isPrimary: false,
        dnsRecords
      });
      
      res.status(201).json({ 
        message: 'Domain added successfully',
        domain 
      });
    } catch (error) {
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
      
      // Initiate domain verification (this would call external API in production)
      const result = await domainService.verifyDomain(domainId);
      
      res.status(200).json({ 
        message: 'Domain verification initiated',
        status: result.verificationStatus
      });
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
    // Update deployment status to in_progress
    await deploymentService.updateDeployment(deploymentId, {
      status: 'in_progress',
    });
    
    const startTime = Date.now();
    
    // Get website data
    const website = await websiteService.getWebsiteById(websiteId, userId);
    if (!website) {
      throw new Error('Website not found');
    }
    
    // In a real implementation, here we would:
    // 1. Export the website data
    // 2. Generate static files or prepare the deployment package
    // 3. Upload to the hosting provider (like Vercel, Netlify, AWS S3, etc.)
    
    // Simulate deployment processing time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // For simplicity, we'll just simulate a successful deployment
    const buildTime = Date.now() - startTime;
    
    // Update deployment status to success
    await deploymentService.updateDeployment(deploymentId, {
      status: 'success',
      completedAt: new Date().toISOString(),
      buildTime,
    });
    
    logger.info(`Deployment ${deploymentId} completed successfully in ${buildTime}ms`);
  } catch (error) {
    logger.error(`Deployment ${deploymentId} failed: ${error.message}`);
    
    // Update deployment status to failed
    await deploymentService.updateDeployment(deploymentId, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      errorMessage: error.message,
    });
  }
}

module.exports = publishController;