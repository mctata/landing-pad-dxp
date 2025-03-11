const domainService = require('../../src/services/domainService');
const logger = require('../../src/utils/logger');

// Mock the logger
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
    
    // Reset domains (need to access the module's private variable)
    // This is a bit hacky but necessary for in-memory store testing
    const domainsArray = domainService.createDomain.__self?.domains || [];
    domainsArray.length = 0;
  });
  
  describe('createDomain', () => {
    it('should create a domain with required fields', async () => {
      const data = {
        name: 'test-domain.com',
        websiteId: 'website-123',
        userId: 'user-123'
      };
      
      const domain = await domainService.createDomain(data);
      
      expect(domain).toMatchObject({
        name: 'test-domain.com',
        websiteId: 'website-123',
        userId: 'user-123',
        status: 'pending',
        verificationStatus: 'pending',
        isPrimary: false
      });
      expect(domain.id).toBeDefined();
      expect(domain.createdAt).toBeDefined();
      expect(domain.updatedAt).toBeDefined();
      expect(domain.dnsRecords).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain created'));
    });
    
    it('should use provided ID if specified', async () => {
      const data = {
        id: 'custom-domain-id',
        name: 'test-domain.com',
        websiteId: 'website-123',
        userId: 'user-123'
      };
      
      const domain = await domainService.createDomain(data);
      
      expect(domain.id).toBe('custom-domain-id');
    });
    
    it('should use provided status and verification status if specified', async () => {
      const data = {
        name: 'test-domain.com',
        websiteId: 'website-123',
        userId: 'user-123',
        status: 'active',
        verificationStatus: 'verified',
        isPrimary: true,
        dnsRecords: [{ type: 'A', name: '@', value: '192.168.1.1' }]
      };
      
      const domain = await domainService.createDomain(data);
      
      expect(domain.status).toBe('active');
      expect(domain.verificationStatus).toBe('verified');
      expect(domain.isPrimary).toBe(true);
      expect(domain.dnsRecords).toEqual([{ type: 'A', name: '@', value: '192.168.1.1' }]);
    });
  });
  
  describe('getDomainsByWebsiteId', () => {
    beforeEach(async () => {
      // Create test domains
      await domainService.createDomain({
        id: 'domain-1',
        name: 'domain1.com',
        websiteId: 'website-123',
        userId: 'user-123'
      });
      
      await domainService.createDomain({
        id: 'domain-2',
        name: 'domain2.com',
        websiteId: 'website-123',
        userId: 'user-123'
      });
      
      // Domain for different website
      await domainService.createDomain({
        id: 'domain-3',
        name: 'domain3.com',
        websiteId: 'website-456',
        userId: 'user-123'
      });
    });
    
    it('should return domains for a website', async () => {
      const domains = await domainService.getDomainsByWebsiteId('website-123');
      
      expect(domains.length).toBe(2);
      expect(domains[0].id).toBe('domain-1');
      expect(domains[1].id).toBe('domain-2');
    });
    
    it('should return empty array if no domains found', async () => {
      const domains = await domainService.getDomainsByWebsiteId('non-existent-website');
      
      expect(domains.length).toBe(0);
    });
  });
  
  describe('getDomainById', () => {
    beforeEach(async () => {
      await domainService.createDomain({
        id: 'domain-1',
        name: 'domain1.com',
        websiteId: 'website-123',
        userId: 'user-123'
      });
    });
    
    it('should return a domain by ID', async () => {
      const domain = await domainService.getDomainById('domain-1');
      
      expect(domain).toBeDefined();
      expect(domain.id).toBe('domain-1');
      expect(domain.name).toBe('domain1.com');
    });
    
    it('should return null if domain not found', async () => {
      const domain = await domainService.getDomainById('non-existent-id');
      
      expect(domain).toBeNull();
    });
  });
  
  describe('getDomainByName', () => {
    beforeEach(async () => {
      await domainService.createDomain({
        id: 'domain-1',
        name: 'example.com',
        websiteId: 'website-123',
        userId: 'user-123'
      });
    });
    
    it('should return a domain by name', async () => {
      const domain = await domainService.getDomainByName('example.com');
      
      expect(domain).toBeDefined();
      expect(domain.id).toBe('domain-1');
      expect(domain.name).toBe('example.com');
    });
    
    it('should be case insensitive', async () => {
      const domain = await domainService.getDomainByName('EXAMPLE.COM');
      
      expect(domain).toBeDefined();
      expect(domain.id).toBe('domain-1');
    });
    
    it('should return null if domain not found', async () => {
      const domain = await domainService.getDomainByName('non-existent-domain.com');
      
      expect(domain).toBeNull();
    });
  });
  
  describe('updateDomain', () => {
    beforeEach(async () => {
      await domainService.createDomain({
        id: 'domain-1',
        name: 'domain1.com',
        websiteId: 'website-123',
        userId: 'user-123',
        status: 'pending'
      });
    });
    
    it('should update a domain', async () => {
      const updates = {
        status: 'active',
        verificationStatus: 'verified',
        dnsRecords: [{ type: 'A', name: '@', value: '10.0.0.1' }]
      };
      
      const updatedDomain = await domainService.updateDomain('domain-1', updates);
      
      expect(updatedDomain.status).toBe('active');
      expect(updatedDomain.verificationStatus).toBe('verified');
      expect(updatedDomain.dnsRecords).toEqual([{ type: 'A', name: '@', value: '10.0.0.1' }]);
      expect(updatedDomain.name).toBe('domain1.com'); // Original data preserved
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain updated'));
    });
    
    it('should update the updatedAt timestamp', async () => {
      const originalDomain = await domainService.getDomainById('domain-1');
      const originalTimestamp = originalDomain.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updates = { status: 'active' };
      const updatedDomain = await domainService.updateDomain('domain-1', updates);
      
      expect(updatedDomain.updatedAt).not.toBe(originalTimestamp);
    });
    
    it('should return null if domain not found', async () => {
      const updates = { status: 'active' };
      
      const result = await domainService.updateDomain('non-existent-id', updates);
      
      expect(result).toBeNull();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteDomain', () => {
    beforeEach(async () => {
      await domainService.createDomain({
        id: 'domain-1',
        name: 'domain1.com',
        websiteId: 'website-123',
        userId: 'user-123'
      });
    });
    
    it('should delete a domain by ID', async () => {
      const result = await domainService.deleteDomain('domain-1');
      
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain deleted'));
      
      // Verify domain is removed
      const domain = await domainService.getDomainById('domain-1');
      expect(domain).toBeNull();
    });
    
    it('should return false if domain not found', async () => {
      const result = await domainService.deleteDomain('non-existent-id');
      
      expect(result).toBe(false);
      expect(logger.info).not.toHaveBeenCalled();
    });
  });
  
  describe('setPrimaryDomain', () => {
    beforeEach(async () => {
      // Create multiple domains for the same website
      await domainService.createDomain({
        id: 'domain-1',
        name: 'domain1.com',
        websiteId: 'website-123',
        userId: 'user-123',
        isPrimary: true
      });
      
      await domainService.createDomain({
        id: 'domain-2',
        name: 'domain2.com',
        websiteId: 'website-123',
        userId: 'user-123',
        isPrimary: false
      });
      
      await domainService.createDomain({
        id: 'domain-3',
        name: 'domain3.com',
        websiteId: 'website-123',
        userId: 'user-123',
        isPrimary: false
      });
    });
    
    it('should set a domain as primary and unset others', async () => {
      // Set domain-2 as primary
      const result = await domainService.setPrimaryDomain('website-123', 'domain-2');
      
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain set as primary'));
      
      // Verify domain-2 is now primary
      const domain2 = await domainService.getDomainById('domain-2');
      expect(domain2.isPrimary).toBe(true);
      
      // Verify other domains are not primary
      const domain1 = await domainService.getDomainById('domain-1');
      const domain3 = await domainService.getDomainById('domain-3');
      expect(domain1.isPrimary).toBe(false);
      expect(domain3.isPrimary).toBe(false);
    });
    
    it('should return false if domain not found', async () => {
      const result = await domainService.setPrimaryDomain('website-123', 'non-existent-id');
      
      expect(result).toBe(false);
    });
    
    it('should return false if website ID does not match', async () => {
      const result = await domainService.setPrimaryDomain('website-456', 'domain-1');
      
      expect(result).toBe(false);
    });
  });
  
  describe('verifyDomain', () => {
    beforeEach(async () => {
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Mock for 80% success rate
      
      await domainService.createDomain({
        id: 'domain-1',
        name: 'domain1.com',
        websiteId: 'website-123',
        userId: 'user-123',
        verificationStatus: 'pending'
      });
    });
    
    afterEach(() => {
      jest.spyOn(global.Math, 'random').mockRestore();
    });
    
    it('should verify a domain successfully', async () => {
      // Mock success (random > 0.2)
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
      
      const result = await domainService.verifyDomain('domain-1');
      
      expect(result.verificationStatus).toBe('verified');
      expect(result.status).toBe('active');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain verification successful'));
      
      // Verify domain is updated in storage
      const domain = await domainService.getDomainById('domain-1');
      expect(domain.verificationStatus).toBe('verified');
      expect(domain.status).toBe('active');
    });
    
    it('should handle verification failure', async () => {
      // Mock failure (random <= 0.2)
      jest.spyOn(global.Math, 'random').mockReturnValue(0.1);
      
      const result = await domainService.verifyDomain('domain-1');
      
      expect(result.verificationStatus).toBe('failed');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Domain verification failed'));
      
      // Verify domain is updated in storage
      const domain = await domainService.getDomainById('domain-1');
      expect(domain.verificationStatus).toBe('failed');
    });
    
    it('should throw an error if domain not found', async () => {
      await expect(domainService.verifyDomain('non-existent-id'))
        .rejects
        .toThrow('Domain not found');
    });
  });
  
  describe('checkDomainAvailability', () => {
    beforeEach(async () => {
      await domainService.createDomain({
        id: 'domain-1',
        name: 'taken-domain.com',
        websiteId: 'website-123',
        userId: 'user-123'
      });
    });
    
    it('should return available=true for available domain', async () => {
      const result = await domainService.checkDomainAvailability('available-domain.com');
      
      expect(result.name).toBe('available-domain.com');
      expect(result.available).toBe(true);
      expect(result.reason).toBeNull();
    });
    
    it('should return available=false for taken domain', async () => {
      const result = await domainService.checkDomainAvailability('taken-domain.com');
      
      expect(result.name).toBe('taken-domain.com');
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Domain is already in use');
    });
    
    it('should be case insensitive', async () => {
      const result = await domainService.checkDomainAvailability('TAKEN-DOMAIN.COM');
      
      expect(result.available).toBe(false);
    });
  });
});