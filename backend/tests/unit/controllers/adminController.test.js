const adminController = require('../../../src/controllers/adminController');
const { User, Website, Deployment, Domain } = require('../../../src/models');
const { APIError } = require('../../../src/middleware/errorHandler');
const { Op } = require('sequelize');

// Mock the models and logger
jest.mock('../../../src/models', () => ({
  User: {
    count: jest.fn(),
    findAll: jest.fn()
  },
  Website: {
    count: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn()
  },
  Deployment: {
    count: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn()
  },
  Domain: {
    count: jest.fn(),
    findAndCountAll: jest.fn()
  }
}));

describe('Admin Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request, response, and next function
    req = {
      user: {
        id: 'admin-user-id',
        role: 'admin'
      },
      query: {},
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  describe('getStats', () => {
    it('should return statistics for admin dashboard', async () => {
      // Mock data
      const userCount = 10;
      const websiteCount = 25;
      const deploymentCount = 100;
      const domainCount = 30;
      const failedDeployments = 5;
      const activeDomains = 20;
      const recentDeployments = [
        { id: 'deployment-1', status: 'success', website: { name: 'Website 1' }, user: { firstName: 'John' } },
        { id: 'deployment-2', status: 'failed', website: { name: 'Website 2' }, user: { firstName: 'Jane' } }
      ];

      // Mock model responses
      User.count.mockResolvedValue(userCount);
      Website.count.mockResolvedValue(websiteCount);
      Deployment.count.mockImplementation(options => {
        if (options && options.where && options.where.status === 'failed') {
          return Promise.resolve(failedDeployments);
        }
        return Promise.resolve(deploymentCount);
      });
      Domain.count.mockImplementation(options => {
        if (options && options.where && options.where.status === 'active') {
          return Promise.resolve(activeDomains);
        }
        return Promise.resolve(domainCount);
      });
      Deployment.findAll.mockResolvedValue(recentDeployments);

      // Call the controller method
      await adminController.getStats(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        stats: {
          users: userCount,
          websites: websiteCount,
          deployments: deploymentCount,
          domains: domainCount,
          failedDeployments,
          activeDomains
        },
        recentDeployments
      });

      // Verify model calls
      expect(User.count).toHaveBeenCalled();
      expect(Website.count).toHaveBeenCalled();
      expect(Deployment.count).toHaveBeenCalledTimes(2); // Total count and failed count
      expect(Domain.count).toHaveBeenCalledTimes(2); // Total count and active count
      expect(Deployment.findAll).toHaveBeenCalledWith({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: expect.any(Array)
      });
    });

    it('should return 403 if user is not an admin', async () => {
      // Set user role to non-admin
      req.user.role = 'user';

      // Call the controller method
      await adminController.getStats(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(APIError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
      expect(next.mock.calls[0][0].message).toBe('Unauthorized access');

      // None of the model methods should be called
      expect(User.count).not.toHaveBeenCalled();
      expect(Website.count).not.toHaveBeenCalled();
      expect(Deployment.count).not.toHaveBeenCalled();
      expect(Domain.count).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Force an error
      const error = new Error('Database error');
      User.count.mockRejectedValue(error);

      // Call the controller method
      await adminController.getStats(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getWebsites', () => {
    it('should return websites with pagination', async () => {
      // Mock query parameters
      req.query = {
        page: '2',
        limit: '15',
        search: 'test',
        status: 'published'
      };

      // Mock data
      const mockWebsites = [
        { id: 'website-1', name: 'Test Website 1', user: { firstName: 'John' } },
        { id: 'website-2', name: 'Test Website 2', user: { firstName: 'Jane' } }
      ];

      // Mock findAndCountAll response
      Website.findAndCountAll.mockResolvedValue({
        count: 30, // Total count of websites matching the query
        rows: mockWebsites
      });

      // Call the controller method
      await adminController.getWebsites(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        websites: mockWebsites,
        pagination: {
          totalItems: 30,
          itemsPerPage: 15,
          currentPage: 2,
          totalPages: 2 // 30 items with 15 per page = 2 pages
        }
      });

      // Verify model calls with correct parameters
      expect(Website.findAndCountAll).toHaveBeenCalledWith({
        where: {
          name: {
            [Op.iLike]: '%test%'
          },
          status: 'published'
        },
        limit: 15,
        offset: 15, // Page 2 with limit 15
        order: [['updatedAt', 'DESC']],
        include: expect.any(Array)
      });
    });

    it('should use default pagination parameters if not provided', async () => {
      // No query parameters provided

      // Mock data
      const mockWebsites = [
        { id: 'website-1', name: 'Website 1', user: { firstName: 'John' } },
        { id: 'website-2', name: 'Website 2', user: { firstName: 'Jane' } }
      ];

      // Mock findAndCountAll response
      Website.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockWebsites
      });

      // Call the controller method
      await adminController.getWebsites(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        websites: mockWebsites,
        pagination: {
          totalItems: 2,
          itemsPerPage: 10, // Default limit
          currentPage: 1, // Default page
          totalPages: 1
        }
      });

      // Verify model calls with default parameters
      expect(Website.findAndCountAll).toHaveBeenCalledWith({
        where: {}, // No filters
        limit: 10,
        offset: 0,
        order: [['updatedAt', 'DESC']],
        include: expect.any(Array)
      });
    });

    it('should return 403 if user is not an admin', async () => {
      // Set user role to non-admin
      req.user.role = 'user';

      // Call the controller method
      await adminController.getWebsites(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(APIError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
      expect(next.mock.calls[0][0].message).toBe('Unauthorized access');

      // Model method should not be called
      expect(Website.findAndCountAll).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Force an error
      const error = new Error('Database error');
      Website.findAndCountAll.mockRejectedValue(error);

      // Call the controller method
      await adminController.getWebsites(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getDeployments', () => {
    it('should return deployments with pagination', async () => {
      // Mock query parameters
      req.query = {
        page: '2',
        limit: '15',
        status: 'success',
        websiteId: 'website-123'
      };

      // Mock data
      const mockDeployments = [
        { id: 'deployment-1', status: 'success', website: { name: 'Website 1' }, user: { firstName: 'John' } },
        { id: 'deployment-2', status: 'success', website: { name: 'Website 2' }, user: { firstName: 'Jane' } }
      ];

      // Mock findAndCountAll response
      Deployment.findAndCountAll.mockResolvedValue({
        count: 30, // Total count of deployments matching the query
        rows: mockDeployments
      });

      // Call the controller method
      await adminController.getDeployments(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        deployments: mockDeployments,
        pagination: {
          totalItems: 30,
          itemsPerPage: 15,
          currentPage: 2,
          totalPages: 2 // 30 items with 15 per page = 2 pages
        }
      });

      // Verify model calls with correct parameters
      expect(Deployment.findAndCountAll).toHaveBeenCalledWith({
        where: {
          status: 'success',
          websiteId: 'website-123'
        },
        limit: 15,
        offset: 15, // Page 2 with limit 15
        order: [['createdAt', 'DESC']],
        include: expect.any(Array)
      });
    });

    it('should return 403 if user is not an admin', async () => {
      // Set user role to non-admin
      req.user.role = 'user';

      // Call the controller method
      await adminController.getDeployments(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(APIError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
      expect(next.mock.calls[0][0].message).toBe('Unauthorized access');

      // Model method should not be called
      expect(Deployment.findAndCountAll).not.toHaveBeenCalled();
    });
  });

  describe('getDomains', () => {
    it('should return domains with pagination', async () => {
      // Mock query parameters
      req.query = {
        page: '2',
        limit: '15',
        status: 'active',
        search: 'example',
        websiteId: 'website-123'
      };

      // Mock data
      const mockDomains = [
        { id: 'domain-1', name: 'example.com', status: 'active', website: { name: 'Website 1' }, user: { firstName: 'John' } },
        { id: 'domain-2', name: 'example.org', status: 'active', website: { name: 'Website 2' }, user: { firstName: 'Jane' } }
      ];

      // Mock findAndCountAll response
      Domain.findAndCountAll.mockResolvedValue({
        count: 30, // Total count of domains matching the query
        rows: mockDomains
      });

      // Call the controller method
      await adminController.getDomains(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        domains: mockDomains,
        pagination: {
          totalItems: 30,
          itemsPerPage: 15,
          currentPage: 2,
          totalPages: 2 // 30 items with 15 per page = 2 pages
        }
      });

      // Verify model calls with correct parameters
      expect(Domain.findAndCountAll).toHaveBeenCalledWith({
        where: {
          status: 'active',
          websiteId: 'website-123',
          name: {
            [Op.iLike]: '%example%'
          }
        },
        limit: 15,
        offset: 15, // Page 2 with limit 15
        order: [['createdAt', 'DESC']],
        include: expect.any(Array)
      });
    });

    it('should return 403 if user is not an admin', async () => {
      // Set user role to non-admin
      req.user.role = 'user';

      // Call the controller method
      await adminController.getDomains(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(APIError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
      expect(next.mock.calls[0][0].message).toBe('Unauthorized access');

      // Model method should not be called
      expect(Domain.findAndCountAll).not.toHaveBeenCalled();
    });
  });

  describe('getWebsiteDetails', () => {
    it('should return detailed website information', async () => {
      // Set request params
      req.params = {
        websiteId: 'website-123'
      };

      // Mock data
      const mockWebsite = {
        id: 'website-123',
        name: 'Test Website',
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          subscriptionTier: 'premium'
        },
        domains: [
          { id: 'domain-1', name: 'example.com', status: 'active' }
        ],
        deployments: [
          { id: 'deployment-1', status: 'success' },
          { id: 'deployment-2', status: 'failed' }
        ]
      };

      // Mock findByPk response
      Website.findByPk.mockResolvedValue(mockWebsite);

      // Call the controller method
      await adminController.getWebsiteDetails(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        website: mockWebsite
      });

      // Verify model calls with correct parameters
      expect(Website.findByPk).toHaveBeenCalledWith('website-123', {
        include: expect.any(Array)
      });
    });

    it('should return 404 if website not found', async () => {
      // Set request params
      req.params = {
        websiteId: 'non-existent-website'
      };

      // Mock findByPk response for not found
      Website.findByPk.mockResolvedValue(null);

      // Call the controller method
      await adminController.getWebsiteDetails(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(APIError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Website not found');
    });

    it('should return 403 if user is not an admin', async () => {
      // Set user role to non-admin
      req.user.role = 'user';

      // Set request params
      req.params = {
        websiteId: 'website-123'
      };

      // Call the controller method
      await adminController.getWebsiteDetails(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(APIError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
      expect(next.mock.calls[0][0].message).toBe('Unauthorized access');

      // Model method should not be called
      expect(Website.findByPk).not.toHaveBeenCalled();
    });
  });
});