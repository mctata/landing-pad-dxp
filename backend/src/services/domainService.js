const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// In a real app, this would be replaced with database models
// For now, we'll use an in-memory store
const domains = [];

/**
 * Service for managing custom domains
 */
const domainService = {
  /**
   * Get domains for a website
   * @param {string} websiteId - Website ID
   * @returns {Promise<Array>} - Array of domains
   */
  async getDomainsByWebsiteId(websiteId) {
    return domains.filter(d => d.websiteId === websiteId);
  },
  
  /**
   * Get a domain by ID
   * @param {string} domainId - Domain ID
   * @returns {Promise<Object|null>} - Domain or null if not found
   */
  async getDomainById(domainId) {
    return domains.find(d => d.id === domainId) || null;
  },
  
  /**
   * Get a domain by name
   * @param {string} name - Domain name
   * @returns {Promise<Object|null>} - Domain or null if not found
   */
  async getDomainByName(name) {
    return domains.find(d => d.name.toLowerCase() === name.toLowerCase()) || null;
  },
  
  /**
   * Create a new domain
   * @param {Object} data - Domain data
   * @returns {Promise<Object>} - Created domain
   */
  async createDomain(data) {
    const domain = {
      id: data.id || uuidv4(),
      name: data.name,
      websiteId: data.websiteId,
      userId: data.userId,
      status: data.status || 'pending',
      verificationStatus: data.verificationStatus || 'pending',
      isPrimary: data.isPrimary || false,
      dnsRecords: data.dnsRecords || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    domains.push(domain);
    logger.info(`Domain created: ${domain.name} for website ${domain.websiteId}`);
    
    return domain;
  },
  
  /**
   * Update a domain
   * @param {string} domainId - Domain ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object|null>} - Updated domain or null if not found
   */
  async updateDomain(domainId, updates) {
    const index = domains.findIndex(d => d.id === domainId);
    if (index === -1) {
      return null;
    }
    
    // Apply updates
    domains[index] = {
      ...domains[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    logger.info(`Domain updated: ${domains[index].name}`);
    
    return domains[index];
  },
  
  /**
   * Delete a domain
   * @param {string} domainId - Domain ID
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  async deleteDomain(domainId) {
    const index = domains.findIndex(d => d.id === domainId);
    if (index === -1) {
      return false;
    }
    
    const domainName = domains[index].name;
    domains.splice(index, 1);
    
    logger.info(`Domain deleted: ${domainName}`);
    
    return true;
  },
  
  /**
   * Set a domain as primary for a website
   * @param {string} websiteId - Website ID
   * @param {string} domainId - Domain ID to set as primary
   * @returns {Promise<boolean>} - True if successful
   */
  async setPrimaryDomain(websiteId, domainId) {
    // First, unset primary flag on all domains for this website
    domains.forEach(domain => {
      if (domain.websiteId === websiteId && domain.isPrimary) {
        domain.isPrimary = false;
        domain.updatedAt = new Date().toISOString();
      }
    });
    
    // Then, set the specified domain as primary
    const index = domains.findIndex(d => d.id === domainId && d.websiteId === websiteId);
    if (index === -1) {
      return false;
    }
    
    domains[index].isPrimary = true;
    domains[index].updatedAt = new Date().toISOString();
    
    logger.info(`Domain set as primary: ${domains[index].name} for website ${websiteId}`);
    
    return true;
  },
  
  /**
   * Verify a domain
   * @param {string} domainId - Domain ID
   * @returns {Promise<Object>} - Updated domain
   */
  async verifyDomain(domainId) {
    // In a real implementation, this would call an external API to verify DNS records
    // For now, we'll simulate a verification process
    const domain = await this.getDomainById(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }
    
    // Simulate verification with 80% success rate
    const success = Math.random() > 0.2;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (success) {
      // Update verification status
      await this.updateDomain(domainId, {
        verificationStatus: 'verified',
        status: 'active'
      });
      
      logger.info(`Domain verification successful: ${domain.name}`);
      
      return {
        ...domain,
        verificationStatus: 'verified',
        status: 'active'
      };
    } else {
      // Update verification status to failed
      await this.updateDomain(domainId, {
        verificationStatus: 'failed'
      });
      
      logger.info(`Domain verification failed: ${domain.name}`);
      
      return {
        ...domain,
        verificationStatus: 'failed'
      };
    }
  },
  
  /**
   * Check domain availability
   * @param {string} name - Domain name
   * @returns {Promise<Object>} - Availability result
   */
  async checkDomainAvailability(name) {
    // In a real implementation, this would call an external API to check domain availability
    // For now, we'll just check our local store
    const existingDomain = await this.getDomainByName(name);
    
    return {
      name,
      available: !existingDomain,
      reason: existingDomain ? 'Domain is already in use' : null
    };
  }
};

module.exports = domainService;