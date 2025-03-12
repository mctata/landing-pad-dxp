const logger = require('../utils/logger');
const { Domain, Website } = require('../models');
const { Op, transaction } = require('sequelize');
const { sequelize } = require('../config/database');

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
    try {
      return await Domain.findAll({
        where: {
          websiteId: websiteId
        },
        order: [
          ['isPrimary', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });
    } catch (error) {
      logger.error('Error fetching domains by website ID:', error);
      throw error;
    }
  },
  
  /**
   * Get a domain by ID
   * @param {string} domainId - Domain ID
   * @returns {Promise<Object|null>} - Domain or null if not found
   */
  async getDomainById(domainId) {
    try {
      return await Domain.findByPk(domainId);
    } catch (error) {
      logger.error('Error fetching domain by ID:', error);
      throw error;
    }
  },
  
  /**
   * Get a domain by name
   * @param {string} name - Domain name
   * @returns {Promise<Object|null>} - Domain or null if not found
   */
  async getDomainByName(name) {
    try {
      return await Domain.findOne({
        where: {
          name: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('name')),
            sequelize.fn('LOWER', name)
          )
        }
      });
    } catch (error) {
      logger.error('Error fetching domain by name:', error);
      throw error;
    }
  },
  
  /**
   * Create a new domain
   * @param {Object} data - Domain data
   * @param {Object} options - Options including transaction
   * @returns {Promise<Object>} - Created domain
   */
  async createDomain(data, options = {}) {
    try {
      // Set default DNS records if not provided
      if (!data.dnsRecords || data.dnsRecords.length === 0) {
        data.dnsRecords = [];
      }
      
      // Create the domain with optional transaction
      const domain = await Domain.create({
        name: data.name,
        websiteId: data.websiteId,
        userId: data.userId,
        status: data.status || 'pending',
        verificationStatus: data.verificationStatus || 'pending',
        isPrimary: data.isPrimary || false,
        dnsRecords: data.dnsRecords
      }, options);
      
      logger.info(`Domain created: ${domain.name} for website ${domain.websiteId}`);
      
      return domain;
    } catch (error) {
      logger.error('Error creating domain:', error);
      throw error;
    }
  },
  
  /**
   * Update a domain
   * @param {string} domainId - Domain ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object|null>} - Updated domain or null if not found
   */
  async updateDomain(domainId, updates) {
    try {
      const domain = await Domain.findByPk(domainId);
      
      if (!domain) {
        return null;
      }
      
      // Apply updates
      Object.keys(updates).forEach(key => {
        domain[key] = updates[key];
      });
      
      await domain.save();
      logger.info(`Domain updated: ${domain.name}`);
      
      return domain;
    } catch (error) {
      logger.error('Error updating domain:', error);
      throw error;
    }
  },
  
  /**
   * Delete a domain
   * @param {string} domainId - Domain ID
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  async deleteDomain(domainId) {
    try {
      const domain = await Domain.findByPk(domainId);
      
      if (!domain) {
        return false;
      }
      
      const domainName = domain.name;
      
      // Delete the domain
      await domain.destroy();
      
      logger.info(`Domain deleted: ${domainName}`);
      
      return true;
    } catch (error) {
      logger.error('Error deleting domain:', error);
      throw error;
    }
  },
  
  /**
   * Set a domain as primary for a website
   * @param {string} websiteId - Website ID
   * @param {string} domainId - Domain ID to set as primary
   * @param {Object} options - Options including transaction
   * @returns {Promise<boolean>} - True if successful
   */
  async setPrimaryDomain(websiteId, domainId, options = {}) {
    // Create a transaction if one wasn't provided
    const useTransaction = options.transaction ? { transaction: options.transaction } : {};
    const shouldManageTransaction = !options.transaction;
    let t = options.transaction;
    
    try {
      // Start a new transaction if one wasn't provided
      if (shouldManageTransaction) {
        t = await sequelize.transaction();
        useTransaction.transaction = t;
      }
      
      // First, unset primary flag on all domains for this website
      await Domain.update(
        { isPrimary: false },
        {
          where: {
            websiteId: websiteId,
            isPrimary: true
          },
          ...useTransaction
        }
      );
      
      // Then, set the specified domain as primary
      const [updatedRows] = await Domain.update(
        { isPrimary: true },
        {
          where: {
            id: domainId,
            websiteId: websiteId
          },
          ...useTransaction
        }
      );
      
      // If no rows were updated, the domain doesn't exist or doesn't belong to this website
      if (updatedRows === 0) {
        if (shouldManageTransaction) {
          await t.rollback();
        }
        return false;
      }
      
      // Commit the transaction if we started it
      if (shouldManageTransaction) {
        await t.commit();
      }
      
      // Get the domain details for logging
      const domain = await Domain.findByPk(domainId);
      if (domain) {
        logger.info(`Domain set as primary: ${domain.name} for website ${websiteId}`);
      }
      
      return true;
    } catch (error) {
      // Rollback the transaction in case of error, but only if we started it
      if (shouldManageTransaction && t) {
        await t.rollback();
      }
      logger.error('Error setting primary domain:', error);
      throw error;
    }
  },
  
  /**
   * Verify a domain
   * @param {string} domainId - Domain ID
   * @returns {Promise<Object>} - Updated domain
   */
  async verifyDomain(domainId) {
    try {
      // Get domain details
      const domain = await Domain.findByPk(domainId, {
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['id', 'name', 'slug']
          }
        ]
      });
      
      if (!domain) {
        throw new Error('Domain not found');
      }
      
      // Log the verification attempt
      logger.info(`Verifying domain: ${domain.name} for website ${domain.websiteId}`);
      
      // Update status to verification_in_progress
      await domain.update({
        verificationStatus: 'in_progress',
        status: 'pending'
      });
      
      // In a real implementation, we would call an external API to verify the DNS records
      // For example, using the Vercel API or another DNS verification service
      
      // For this implementation, we'll use a simulation with multiple checks
      let dnsVerified = false;
      let httpVerified = false;
      let verificationErrors = [];
      
      // Simulate DNS record verification (checking if DNS records are correctly set up)
      try {
        // In a real implementation, this would use a DNS verification API
        // For simulation purposes, we'll use a random success rate of 85%
        dnsVerified = Math.random() > 0.15;
        
        if (!dnsVerified) {
          verificationErrors.push('DNS records not propagated or configured correctly');
        }
      } catch (dnsError) {
        logger.error(`DNS verification error for ${domain.name}:`, dnsError);
        verificationErrors.push(`DNS check error: ${dnsError.message}`);
      }
      
      // Simulate HTTP verification (checking if the domain points to our servers)
      try {
        // In a real implementation, this would make an HTTP request to the domain
        // For simulation purposes, we'll use a random success rate of 90% if DNS verification passed
        httpVerified = dnsVerified && Math.random() > 0.1;
        
        if (dnsVerified && !httpVerified) {
          verificationErrors.push('Domain not properly configured to point to our servers');
        }
      } catch (httpError) {
        logger.error(`HTTP verification error for ${domain.name}:`, httpError);
        verificationErrors.push(`HTTP check error: ${httpError.message}`);
      }
      
      // Determine overall verification status
      const success = dnsVerified && httpVerified;
      
      // Update domain with verification results
      const result = await domain.update({
        verificationStatus: success ? 'verified' : 'failed',
        status: success ? 'active' : 'error',
        lastVerifiedAt: success ? new Date() : null,
        verificationErrors: success ? null : verificationErrors.join('; ')
      });
      
      if (success) {
        logger.info(`Domain verification successful: ${domain.name}`);
        
        // If this is the first domain for the website and no primary is set,
        // automatically make it the primary domain
        const domains = await this.getDomainsByWebsiteId(domain.websiteId);
        const activeDomains = domains.filter(d => d.status === 'active');
        
        if (activeDomains.length === 1) {
          await this.setPrimaryDomain(domain.websiteId, domain.id);
        }
      } else {
        logger.info(`Domain verification failed: ${domain.name}, errors: ${verificationErrors.join('; ')}`);
      }
      
      return result;
    } catch (error) {
      logger.error('Error verifying domain:', error);
      throw error;
    }
  },
  
  /**
   * Check domain availability
   * @param {string} name - Domain name
   * @returns {Promise<Object>} - Availability result
   */
  async checkDomainAvailability(name) {
    try {
      // In a real implementation, this would call an external API to check domain availability
      // For now, we'll just check our local store
      const existingDomain = await this.getDomainByName(name);
      
      return {
        name,
        available: !existingDomain,
        reason: existingDomain ? 'Domain is already in use' : null
      };
    } catch (error) {
      logger.error('Error checking domain availability:', error);
      throw error;
    }
  }
};

module.exports = domainService;