const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// In a real app, this would be replaced with database models
// For now, we'll use an in-memory store
const deployments = [];

/**
 * Service for managing website deployments
 */
const deploymentService = {
  /**
   * Create a new deployment
   * @param {Object} data - Deployment data
   * @returns {Promise<Object>} - Created deployment
   */
  async createDeployment(data) {
    const deployment = {
      id: data.id || uuidv4(),
      websiteId: data.websiteId,
      userId: data.userId,
      status: data.status || 'queued',
      version: data.version,
      commitMessage: data.commitMessage || 'User initiated deployment',
      createdAt: new Date().toISOString(),
      completedAt: null,
      buildTime: null,
      errorMessage: null
    };
    
    deployments.push(deployment);
    logger.info(`Deployment created: ${deployment.id} for website ${deployment.websiteId}`);
    
    return deployment;
  },
  
  /**
   * Get deployments for a website
   * @param {string} websiteId - Website ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} - Deployments with pagination
   */
  async getDeployments(websiteId, options = {}) {
    const { limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;
    
    // Filter by websiteId and sort by createdAt descending
    const filteredDeployments = deployments
      .filter(d => d.websiteId === websiteId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const totalItems = filteredDeployments.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    const items = filteredDeployments.slice(skip, skip + limit);
    
    return {
      items,
      pagination: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages
      }
    };
  },
  
  /**
   * Get a deployment by ID
   * @param {string} deploymentId - Deployment ID
   * @returns {Promise<Object|null>} - Deployment or null if not found
   */
  async getDeploymentById(deploymentId) {
    return deployments.find(d => d.id === deploymentId) || null;
  },
  
  /**
   * Update a deployment
   * @param {string} deploymentId - Deployment ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object|null>} - Updated deployment or null if not found
   */
  async updateDeployment(deploymentId, updates) {
    const index = deployments.findIndex(d => d.id === deploymentId);
    if (index === -1) {
      return null;
    }
    
    // Apply updates
    deployments[index] = {
      ...deployments[index],
      ...updates
    };
    
    logger.info(`Deployment updated: ${deploymentId}, status: ${deployments[index].status}`);
    
    return deployments[index];
  },
  
  /**
   * Get the latest successful deployment for a website
   * @param {string} websiteId - Website ID
   * @returns {Promise<Object|null>} - Deployment or null if not found
   */
  async getLatestSuccessfulDeployment(websiteId) {
    const successful = deployments
      .filter(d => d.websiteId === websiteId && d.status === 'success')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return successful.length > 0 ? successful[0] : null;
  },
  
  /**
   * Check if a website has any active deployments
   * @param {string} websiteId - Website ID
   * @returns {Promise<boolean>} - True if active deployments exist
   */
  async hasActiveDeployments(websiteId) {
    return deployments.some(
      d => d.websiteId === websiteId && 
           (d.status === 'queued' || d.status === 'in_progress')
    );
  }
};

module.exports = deploymentService;