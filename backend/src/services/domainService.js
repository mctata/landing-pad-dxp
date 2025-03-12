const logger = require('../utils/logger');
const { Domain, Website } = require('../models');
const { Op, transaction } = require('sequelize');
const { sequelize } = require('../config/database');
const axios = require('axios');
const dns = require('dns').promises;

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
            attributes: ['id', 'name', 'slug', 'publicUrl']
          }
        ]
      });
      
      if (!domain) {
        throw new Error('Domain not found');
      }
      
      // Log the verification attempt
      logger.info(`Verifying domain: ${domain.name} for website ${domain.websiteId}`);
      
      // Update status to in_progress
      await domain.update({
        verificationStatus: 'in_progress',
        status: 'pending'
      });
      
      // Verification will involve:
      // 1. DNS record checks (TXT, CNAME, A records)
      // 2. HTTP verification (checking if the domain points to our servers)
      // 3. SSL verification (optional)
      
      let dnsVerified = false;
      let httpVerified = false;
      let sslVerified = false;
      let verificationErrors = [];
      let dnsRecords = [];
      
      // Check if we have expected DNS records defined
      const expectedDnsRecords = domain.dnsRecords || [];
      
      // If no DNS records are defined (possible for new setup), generate expected records
      if (expectedDnsRecords.length === 0) {
        // Generate expected records
        const records = await this.generateExpectedDnsRecords(domain);
        expectedDnsRecords.push(...records);
        
        // Save the generated records
        await domain.update({ dnsRecords: expectedDnsRecords });
      }
      
      // 1. DNS record verification
      try {
        logger.info(`Performing DNS verification for ${domain.name}`);
        
        // For each expected record, check if it's configured correctly
        const dnsCheckResults = await Promise.allSettled(
          expectedDnsRecords.map(async (record) => {
            return await this.verifyDnsRecord(domain.name, record);
          })
        );
        
        // Process DNS check results
        const dnsCheckErrors = [];
        let passedChecks = 0;
        
        dnsCheckResults.forEach((result, index) => {
          const recordType = expectedDnsRecords[index].type;
          
          if (result.status === 'fulfilled' && result.value.verified) {
            passedChecks++;
            logger.info(`DNS record verified: ${recordType} for ${domain.name}`);
          } else {
            const error = result.status === 'fulfilled' 
              ? result.value.error 
              : result.reason.message;
            
            dnsCheckErrors.push(`${recordType} record check failed: ${error}`);
            logger.warn(`DNS record verification failed: ${recordType} for ${domain.name}: ${error}`);
          }
        });
        
        // DNS is verified if all critical records pass
        dnsVerified = passedChecks >= expectedDnsRecords.length;
        
        if (!dnsVerified) {
          verificationErrors.push(...dnsCheckErrors);
        }
      } catch (dnsError) {
        logger.error(`DNS verification error for ${domain.name}:`, dnsError);
        verificationErrors.push(`DNS check error: ${dnsError.message}`);
      }
      
      // 2. HTTP verification (only if DNS verification passed)
      if (dnsVerified) {
        try {
          logger.info(`Performing HTTP verification for ${domain.name}`);
          
          // Check if the domain points to our servers by making an HTTP request
          const httpCheckResult = await this.verifyHttpEndpoint(domain.name);
          
          httpVerified = httpCheckResult.verified;
          
          if (!httpVerified) {
            verificationErrors.push(`HTTP verification failed: ${httpCheckResult.error}`);
            logger.warn(`HTTP verification failed for ${domain.name}: ${httpCheckResult.error}`);
          } else {
            logger.info(`HTTP verification successful for ${domain.name}`);
          }
        } catch (httpError) {
          logger.error(`HTTP verification error for ${domain.name}:`, httpError);
          verificationErrors.push(`HTTP check error: ${httpError.message}`);
        }
      }
      
      // 3. SSL verification (optional enhancement)
      if (dnsVerified && httpVerified) {
        try {
          logger.info(`Performing SSL verification for ${domain.name}`);
          
          // Check if SSL certificate exists and is valid
          const sslCheckResult = await this.verifySslCertificate(domain.name);
          
          sslVerified = sslCheckResult.verified;
          
          if (!sslVerified) {
            // SSL is not considered critical, just log it
            logger.warn(`SSL verification note for ${domain.name}: ${sslCheckResult.error}`);
          } else {
            logger.info(`SSL verification successful for ${domain.name}`);
          }
        } catch (sslError) {
          logger.warn(`SSL verification warning for ${domain.name}:`, sslError);
          // SSL errors are not critical
        }
      }
      
      // If DNS verification passed and we have a Vercel API token, 
      // tell Vercel about the domain to set up hosting
      if (dnsVerified && process.env.VERCEL_API_TOKEN) {
        try {
          await this.configureVercelDomain(domain);
        } catch (vercelError) {
          logger.error(`Failed to configure Vercel for domain ${domain.name}:`, vercelError);
          verificationErrors.push(`Hosting provider configuration error: ${vercelError.message}`);
        }
      }
      
      // Determine overall verification status
      const success = dnsVerified && httpVerified;
      
      // Update domain with verification results
      const result = await domain.update({
        verificationStatus: success ? 'verified' : 'failed',
        status: success ? 'active' : 'error',
        lastVerifiedAt: success ? new Date() : null,
        sslStatus: sslVerified ? 'valid' : 'pending',
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
   * Generate expected DNS records for a domain
   * @param {Object} domain - Domain object
   * @returns {Promise<Array>} - Array of expected DNS records
   */
  async generateExpectedDnsRecords(domain) {
    try {
      // Default records that should be set up
      const records = [
        {
          type: 'CNAME',
          name: domain.name,
          value: 'cname.vercel-dns.com',
          purpose: 'Primary domain record'
        }
      ];
      
      // Add TXT record for verification
      const verificationToken = this.generateDomainVerificationToken(domain.name, domain.id);
      records.push({
        type: 'TXT',
        name: `_landingpad-verification.${domain.name}`,
        value: verificationToken,
        purpose: 'Domain ownership verification'
      });
      
      // If this is a apex/root domain, suggest A records as well
      if (!domain.name.includes('.') || domain.name.split('.').length === 2) {
        records.push({
          type: 'A',
          name: domain.name,
          value: '76.76.21.21',
          purpose: 'Apex domain record'
        });
      }
      
      return records;
    } catch (error) {
      logger.error(`Error generating expected DNS records for ${domain.name}:`, error);
      throw error;
    }
  },
  
  /**
   * Generate a domain verification token
   * @param {string} domainName - Domain name
   * @param {string} domainId - Domain ID
   * @returns {string} - Verification token
   */
  generateDomainVerificationToken(domainName, domainId) {
    // In a real implementation, this would generate a secure, random token
    // For this implementation, we'll use a predictable hash of the domain and ID
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256')
      .update(`${domainName}-${domainId}-${process.env.JWT_SECRET || 'default-secret'}`)
      .digest('hex');
      
    return `landingpad-verify=${hash.substring(0, 24)}`;
  },
  
  /**
   * Verify a DNS record
   * @param {string} domainName - Domain name
   * @param {Object} record - DNS record to verify
   * @returns {Promise<Object>} - Verification result
   */
  async verifyDnsRecord(domainName, record) {
    try {
      const recordType = record.type;
      const expectedValue = record.value;
      
      // Prepare the hostname to check based on record type
      let hostname = domainName;
      
      // For TXT records with a specific name, use that
      if (recordType === 'TXT' && record.name.startsWith('_')) {
        hostname = record.name;
      }
      
      // For CNAME checks, we ensure we're checking the correct subdomain
      if (recordType === 'CNAME' && record.name !== domainName) {
        hostname = record.name;
      }
      
      let resolved;
      
      try {
        // Resolve based on record type
        switch (recordType) {
          case 'A':
            resolved = await dns.resolve4(hostname);
            break;
          case 'AAAA':
            resolved = await dns.resolve6(hostname);
            break;
          case 'CNAME':
            resolved = await dns.resolveCname(hostname);
            break;
          case 'TXT':
            resolved = await dns.resolveTxt(hostname);
            // TXT records come back as arrays of string arrays, flatten them
            resolved = resolved.map(txtRecord => txtRecord.join('')).flat();
            break;
          case 'MX':
            resolved = await dns.resolveMx(hostname);
            resolved = resolved.map(mx => mx.exchange);
            break;
          default:
            throw new Error(`Unsupported record type: ${recordType}`);
        }
      } catch (dnsError) {
        if (dnsError.code === 'ENOTFOUND' || dnsError.code === 'ENODATA') {
          return {
            verified: false,
            error: `No ${recordType} record found for ${hostname}`
          };
        }
        throw dnsError;
      }
      
      if (!resolved || resolved.length === 0) {
        return {
          verified: false,
          error: `No ${recordType} record found for ${hostname}`
        };
      }
      
      // Check if the expected value is in the resolved values
      const valueMatch = Array.isArray(resolved) 
        ? resolved.some(value => 
            typeof value === 'string' && 
            (value.toLowerCase() === expectedValue.toLowerCase() || value.includes(expectedValue))
          )
        : resolved === expectedValue;
      
      if (!valueMatch) {
        return {
          verified: false,
          error: `${recordType} record for ${hostname} does not match expected value. Found: ${JSON.stringify(resolved)}, Expected: ${expectedValue}`
        };
      }
      
      return {
        verified: true,
        actualValues: resolved
      };
    } catch (error) {
      logger.error(`Error verifying DNS record for ${domainName}:`, error);
      return {
        verified: false,
        error: error.message
      };
    }
  },
  
  /**
   * Verify HTTP endpoint for a domain
   * @param {string} domainName - Domain name
   * @returns {Promise<Object>} - Verification result
   */
  async verifyHttpEndpoint(domainName) {
    try {
      // First check HTTP (will typically redirect to HTTPS)
      const url = `http://${domainName}`;
      
      // Attempt to fetch the domain
      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        maxRedirects: 5, // Allow redirects
        validateStatus: status => status >= 200 && status < 500 // Accept any non-server error
      });
      
      // Check for expected headers or content that would verify it's our server
      const isOurServer = 
        response.headers['server'] === 'Vercel' || 
        response.headers['x-powered-by']?.includes('Landing Pad');
      
      // For development/testing environments, accept any successful response
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev || isOurServer) {
        return {
          verified: true,
          statusCode: response.status,
          headers: response.headers
        };
      }
      
      return {
        verified: false,
        error: `Domain does not point to our servers. Check your DNS configuration.`,
        statusCode: response.status
      };
    } catch (error) {
      // For dev/test environments, simulate success even on error
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`Development mode: Simulating HTTP verification success for ${domainName} despite error: ${error.message}`);
        return { verified: true, simulated: true };
      }
      
      return {
        verified: false,
        error: `Could not connect to domain: ${error.message}`
      };
    }
  },
  
  /**
   * Verify SSL certificate for a domain
   * @param {string} domainName - Domain name
   * @returns {Promise<Object>} - Verification result
   */
  async verifySslCertificate(domainName) {
    try {
      // We'll use a simple HTTPS request to check if SSL is working
      const url = `https://${domainName}`;
      
      try {
        // Attempt to fetch the domain with HTTPS
        const response = await axios.get(url, {
          timeout: 10000, // 10 second timeout
          maxRedirects: 5, // Allow redirects
          validateStatus: status => status >= 200 && status < 500 // Accept any non-server error
        });
        
        return {
          verified: true,
          statusCode: response.status
        };
      } catch (httpsError) {
        // Check if the error is related to the certificate
        if (httpsError.code === 'ECONNRESET' || 
            httpsError.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
            httpsError.message.includes('certificate')) {
          return {
            verified: false,
            error: `SSL certificate issue: ${httpsError.message}`
          };
        }
        
        // Other errors might not be SSL-related
        return {
          verified: false,
          error: `HTTPS connection failed: ${httpsError.message}`
        };
      }
    } catch (error) {
      logger.error(`Error verifying SSL for ${domainName}:`, error);
      
      // For development, simulate success
      if (process.env.NODE_ENV === 'development') {
        return { verified: true, simulated: true };
      }
      
      return {
        verified: false,
        error: error.message
      };
    }
  },
  
  /**
   * Configure Vercel for a domain
   * @param {Object} domain - Domain object
   * @returns {Promise<Object>} - Configuration result
   */
  async configureVercelDomain(domain) {
    try {
      const vercelApiToken = process.env.VERCEL_API_TOKEN;
      
      if (!vercelApiToken) {
        throw new Error('VERCEL_API_TOKEN not configured');
      }
      
      // Call Vercel API to add the domain to a project
      const vercelProjectId = process.env.VERCEL_PROJECT_ID;
      const vercelApiUrl = `https://api.vercel.com/v9/projects/${vercelProjectId}/domains`;
      
      const response = await axios.post(
        vercelApiUrl,
        {
          name: domain.name,
          gitBranch: 'main'
        },
        {
          headers: {
            'Authorization': `Bearer ${vercelApiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Store Vercel domain verification information if returned
      if (response.data && response.data.verification) {
        // Get current DNS records
        let dnsRecords = domain.dnsRecords || [];
        
        // Add any verification records that Vercel requires
        if (response.data.verification.type === 'TXT') {
          const txtRecord = {
            type: 'TXT',
            name: response.data.verification.domain,
            value: response.data.verification.value,
            purpose: 'Vercel domain verification'
          };
          
          // Check if this record already exists
          const recordExists = dnsRecords.some(record => 
            record.type === txtRecord.type && 
            record.name === txtRecord.name && 
            record.value === txtRecord.value
          );
          
          if (!recordExists) {
            dnsRecords.push(txtRecord);
          }
        }
        
        // Update domain with Vercel information
        await domain.update({
          vercelDomainId: response.data.id,
          dnsRecords
        });
      }
      
      return {
        configured: true,
        vercelDomainId: response.data.id
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // In development, just log and simulate success
        logger.warn(`Development mode: Simulating Vercel configuration success for ${domain.name} despite error: ${error.message}`);
        return { configured: true, simulated: true };
      }
      
      logger.error(`Error configuring Vercel for domain ${domain.name}:`, error);
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