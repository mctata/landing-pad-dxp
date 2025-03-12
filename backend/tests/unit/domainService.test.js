const domainService = require('../../src/services/domainService');
const { Domain } = require('../../src/models');
const logger = require('../../src/utils/logger');

// Mock the models and logger
jest.mock('../../src/models', () => ({
  Domain: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Domain Service', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createDomain', () => {
    it('should create a domain with required fields', async () => {
      // Mock data
      const domainData = {
        name: 'example.com',
        websiteId: 'website-123',
        userId: 'user-123'
      };

      // Mock create response
      const mockDomain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123',
        userId: 'user-123',
        status: 'pending',
        verificationStatus: 'pending',
        isPrimary: false,
        dnsRecords: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      Domain.create.mockResolvedValue(mockDomain);

      // Call the service method
      const result = await domainService.createDomain(domainData);

      // Assertions
      expect(Domain.create).toHaveBeenCalledWith({
        name: 'example.com',
        websiteId: 'website-123',
        userId: 'user-123',
        status: 'pending',
        verificationStatus: 'pending',
        isPrimary: false,
        dnsRecords: []
      });

      expect(result).toEqual(mockDomain);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain created'));
    });

    it('should use provided status and verification status if specified', async () => {
      // Mock data
      const domainData = {
        name: 'example.com',
        websiteId: 'website-123',
        userId: 'user-123',
        status: 'active',
        verificationStatus: 'verified',
        isPrimary: true,
        dnsRecords: [{ type: 'A', name: '@', value: '192.168.1.1' }]
      };

      // Mock create response
      const mockDomain = {
        id: 'domain-123',
        ...domainData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      Domain.create.mockResolvedValue(mockDomain);

      // Call the service method
      const result = await domainService.createDomain(domainData);

      // Assertions
      expect(Domain.create).toHaveBeenCalledWith({
        name: 'example.com',
        websiteId: 'website-123',
        userId: 'user-123',
        status: 'active',
        verificationStatus: 'verified',
        isPrimary: true,
        dnsRecords: [{ type: 'A', name: '@', value: '192.168.1.1' }]
      });

      expect(result).toEqual(mockDomain);
    });

    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Domain.create.mockRejectedValue(mockError);

      // Call the service method and expect it to throw
      await expect(domainService.createDomain({
        name: 'example.com',
        websiteId: 'website-123',
        userId: 'user-123'
      })).rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error creating domain:', mockError);
    });
  });

  describe('getDomainsByWebsiteId', () => {
    it('should return domains for a website', async () => {
      // Mock data
      const websiteId = 'website-123';
      const mockDomains = [
        {
          id: 'domain-1',
          name: 'domain1.com',
          websiteId
        },
        {
          id: 'domain-2',
          name: 'domain2.com',
          websiteId
        }
      ];

      // Mock findAll response
      Domain.findAll.mockResolvedValue(mockDomains);

      // Call the service method
      const result = await domainService.getDomainsByWebsiteId(websiteId);

      // Assertions
      expect(Domain.findAll).toHaveBeenCalledWith({
        where: { websiteId }
      });

      expect(result).toEqual(mockDomains);
    });

    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Domain.findAll.mockRejectedValue(mockError);

      // Call the service method and expect it to throw
      await expect(domainService.getDomainsByWebsiteId('website-123'))
        .rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error fetching domains by website ID:', mockError);
    });
  });

  describe('getDomainById', () => {
    it('should return a domain by ID', async () => {
      // Mock data
      const domainId = 'domain-123';
      const mockDomain = {
        id: domainId,
        name: 'example.com',
        websiteId: 'website-123'
      };

      // Mock findByPk response
      Domain.findByPk.mockResolvedValue(mockDomain);

      // Call the service method
      const result = await domainService.getDomainById(domainId);

      // Assertions
      expect(Domain.findByPk).toHaveBeenCalledWith(domainId);
      expect(result).toEqual(mockDomain);
    });

    it('should return null if domain not found', async () => {
      // Mock findByPk response for not found
      Domain.findByPk.mockResolvedValue(null);

      // Call the service method
      const result = await domainService.getDomainById('non-existent-id');

      // Assertions
      expect(result).toBeNull();
    });

    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Domain.findByPk.mockRejectedValue(mockError);

      // Call the service method and expect it to throw
      await expect(domainService.getDomainById('domain-123'))
        .rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error fetching domain by ID:', mockError);
    });
  });

  describe('getDomainByName', () => {
    it('should return a domain by name', async () => {
      // Mock data
      const domainName = 'example.com';
      const mockDomain = {
        id: 'domain-123',
        name: domainName,
        websiteId: 'website-123'
      };

      // Mock findOne response
      Domain.findOne.mockResolvedValue(mockDomain);

      // Call the service method
      const result = await domainService.getDomainByName(domainName);

      // Assertions
      expect(Domain.findOne).toHaveBeenCalledWith({
        where: {
          name: domainName.toLowerCase()
        }
      });
      expect(result).toEqual(mockDomain);
    });

    it('should be case insensitive', async () => {
      // Mock data
      const mockDomain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123'
      };

      // Mock findOne response
      Domain.findOne.mockResolvedValue(mockDomain);

      // Call the service method with uppercase
      const result = await domainService.getDomainByName('EXAMPLE.COM');

      // Assertions
      expect(Domain.findOne).toHaveBeenCalledWith({
        where: {
          name: 'example.com' // Should be converted to lowercase
        }
      });
      expect(result).toEqual(mockDomain);
    });

    it('should return null if domain not found', async () => {
      // Mock findOne response for not found
      Domain.findOne.mockResolvedValue(null);

      // Call the service method
      const result = await domainService.getDomainByName('non-existent-domain.com');

      // Assertions
      expect(result).toBeNull();
    });

    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Domain.findOne.mockRejectedValue(mockError);

      // Call the service method and expect it to throw
      await expect(domainService.getDomainByName('example.com'))
        .rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error fetching domain by name:', mockError);
    });
  });

  describe('updateDomain', () => {
    it('should update a domain', async () => {
      // Mock data
      const domainId = 'domain-123';
      const updates = {
        status: 'active',
        verificationStatus: 'verified',
        dnsRecords: [{ type: 'A', name: '@', value: '10.0.0.1' }]
      };

      // Mock findByPk response
      const mockDomain = {
        id: domainId,
        name: 'example.com',
        websiteId: 'website-123',
        status: 'pending',
        verificationStatus: 'pending',
        dnsRecords: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Domain.findByPk.mockResolvedValue(mockDomain);

      // Call the service method
      const result = await domainService.updateDomain(domainId, updates);

      // Assertions
      expect(Domain.findByPk).toHaveBeenCalledWith(domainId);

      // Check that the domain object was updated
      expect(mockDomain.status).toBe('active');
      expect(mockDomain.verificationStatus).toBe('verified');
      expect(mockDomain.dnsRecords).toEqual([{ type: 'A', name: '@', value: '10.0.0.1' }]);

      expect(mockDomain.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain updated'));
    });

    it('should return null if domain not found', async () => {
      // Mock findByPk response for not found
      Domain.findByPk.mockResolvedValue(null);

      // Call the service method
      const result = await domainService.updateDomain('non-existent-id', { status: 'active' });

      // Assertions
      expect(result).toBeNull();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Domain.findByPk.mockRejectedValue(mockError);

      // Call the service method and expect it to throw
      await expect(domainService.updateDomain('domain-123', { status: 'active' }))
        .rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error updating domain:', mockError);
    });
  });

  describe('deleteDomain', () => {
    it('should delete a domain by ID', async () => {
      // Mock data
      const domainId = 'domain-123';

      // Mock destroy response
      Domain.destroy.mockResolvedValue(1); // 1 row affected

      // Call the service method
      const result = await domainService.deleteDomain(domainId);

      // Assertions
      expect(Domain.destroy).toHaveBeenCalledWith({
        where: { id: domainId }
      });

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain deleted'));
    });

    it('should return false if domain not found', async () => {
      // Mock destroy response for not found
      Domain.destroy.mockResolvedValue(0); // 0 rows affected

      // Call the service method
      const result = await domainService.deleteDomain('non-existent-id');

      // Assertions
      expect(result).toBe(false);
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Domain.destroy.mockRejectedValue(mockError);

      // Call the service method and expect it to throw
      await expect(domainService.deleteDomain('domain-123'))
        .rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error deleting domain:', mockError);
    });
  });

  describe('setPrimaryDomain', () => {
    it('should set a domain as primary and unset others', async () => {
      // Mock data
      const websiteId = 'website-123';
      const domainId = 'domain-2';

      // Mock findByPk response for the domain to be set as primary
      const mockDomain = {
        id: domainId,
        websiteId,
        isPrimary: false,
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock findAll response for all domains of the website
      const mockAllDomains = [
        {
          id: 'domain-1',
          websiteId,
          isPrimary: true,
          save: jest.fn().mockResolvedValue(true)
        },
        mockDomain,
        {
          id: 'domain-3',
          websiteId,
          isPrimary: false,
          save: jest.fn().mockResolvedValue(true)
        }
      ];

      Domain.findByPk.mockResolvedValue(mockDomain);
      Domain.findAll.mockResolvedValue(mockAllDomains);

      // Call the service method
      const result = await domainService.setPrimaryDomain(websiteId, domainId);

      // Assertions
      expect(Domain.findByPk).toHaveBeenCalledWith(domainId);
      expect(Domain.findAll).toHaveBeenCalledWith({
        where: { websiteId }
      });

      // Check that the primary domain was set
      expect(mockDomain.isPrimary).toBe(true);
      expect(mockDomain.save).toHaveBeenCalled();

      // Check that other domains were unset
      expect(mockAllDomains[0].isPrimary).toBe(false);
      expect(mockAllDomains[0].save).toHaveBeenCalled();
      
      // The third domain should remain unchanged
      expect(mockAllDomains[2].isPrimary).toBe(false);
      // But save should still be called
      expect(mockAllDomains[2].save).not.toHaveBeenCalled();

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain set as primary'));
    });

    it('should return false if domain not found', async () => {
      // Mock findByPk response for not found
      Domain.findByPk.mockResolvedValue(null);

      // Call the service method
      const result = await domainService.setPrimaryDomain('website-123', 'non-existent-id');

      // Assertions
      expect(result).toBe(false);
      expect(Domain.findAll).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should return false if website ID does not match', async () => {
      // Mock findByPk response for domain belonging to a different website
      const mockDomain = {
        id: 'domain-1',
        websiteId: 'website-456', // Different from the requested websiteId
        isPrimary: false
      };

      Domain.findByPk.mockResolvedValue(mockDomain);

      // Call the service method
      const result = await domainService.setPrimaryDomain('website-123', 'domain-1');

      // Assertions
      expect(result).toBe(false);
      expect(Domain.findAll).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Domain.findByPk.mockRejectedValue(mockError);

      // Call the service method and expect it to throw
      await expect(domainService.setPrimaryDomain('website-123', 'domain-1'))
        .rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error setting primary domain:', mockError);
    });
  });

  describe('verifyDomain', () => {
    beforeEach(() => {
      // Mock Math.random for predictable testing
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      jest.spyOn(global.Math, 'random').mockRestore();
    });

    it('should verify a domain successfully', async () => {
      // Mock data - success case (random > 0.2)
      const domainId = 'domain-123';
      
      // Mock findByPk response
      const mockDomain = {
        id: domainId,
        name: 'example.com',
        websiteId: 'website-123',
        status: 'pending',
        verificationStatus: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      Domain.findByPk.mockResolvedValue(mockDomain);
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Success

      // Call the service method
      const result = await domainService.verifyDomain(domainId);

      // Assertions
      expect(Domain.findByPk).toHaveBeenCalledWith(domainId);
      
      // Check domain was updated
      expect(mockDomain.verificationStatus).toBe('verified');
      expect(mockDomain.status).toBe('active');
      expect(mockDomain.save).toHaveBeenCalled();
      
      expect(result).toEqual(mockDomain);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain verification successful'));
    });

    it('should handle verification failure', async () => {
      // Mock data - failure case (random <= 0.2)
      const domainId = 'domain-123';
      
      // Mock findByPk response
      const mockDomain = {
        id: domainId,
        name: 'example.com',
        websiteId: 'website-123',
        status: 'pending',
        verificationStatus: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      Domain.findByPk.mockResolvedValue(mockDomain);
      jest.spyOn(global.Math, 'random').mockReturnValue(0.1); // Failure

      // Call the service method
      const result = await domainService.verifyDomain(domainId);

      // Assertions
      expect(Domain.findByPk).toHaveBeenCalledWith(domainId);
      
      // Check domain was updated
      expect(mockDomain.verificationStatus).toBe('failed');
      expect(mockDomain.status).toBe('pending'); // Status should remain pending on failure
      expect(mockDomain.save).toHaveBeenCalled();
      
      expect(result).toEqual(mockDomain);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain verification failed'));
    });

    it('should throw an error if domain not found', async () => {
      // Mock findByPk response for not found
      Domain.findByPk.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(domainService.verifyDomain('non-existent-id'))
        .rejects.toThrow('Domain not found');

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Domain not found'));
    });

    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Domain.findByPk.mockRejectedValue(mockError);

      // Call the service method and expect it to throw
      await expect(domainService.verifyDomain('domain-123'))
        .rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error verifying domain:', mockError);
    });
  });

  describe('checkDomainAvailability', () => {
    it('should return available=true for available domain', async () => {
      // Mock findOne response for not found
      Domain.findOne.mockResolvedValue(null);

      // Call the service method
      const result = await domainService.checkDomainAvailability('available-domain.com');

      // Assertions
      expect(Domain.findOne).toHaveBeenCalledWith({
        where: {
          name: 'available-domain.com'
        }
      });
      
      expect(result).toEqual({
        name: 'available-domain.com',
        available: true,
        reason: null
      });
    });

    it('should return available=false for taken domain', async () => {
      // Mock data for domain already exists
      const mockDomain = {
        id: 'domain-123',
        name: 'taken-domain.com',
        websiteId: 'website-123'
      };

      // Mock findOne response
      Domain.findOne.mockResolvedValue(mockDomain);

      // Call the service method
      const result = await domainService.checkDomainAvailability('taken-domain.com');

      // Assertions
      expect(result).toEqual({
        name: 'taken-domain.com',
        available: false,
        reason: 'Domain is already in use'
      });
    });

    it('should be case insensitive', async () => {
      // Mock data for domain already exists
      const mockDomain = {
        id: 'domain-123',
        name: 'taken-domain.com',
        websiteId: 'website-123'
      };

      // Mock findOne response
      Domain.findOne.mockResolvedValue(mockDomain);

      // Call the service method with uppercase
      const result = await domainService.checkDomainAvailability('TAKEN-DOMAIN.COM');

      // Assertions
      expect(Domain.findOne).toHaveBeenCalledWith({
        where: {
          name: 'taken-domain.com' // Should be converted to lowercase
        }
      });
      
      expect(result.available).toBe(false);
    });

    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Domain.findOne.mockRejectedValue(mockError);

      // Call the service method and expect it to throw
      await expect(domainService.checkDomainAvailability('example.com'))
        .rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error checking domain availability:', mockError);
    });
  });
});