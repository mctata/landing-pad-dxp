const domainService = require('../../src/services/domainService');
const { Domain } = require('../../src/models');
const logger = require('../../src/utils/logger');
const axios = require('axios');
const dns = require('dns').promises;

// Mock the models, axios, and dns
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

jest.mock('axios');

jest.mock('dns', () => ({
  promises: {
    resolveTxt: jest.fn(),
    resolve4: jest.fn(),
    resolve: jest.fn(),
    resolveCname: jest.fn()
  }
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Domain Service - Enhanced Features', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('verifyDnsRecord', () => {
    it('should verify A record successfully', async () => {
      // Mock data
      const domain = 'example.com';
      const recordType = 'A';
      const expectedValue = '192.0.2.1';
      
      // Mock dns response
      dns.resolve4.mockResolvedValue(['192.0.2.1']);
      
      // Call the service method
      const result = await domainService.verifyDnsRecord(domain, recordType, expectedValue);
      
      // Assertions
      expect(dns.resolve4).toHaveBeenCalledWith(domain);
      expect(result).toEqual({
        verified: true,
        actualValue: ['192.0.2.1'],
        expectedValue: '192.0.2.1',
        message: 'DNS record verified successfully'
      });
    });
    
    it('should verify TXT record successfully', async () => {
      // Mock data
      const domain = 'example.com';
      const recordType = 'TXT';
      const expectedValue = 'verify-domain=abc123';
      
      // Mock dns response - TXT records come as arrays of arrays
      dns.resolveTxt.mockResolvedValue([['verify-domain=abc123']]);
      
      // Call the service method
      const result = await domainService.verifyDnsRecord(domain, recordType, expectedValue);
      
      // Assertions
      expect(dns.resolveTxt).toHaveBeenCalledWith(domain);
      expect(result).toEqual({
        verified: true,
        actualValue: ['verify-domain=abc123'],
        expectedValue: 'verify-domain=abc123',
        message: 'DNS record verified successfully'
      });
    });
    
    it('should verify CNAME record successfully', async () => {
      // Mock data
      const domain = 'www.example.com';
      const recordType = 'CNAME';
      const expectedValue = 'example.com';
      
      // Mock dns response
      dns.resolveCname.mockResolvedValue(['example.com']);
      
      // Call the service method
      const result = await domainService.verifyDnsRecord(domain, recordType, expectedValue);
      
      // Assertions
      expect(dns.resolveCname).toHaveBeenCalledWith(domain);
      expect(result).toEqual({
        verified: true,
        actualValue: ['example.com'],
        expectedValue: 'example.com',
        message: 'DNS record verified successfully'
      });
    });
    
    it('should fail verification if record does not match', async () => {
      // Mock data
      const domain = 'example.com';
      const recordType = 'A';
      const expectedValue = '192.0.2.1';
      
      // Mock dns response with different value
      dns.resolve4.mockResolvedValue(['192.0.2.2']);
      
      // Call the service method
      const result = await domainService.verifyDnsRecord(domain, recordType, expectedValue);
      
      // Assertions
      expect(result).toEqual({
        verified: false,
        actualValue: ['192.0.2.2'],
        expectedValue: '192.0.2.1',
        message: 'DNS record does not match expected value'
      });
    });
    
    it('should fail verification if DNS lookup fails', async () => {
      // Mock data
      const domain = 'example.com';
      const recordType = 'A';
      const expectedValue = '192.0.2.1';
      
      // Mock dns response with error
      const dnsError = new Error('DNS lookup failed');
      dns.resolve4.mockRejectedValue(dnsError);
      
      // Call the service method
      const result = await domainService.verifyDnsRecord(domain, recordType, expectedValue);
      
      // Assertions
      expect(result).toEqual({
        verified: false,
        actualValue: null,
        expectedValue: '192.0.2.1',
        message: 'DNS lookup failed: DNS lookup failed',
        error: dnsError
      });
    });
    
    it('should throw error for unsupported record type', async () => {
      // Mock data
      const domain = 'example.com';
      const recordType = 'MX'; // Unsupported type
      const expectedValue = 'mail.example.com';
      
      // Call the service method and expect error
      await expect(domainService.verifyDnsRecord(domain, recordType, expectedValue))
        .rejects.toThrow('Unsupported DNS record type');
    });
  });
  
  describe('verifyHttpEndpoint', () => {
    it('should verify HTTP endpoint successfully', async () => {
      // Mock data
      const domain = 'example.com';
      const path = '/verify';
      const expectedContent = 'verification-token';
      
      // Mock axios response
      axios.get.mockResolvedValue({
        status: 200,
        data: 'This is a page with verification-token embedded'
      });
      
      // Call the service method
      const result = await domainService.verifyHttpEndpoint(domain, path, expectedContent);
      
      // Assertions
      expect(axios.get).toHaveBeenCalledWith(`http://${domain}${path}`, expect.any(Object));
      expect(result).toEqual({
        verified: true,
        statusCode: 200,
        message: 'HTTP verification successful'
      });
    });
    
    it('should handle domains with or without http prefix', async () => {
      // Mock data with http prefix already included
      const domain = 'http://example.com';
      const path = '/verify';
      const expectedContent = 'verification-token';
      
      // Mock axios response
      axios.get.mockResolvedValue({
        status: 200,
        data: 'This is a page with verification-token embedded'
      });
      
      // Call the service method
      const result = await domainService.verifyHttpEndpoint(domain, path, expectedContent);
      
      // Assertions - should not double-add http://
      expect(axios.get).toHaveBeenCalledWith('http://example.com/verify', expect.any(Object));
      expect(result.verified).toBe(true);
    });
    
    it('should fail verification if content not found', async () => {
      // Mock data
      const domain = 'example.com';
      const path = '/verify';
      const expectedContent = 'verification-token';
      
      // Mock axios response without the token
      axios.get.mockResolvedValue({
        status: 200,
        data: 'This is a page without the token'
      });
      
      // Call the service method
      const result = await domainService.verifyHttpEndpoint(domain, path, expectedContent);
      
      // Assertions
      expect(result).toEqual({
        verified: false,
        statusCode: 200,
        message: 'Expected content not found on the page'
      });
    });
    
    it('should fail verification if HTTP request fails', async () => {
      // Mock data
      const domain = 'example.com';
      const path = '/verify';
      const expectedContent = 'verification-token';
      
      // Mock axios response with error
      const httpError = new Error('Connection refused');
      httpError.code = 'ECONNREFUSED';
      axios.get.mockRejectedValue(httpError);
      
      // Call the service method
      const result = await domainService.verifyHttpEndpoint(domain, path, expectedContent);
      
      // Assertions
      expect(result).toEqual({
        verified: false,
        statusCode: null,
        message: 'HTTP request failed: Connection refused',
        error: httpError
      });
    });
    
    it('should fail verification on non-200 status code', async () => {
      // Mock data
      const domain = 'example.com';
      const path = '/verify';
      const expectedContent = 'verification-token';
      
      // Mock axios response with 404
      axios.get.mockResolvedValue({
        status: 404,
        data: 'Not Found'
      });
      
      // Call the service method
      const result = await domainService.verifyHttpEndpoint(domain, path, expectedContent);
      
      // Assertions
      expect(result).toEqual({
        verified: false,
        statusCode: 404,
        message: 'HTTP endpoint returned status code 404'
      });
    });
  });
  
  describe('verifySslCertificate', () => {
    it('should verify SSL certificate successfully', async () => {
      // Mock data
      const domain = 'example.com';
      
      // Mock axios response for https request
      axios.get.mockResolvedValue({
        status: 200
      });
      
      // Call the service method
      const result = await domainService.verifySslCertificate(domain);
      
      // Assertions
      expect(axios.get).toHaveBeenCalledWith(`https://${domain}`, expect.any(Object));
      expect(result).toEqual({
        verified: true,
        message: 'SSL certificate is valid'
      });
    });
    
    it('should fail verification if SSL certificate is invalid', async () => {
      // Mock data
      const domain = 'example.com';
      
      // Mock axios response with SSL error
      const sslError = new Error('SSL Error');
      sslError.code = 'CERT_HAS_EXPIRED';
      axios.get.mockRejectedValue(sslError);
      
      // Call the service method
      const result = await domainService.verifySslCertificate(domain);
      
      // Assertions
      expect(result).toEqual({
        verified: false,
        message: 'SSL certificate verification failed: SSL Error',
        error: sslError
      });
    });
  });
  
  describe('generateDomainVerificationToken', () => {
    it('should generate a unique verification token', () => {
      // Test the token generation (which should be deterministic in tests)
      const domain = 'example.com';
      const userId = 'user-123';
      
      // Mock Math.random for consistent output in tests
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
      
      const token = domainService.generateDomainVerificationToken(domain, userId);
      
      // Verify token format and uniqueness
      expect(token).toMatch(/^verify-domain=/);
      expect(token.length).toBeGreaterThan(20); // Should be reasonably long
      
      // Clean up
      jest.spyOn(global.Math, 'random').mockRestore();
    });
    
    it('should generate different tokens for different domains', () => {
      const userId = 'user-123';
      
      // Generate tokens for different domains
      const token1 = domainService.generateDomainVerificationToken('domain1.com', userId);
      const token2 = domainService.generateDomainVerificationToken('domain2.com', userId);
      
      // Tokens should be different
      expect(token1).not.toEqual(token2);
    });
  });
  
  describe('generateExpectedDnsRecords', () => {
    it('should generate DNS records for domain', () => {
      // Mock data
      const domain = 'example.com';
      const verificationToken = 'verify-domain=token123';
      
      const records = domainService.generateExpectedDnsRecords(domain, verificationToken);
      
      // Should include A, CNAME, and TXT records
      expect(records).toContainEqual({
        type: 'A',
        name: '@',
        value: expect.any(String) // IP address
      });
      
      expect(records).toContainEqual({
        type: 'CNAME',
        name: 'www',
        value: expect.any(String) // domain value
      });
      
      expect(records).toContainEqual({
        type: 'TXT',
        name: '@',
        value: verificationToken
      });
    });
  });
  
  describe('verifyDomain', () => {
    it('should perform complete domain verification', async () => {
      // Mock dependencies
      const domainId = 'domain-123';
      const mockDomain = {
        id: domainId,
        name: 'example.com',
        websiteId: 'website-123',
        status: 'pending',
        verificationStatus: 'pending',
        dnsRecords: [
          { type: 'A', name: '@', value: '192.0.2.1' },
          { type: 'TXT', name: '@', value: 'verify-domain=token123' }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      
      Domain.findByPk.mockResolvedValue(mockDomain);
      
      // Mock DNS verification
      jest.spyOn(domainService, 'verifyDnsRecord').mockImplementation((domain, type, value) => {
        return Promise.resolve({
          verified: true,
          actualValue: [value],
          expectedValue: value,
          message: 'DNS record verified successfully'
        });
      });
      
      // Mock HTTP verification
      jest.spyOn(domainService, 'verifyHttpEndpoint').mockResolvedValue({
        verified: true,
        statusCode: 200,
        message: 'HTTP verification successful'
      });
      
      // Call the service method
      const result = await domainService.verifyDomain(domainId);
      
      // Assertions
      expect(Domain.findByPk).toHaveBeenCalledWith(domainId);
      expect(domainService.verifyDnsRecord).toHaveBeenCalledTimes(2); // A and TXT records
      expect(domainService.verifyHttpEndpoint).toHaveBeenCalledWith(
        'example.com',
        '/.well-known/verification.html',
        expect.any(String)
      );
      
      expect(mockDomain.verificationStatus).toBe('verified');
      expect(mockDomain.status).toBe('active');
      expect(mockDomain.save).toHaveBeenCalled();
      expect(result).toEqual(mockDomain);
    });
    
    it('should fail verification if DNS records do not match', async () => {
      // Mock dependencies
      const domainId = 'domain-123';
      const mockDomain = {
        id: domainId,
        name: 'example.com',
        websiteId: 'website-123',
        status: 'pending',
        verificationStatus: 'pending',
        dnsRecords: [
          { type: 'A', name: '@', value: '192.0.2.1' },
          { type: 'TXT', name: '@', value: 'verify-domain=token123' }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      
      Domain.findByPk.mockResolvedValue(mockDomain);
      
      // Mock DNS verification failure
      jest.spyOn(domainService, 'verifyDnsRecord').mockImplementation((domain, type, value) => {
        return Promise.resolve({
          verified: false,
          actualValue: type === 'A' ? ['192.0.2.2'] : ['wrong-token'],
          expectedValue: value,
          message: 'DNS record does not match expected value'
        });
      });
      
      // Call the service method
      const result = await domainService.verifyDomain(domainId);
      
      // Assertions
      expect(mockDomain.verificationStatus).toBe('failed');
      expect(mockDomain.status).toBe('pending'); // Status remains pending
      expect(mockDomain.save).toHaveBeenCalled();
    });
    
    it('should throw an error if domain not found', async () => {
      // Mock domain not found
      Domain.findByPk.mockResolvedValue(null);
      
      // Call the service method and expect error
      await expect(domainService.verifyDomain('non-existent-id'))
        .rejects.toThrow('Domain not found');
    });
  });
  
  describe('configureVercelDomain', () => {
    it('should configure domain on Vercel', async () => {
      // Mock data
      const domain = 'example.com';
      const projectId = 'project-123';
      
      // Mock axios response
      axios.post.mockResolvedValue({
        status: 200,
        data: { success: true, domainId: 'vercel-domain-123' }
      });
      
      // Call the service method
      const result = await domainService.configureVercelDomain(domain, projectId);
      
      // Assertions
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/projects/'),
        expect.objectContaining({ name: domain }),
        expect.any(Object)
      );
      expect(result).toEqual({ success: true, domainId: 'vercel-domain-123' });
    });
    
    it('should handle configuration errors', async () => {
      // Mock data
      const domain = 'example.com';
      const projectId = 'project-123';
      
      // Mock axios error
      const apiError = new Error('API Error');
      apiError.response = {
        status: 400,
        data: { error: { message: 'Domain already exists' } }
      };
      axios.post.mockRejectedValue(apiError);
      
      // Call the service method
      await expect(domainService.configureVercelDomain(domain, projectId))
        .rejects.toThrow();
      
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error configuring domain on Vercel'),
        expect.any(Object)
      );
    });
  });
});