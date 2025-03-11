const request = require('supertest');
const app = require('../../src/index');
const deploymentService = require('../../src/services/deploymentService');
const websiteService = require('../../src/services/websiteService');
const domainService = require('../../src/services/domainService');
const mockResponses = require('../fixtures/publish-responses');

// Mock the services
jest.mock('../../src/services/deploymentService');
jest.mock('../../src/services/websiteService');
jest.mock('../../src/services/domainService');

// Mock the auth middleware
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    // Add a mock user to the request
    req.user = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      status: 'active'
    };
    next();
  },
  optionalAuth: (req, res, next) => {
    // Add a mock user to the request
    req.user = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      status: 'active'
    };
    next();
  },
  isAdmin: jest.fn((req, res, next) => next()),
  isPaidUser: jest.fn((req, res, next) => next()),
  hasSubscriptionTier: jest.fn(() => (req, res, next) => next()),
  userRateLimit: jest.fn(limiter => limiter)
}));

describe('Publish API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock website service methods
    websiteService.getWebsiteById.mockResolvedValue({
      id: 'website-123',
      userId: 'user-1',
      name: 'Test Website',
      description: 'A test website',
      status: 'draft'
    });
    
    websiteService.updateWebsite.mockImplementation(
      (websiteId, updates) => Promise.resolve({
        id: websiteId,
        userId: 'user-1',
        name: 'Test Website',
        description: 'A test website',
        status: 'draft',
        ...updates
      })
    );
  });
  
  describe('POST /api/websites/:websiteId/publish', () => {
    it('should initiate website publishing successfully', async () => {
      // Mock the deployment service
      deploymentService.createDeployment.mockResolvedValue(mockResponses.deployment);
      
      // Test request
      const response = await request(app)
        .post('/api/websites/website-123/publish')
        .send();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Website publishing initiated');
      expect(response.body.deployment).toBeDefined();
      expect(response.body.deployment.id).toBe('deployment-123');
      expect(response.body.deployment.status).toBe('queued');
      
      // Service assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-1');
      expect(deploymentService.createDeployment).toHaveBeenCalledWith(
        expect.objectContaining({
          websiteId: 'website-123',
          userId: 'user-1',
          status: 'queued'
        })
      );
      expect(websiteService.updateWebsite).toHaveBeenCalledWith(
        'website-123',
        expect.objectContaining({
          lastPublishedAt: expect.any(String)
        })
      );
    });
    
    it('should return 404 if website not found', async () => {
      // Mock website not found
      websiteService.getWebsiteById.mockResolvedValue(null);
      
      // Test request
      const response = await request(app)
        .post('/api/websites/non-existent-website/publish')
        .send();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Website not found');
      expect(deploymentService.createDeployment).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/websites/:websiteId/deployments', () => {
    it('should get deployments for a website', async () => {
      // Mock the deployment service
      deploymentService.getDeployments.mockResolvedValue({
        items: mockResponses.deployments,
        pagination: {
          totalItems: 2,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 1
        }
      });
      
      // Test request
      const response = await request(app)
        .get('/api/websites/website-123/deployments')
        .query({ limit: 10, page: 1 });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.deployments).toEqual(mockResponses.deployments);
      expect(response.body.pagination).toBeDefined();
      
      // Service assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-1');
      expect(deploymentService.getDeployments).toHaveBeenCalledWith(
        'website-123',
        expect.objectContaining({
          limit: 10,
          page: 1
        })
      );
    });
    
    it('should return 404 if website not found', async () => {
      // Mock website not found
      websiteService.getWebsiteById.mockResolvedValue(null);
      
      // Test request
      const response = await request(app)
        .get('/api/websites/non-existent-website/deployments')
        .send();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Website not found');
      expect(deploymentService.getDeployments).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/websites/:websiteId/deployments/:deploymentId', () => {
    it('should get a specific deployment', async () => {
      // Mock the deployment service
      deploymentService.getDeploymentById.mockResolvedValue(mockResponses.deployment);
      
      // Test request
      const response = await request(app)
        .get('/api/websites/website-123/deployments/deployment-123')
        .send();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.deployment).toEqual(mockResponses.deployment);
      
      // Service assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-1');
      expect(deploymentService.getDeploymentById).toHaveBeenCalledWith('deployment-123');
    });
    
    it('should return 404 if website not found', async () => {
      // Mock website not found
      websiteService.getWebsiteById.mockResolvedValue(null);
      
      // Test request
      const response = await request(app)
        .get('/api/websites/non-existent-website/deployments/deployment-123')
        .send();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Website not found');
      expect(deploymentService.getDeploymentById).not.toHaveBeenCalled();
    });
    
    it('should return 404 if deployment not found', async () => {
      // Mock deployment not found
      deploymentService.getDeploymentById.mockResolvedValue(null);
      
      // Test request
      const response = await request(app)
        .get('/api/websites/website-123/deployments/non-existent-deployment')
        .send();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Deployment not found');
    });
    
    it('should return 404 if deployment belongs to different website', async () => {
      // Mock deployment for a different website
      deploymentService.getDeploymentById.mockResolvedValue({
        ...mockResponses.deployment,
        websiteId: 'different-website'
      });
      
      // Test request
      const response = await request(app)
        .get('/api/websites/website-123/deployments/deployment-123')
        .send();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Deployment not found');
    });
  });
  
  describe('GET /api/websites/:websiteId/domains', () => {
    it('should get domains for a website', async () => {
      // Mock the domain service
      domainService.getDomainsByWebsiteId.mockResolvedValue(mockResponses.domains);
      
      // Test request
      const response = await request(app)
        .get('/api/websites/website-123/domains')
        .send();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.domains).toEqual(mockResponses.domains);
      
      // Service assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-1');
      expect(domainService.getDomainsByWebsiteId).toHaveBeenCalledWith('website-123');
    });
    
    it('should return 404 if website not found', async () => {
      // Mock website not found
      websiteService.getWebsiteById.mockResolvedValue(null);
      
      // Test request
      const response = await request(app)
        .get('/api/websites/non-existent-website/domains')
        .send();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Website not found');
      expect(domainService.getDomainsByWebsiteId).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/websites/:websiteId/domains', () => {
    it('should add a domain to a website', async () => {
      // Mock the domain service
      domainService.getDomainByName.mockResolvedValue(null); // Domain not taken
      domainService.createDomain.mockResolvedValue(mockResponses.domain);
      
      // Test request
      const response = await request(app)
        .post('/api/websites/website-123/domains')
        .send({
          name: 'example.com'
        });
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Domain added successfully');
      expect(response.body.domain).toEqual(mockResponses.domain);
      
      // Service assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-1');
      expect(domainService.getDomainByName).toHaveBeenCalledWith('example.com');
      expect(domainService.createDomain).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'example.com',
          websiteId: 'website-123',
          userId: 'user-1',
          status: 'pending',
          verificationStatus: 'pending',
          isPrimary: false,
          dnsRecords: expect.any(Array)
        })
      );
    });
    
    it('should return 400 for invalid domain name', async () => {
      // Test request with invalid domain
      const response = await request(app)
        .post('/api/websites/website-123/domains')
        .send({
          name: 'invalid domain'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid domain name');
      expect(domainService.createDomain).not.toHaveBeenCalled();
    });
    
    it('should return 400 if domain is already in use', async () => {
      // Mock domain already exists
      domainService.getDomainByName.mockResolvedValue(mockResponses.domain);
      
      // Test request
      const response = await request(app)
        .post('/api/websites/website-123/domains')
        .send({
          name: 'example.com'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already in use');
      expect(domainService.createDomain).not.toHaveBeenCalled();
    });
  });
  
  describe('DELETE /api/websites/:websiteId/domains/:domainId', () => {
    it('should remove a domain from a website', async () => {
      // Mock the domain service
      domainService.getDomainById.mockResolvedValue({
        ...mockResponses.domain,
        isPrimary: false
      });
      domainService.deleteDomain.mockResolvedValue(true);
      
      // Test request
      const response = await request(app)
        .delete('/api/websites/website-123/domains/domain-123')
        .send();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Domain removed successfully');
      
      // Service assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-1');
      expect(domainService.getDomainById).toHaveBeenCalledWith('domain-123');
      expect(domainService.deleteDomain).toHaveBeenCalledWith('domain-123');
    });
    
    it('should return 400 if trying to remove the primary domain', async () => {
      // Mock primary domain
      domainService.getDomainById.mockResolvedValue({
        ...mockResponses.domain,
        isPrimary: true
      });
      
      // Test request
      const response = await request(app)
        .delete('/api/websites/website-123/domains/domain-123')
        .send();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot remove the primary domain');
      expect(domainService.deleteDomain).not.toHaveBeenCalled();
    });
    
    it('should return 404 if domain not found', async () => {
      // Mock domain not found
      domainService.getDomainById.mockResolvedValue(null);
      
      // Test request
      const response = await request(app)
        .delete('/api/websites/website-123/domains/non-existent-domain')
        .send();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Domain not found');
      expect(domainService.deleteDomain).not.toHaveBeenCalled();
    });
  });
  
  describe('PUT /api/websites/:websiteId/domains/:domainId/primary', () => {
    it('should set a domain as primary', async () => {
      // Mock the domain service
      domainService.getDomainById.mockResolvedValue({
        ...mockResponses.domain,
        status: 'active',
        verificationStatus: 'verified'
      });
      domainService.setPrimaryDomain.mockResolvedValue(true);
      
      // Test request
      const response = await request(app)
        .put('/api/websites/website-123/domains/domain-123/primary')
        .send();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Domain set as primary successfully');
      
      // Service assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-1');
      expect(domainService.getDomainById).toHaveBeenCalledWith('domain-123');
      expect(domainService.setPrimaryDomain).toHaveBeenCalledWith('website-123', 'domain-123');
    });
    
    it('should return 400 if domain is not active and verified', async () => {
      // Mock unverified domain
      domainService.getDomainById.mockResolvedValue({
        ...mockResponses.domain,
        status: 'pending',
        verificationStatus: 'pending'
      });
      
      // Test request
      const response = await request(app)
        .put('/api/websites/website-123/domains/domain-123/primary')
        .send();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Domain must be active and verified');
      expect(domainService.setPrimaryDomain).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/websites/:websiteId/domains/:domainId/verify', () => {
    it('should initiate domain verification', async () => {
      // Mock the domain service
      domainService.getDomainById.mockResolvedValue(mockResponses.domain);
      domainService.verifyDomain.mockResolvedValue({
        ...mockResponses.domain,
        verificationStatus: 'verified',
        status: 'active'
      });
      
      // Test request
      const response = await request(app)
        .post('/api/websites/website-123/domains/domain-123/verify')
        .send();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Domain verification initiated');
      expect(response.body.status).toBe('verified');
      
      // Service assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-1');
      expect(domainService.getDomainById).toHaveBeenCalledWith('domain-123');
      expect(domainService.verifyDomain).toHaveBeenCalledWith('domain-123');
    });
    
    it('should return 404 if domain not found', async () => {
      // Mock domain not found
      domainService.getDomainById.mockResolvedValue(null);
      
      // Test request
      const response = await request(app)
        .post('/api/websites/website-123/domains/non-existent-domain/verify')
        .send();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Domain not found');
      expect(domainService.verifyDomain).not.toHaveBeenCalled();
    });
  });
});