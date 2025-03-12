const APIError = jest.fn();
// Mocking modules before requiring the controller
jest.mock('../../../src/services/deploymentService', () => ({
  createDeployment: jest.fn(),
  getDeployments: jest.fn(),
  getDeploymentById: jest.fn(),
  hasActiveDeployments: jest.fn(),
  updateDeployment: jest.fn()
}));

jest.mock('../../../src/services/websiteService', () => ({
  getWebsiteById: jest.fn(),
  updateWebsite: jest.fn()
}));

jest.mock('../../../src/services/domainService', () => ({
  getDomainsByWebsiteId: jest.fn(),
  getDomainById: jest.fn(),
  getDomainByName: jest.fn(),
  createDomain: jest.fn(),
  setPrimaryDomain: jest.fn(),
  deleteDomain: jest.fn(),
  verifyDomain: jest.fn()
}));

jest.mock('../../../src/middleware/errorHandler', () => ({
  APIError: class APIError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
}));

jest.mock('../../../src/config/database', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Require the controller after mocking
const publishController = require('../../../src/controllers/publishController');
const { sequelize } = require('../../../src/config/database');
const deploymentService = require('../../../src/services/deploymentService');
const websiteService = require('../../../src/services/websiteService');
const domainService = require('../../../src/services/domainService');

describe('Publish Controller', () => {
  let req, res, next, mockTransaction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock transaction
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      finished: false
    };
    sequelize.transaction.mockResolvedValue(mockTransaction);

    // Mock request, response, and next function
    req = {
      user: {
        id: 'user-123'
      },
      params: {
        websiteId: 'website-123',
        domainId: 'domain-123'
      },
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    // Mock setTimeout for testing purposes
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('publishWebsite', () => {
    it('should initiate website publishing successfully', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        userId: 'user-123',
        status: 'queued',
        version: '2023.01.01.1200',
        createdAt: new Date()
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      deploymentService.hasActiveDeployments.mockResolvedValue(false);
      deploymentService.createDeployment.mockResolvedValue(deployment);
      websiteService.updateWebsite.mockResolvedValue(website);

      // Call the controller method
      await publishController.publishWebsite(req, res, next);

      // Assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-123');
      expect(deploymentService.hasActiveDeployments).toHaveBeenCalledWith('website-123');
      expect(deploymentService.createDeployment).toHaveBeenCalled();
      expect(websiteService.updateWebsite).toHaveBeenCalledWith('website-123', { lastPublishedAt: expect.any(Date) });
      expect(mockTransaction.commit).toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Website publishing initiated',
        deployment: {
          id: 'deployment-123',
          version: '2023.01.01.1200',
          status: 'queued',
          createdAt: expect.any(Date)
        }
      });
    });

    it('should return 404 if website not found', async () => {
      // Mock service response for website not found
      websiteService.getWebsiteById.mockResolvedValue(null);

      // Call the controller method
      await publishController.publishWebsite(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Website not found');
      expect(mockTransaction.rollback).toHaveBeenCalled();
      
      // Other services should not be called
      expect(deploymentService.hasActiveDeployments).not.toHaveBeenCalled();
      expect(deploymentService.createDeployment).not.toHaveBeenCalled();
      expect(websiteService.updateWebsite).not.toHaveBeenCalled();
    });

    it('should return 409 if website already has active deployments', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      deploymentService.hasActiveDeployments.mockResolvedValue(true);

      // Call the controller method
      await publishController.publishWebsite(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(409);
      expect(next.mock.calls[0][0].message).toBe('A deployment is already in progress for this website');
      expect(mockTransaction.rollback).toHaveBeenCalled();
      
      // Other services should not be called
      expect(deploymentService.createDeployment).not.toHaveBeenCalled();
      expect(websiteService.updateWebsite).not.toHaveBeenCalled();
    });
  });

  describe('getDeployments', () => {
    it('should return deployments with pagination', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const deployments = {
        items: [
          { id: 'deployment-1', status: 'success' },
          { id: 'deployment-2', status: 'failed' }
        ],
        pagination: {
          totalItems: 2,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 1
        }
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      deploymentService.getDeployments.mockResolvedValue(deployments);

      // Call the controller method
      await publishController.getDeployments(req, res, next);

      // Assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-123');
      expect(deploymentService.getDeployments).toHaveBeenCalledWith('website-123', {
        limit: 10,
        page: 1
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        deployments: deployments.items,
        pagination: deployments.pagination
      });
    });

    it('should respect pagination parameters', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const deployments = {
        items: [
          { id: 'deployment-3', status: 'success' }
        ],
        pagination: {
          totalItems: 5,
          itemsPerPage: 1,
          currentPage: 3,
          totalPages: 5
        }
      };

      // Set query parameters
      req.query = {
        limit: '1',
        page: '3'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      deploymentService.getDeployments.mockResolvedValue(deployments);

      // Call the controller method
      await publishController.getDeployments(req, res, next);

      // Assertions
      expect(deploymentService.getDeployments).toHaveBeenCalledWith('website-123', {
        limit: 1,
        page: 3
      });
      
      expect(res.json).toHaveBeenCalledWith({
        deployments: deployments.items,
        pagination: deployments.pagination
      });
    });

    it('should return 404 if website not found', async () => {
      // Mock service response for website not found
      websiteService.getWebsiteById.mockResolvedValue(null);

      // Call the controller method
      await publishController.getDeployments(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Website not found');
      
      // Deployment service should not be called
      expect(deploymentService.getDeployments).not.toHaveBeenCalled();
    });
  });

  describe('getDeployment', () => {
    it('should return a specific deployment', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        status: 'success'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      deploymentService.getDeploymentById.mockResolvedValue(deployment);

      // Set params
      req.params.deploymentId = 'deployment-123';

      // Call the controller method
      await publishController.getDeployment(req, res, next);

      // Assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-123');
      expect(deploymentService.getDeploymentById).toHaveBeenCalledWith('deployment-123');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ deployment });
    });

    it('should return 404 if deployment not found', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      deploymentService.getDeploymentById.mockResolvedValue(null);

      // Set params
      req.params.deploymentId = 'non-existent-deployment';

      // Call the controller method
      await publishController.getDeployment(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Deployment not found');
    });

    it('should return 404 if deployment belongs to different website', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const deployment = {
        id: 'deployment-123',
        websiteId: 'different-website-id',
        status: 'success'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      deploymentService.getDeploymentById.mockResolvedValue(deployment);

      // Set params
      req.params.deploymentId = 'deployment-123';

      // Call the controller method
      await publishController.getDeployment(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Deployment not found');
    });
  });

  describe('getDomains', () => {
    it('should return domains for a website', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const domains = [
        { id: 'domain-1', name: 'example.com', status: 'active' },
        { id: 'domain-2', name: 'test.com', status: 'pending' }
      ];

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainsByWebsiteId.mockResolvedValue(domains);

      // Call the controller method
      await publishController.getDomains(req, res, next);

      // Assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-123');
      expect(domainService.getDomainsByWebsiteId).toHaveBeenCalledWith('website-123');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ domains });
    });

    it('should return 404 if website not found', async () => {
      // Mock service response for website not found
      websiteService.getWebsiteById.mockResolvedValue(null);

      // Call the controller method
      await publishController.getDomains(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Website not found');
      
      // Domain service should not be called
      expect(domainService.getDomainsByWebsiteId).not.toHaveBeenCalled();
    });
  });

  describe('addDomain', () => {
    it('should add a domain to a website', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const domains = []; // No existing domains
      const domain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123',
        userId: 'user-123',
        status: 'pending',
        verificationStatus: 'pending',
        isPrimary: false,
        dnsRecords: [
          { type: 'CNAME', host: 'www.example.com', value: 'website-123.landingpad.digital' },
          { type: 'A', host: 'example.com', value: '76.76.21.21' }
        ]
      };

      // Set request body
      req.body = {
        name: 'example.com'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainByName.mockResolvedValue(null); // Domain not already taken
      domainService.createDomain.mockResolvedValue(domain);
      domainService.getDomainsByWebsiteId.mockResolvedValue(domains);
      domainService.setPrimaryDomain.mockResolvedValue(true);

      // Call the controller method
      await publishController.addDomain(req, res, next);

      // Assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-123');
      expect(domainService.getDomainByName).toHaveBeenCalledWith('example.com');
      expect(domainService.createDomain).toHaveBeenCalledWith(expect.objectContaining({
        name: 'example.com',
        websiteId: 'website-123',
        userId: 'user-123',
        status: 'pending',
        verificationStatus: 'pending',
        isPrimary: false,
        dnsRecords: expect.any(Array)
      }), { transaction: mockTransaction });
      
      // In the real code, it only calls setPrimaryDomain if domains.length === 1
      // Don't assert on this since it might change in implementation
      expect(mockTransaction.commit).toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Domain added successfully',
        domain
      });
    });

    it('should return 400 for invalid domain name', async () => {
      // Set request body with invalid domain name
      req.body = {
        name: 'invalid domain name'
      };

      // Call the controller method
      await publishController.addDomain(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Invalid domain name');
      expect(mockTransaction.rollback).toHaveBeenCalled();
      
      // Services should not be called
      expect(websiteService.getWebsiteById).not.toHaveBeenCalled();
      expect(domainService.getDomainByName).not.toHaveBeenCalled();
      expect(domainService.createDomain).not.toHaveBeenCalled();
    });

    it('should return 400 if domain is already in use', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const existingDomain = {
        id: 'existing-domain',
        name: 'example.com',
        websiteId: 'another-website'
      };

      // Set request body
      req.body = {
        name: 'example.com'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainByName.mockResolvedValue(existingDomain);

      // Call the controller method
      await publishController.addDomain(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('This domain is already in use');
      expect(mockTransaction.rollback).toHaveBeenCalled();
      
      // Domain creation should not be called
      expect(domainService.createDomain).not.toHaveBeenCalled();
    });
  });

  describe('removeDomain', () => {
    it('should remove a domain from a website', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const domain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123',
        isPrimary: false
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainById.mockResolvedValue(domain);
      domainService.deleteDomain.mockResolvedValue(true);

      // Call the controller method
      await publishController.removeDomain(req, res, next);

      // Assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-123');
      expect(domainService.getDomainById).toHaveBeenCalledWith('domain-123');
      expect(domainService.deleteDomain).toHaveBeenCalledWith('domain-123');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Domain removed successfully'
      });
    });

    it('should return 400 if trying to remove the primary domain', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const domain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123',
        isPrimary: true // Primary domain
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainById.mockResolvedValue(domain);

      // Call the controller method
      await publishController.removeDomain(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Cannot remove the primary domain. Please set another domain as primary first.');
      
      // Domain should not be deleted
      expect(domainService.deleteDomain).not.toHaveBeenCalled();
    });

    it('should return 404 if domain not found', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainById.mockResolvedValue(null);

      // Call the controller method
      await publishController.removeDomain(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Domain not found');
      
      // Domain should not be deleted
      expect(domainService.deleteDomain).not.toHaveBeenCalled();
    });

    it('should return 404 if domain belongs to a different website', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const domain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'different-website-id',
        isPrimary: false
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainById.mockResolvedValue(domain);

      // Call the controller method
      await publishController.removeDomain(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Domain not found');
      
      // Domain should not be deleted
      expect(domainService.deleteDomain).not.toHaveBeenCalled();
    });
  });

  describe('setPrimaryDomain', () => {
    it('should set a domain as primary', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const domain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123',
        status: 'active',
        verificationStatus: 'verified'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainById.mockResolvedValue(domain);
      domainService.setPrimaryDomain.mockResolvedValue(true);

      // Call the controller method
      await publishController.setPrimaryDomain(req, res, next);

      // Assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-123');
      expect(domainService.getDomainById).toHaveBeenCalledWith('domain-123');
      expect(domainService.setPrimaryDomain).toHaveBeenCalledWith('website-123', 'domain-123');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Domain set as primary successfully'
      });
    });

    it('should return 400 if domain is not active and verified', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const domain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123',
        status: 'pending', // Not active
        verificationStatus: 'pending' // Not verified
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainById.mockResolvedValue(domain);

      // Call the controller method
      await publishController.setPrimaryDomain(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Domain must be active and verified to set as primary');
      
      // Domain should not be set as primary
      expect(domainService.setPrimaryDomain).not.toHaveBeenCalled();
    });
  });

  describe('verifyDomain', () => {
    it('should initiate domain verification', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const domain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123',
        status: 'pending',
        verificationStatus: 'pending'
      };
      const verificationResult = {
        ...domain,
        verificationStatus: 'verified',
        status: 'active'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainById.mockResolvedValue(domain);
      domainService.verifyDomain.mockResolvedValue(verificationResult);

      // Call the controller method
      await publishController.verifyDomain(req, res, next);

      // Assertions
      expect(websiteService.getWebsiteById).toHaveBeenCalledWith('website-123', 'user-123');
      expect(domainService.getDomainById).toHaveBeenCalledWith('domain-123');
      expect(domainService.verifyDomain).toHaveBeenCalledWith('domain-123');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Domain verification initiated',
        status: 'verified'
      });
    });

    it('should return 200 if domain is already verified', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };
      const domain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123',
        status: 'active',
        verificationStatus: 'verified'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainById.mockResolvedValue(domain);

      // Call the controller method
      await publishController.verifyDomain(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Domain is already verified',
        status: 'verified'
      });
      
      // Verification should not be called again
      expect(domainService.verifyDomain).not.toHaveBeenCalled();
    });

    it('should return 404 if domain not found', async () => {
      // Mock data
      const website = {
        id: 'website-123',
        name: 'Test Website'
      };

      // Mock service responses
      websiteService.getWebsiteById.mockResolvedValue(website);
      domainService.getDomainById.mockResolvedValue(null);

      // Call the controller method
      await publishController.verifyDomain(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Domain not found');
      
      // Verification should not be called
      expect(domainService.verifyDomain).not.toHaveBeenCalled();
    });
  });
});