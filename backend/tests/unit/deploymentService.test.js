const deploymentService = require('../../src/services/deploymentService');
const { Deployment } = require('../../src/models');
const logger = require('../../src/utils/logger');
const { Op } = require('sequelize');

// Mock the models and logger
jest.mock('../../src/models', () => ({
  Deployment: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn()
  }
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Deployment Service', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  describe('createDeployment', () => {
    it('should create a deployment with required fields', async () => {
      // Mock data
      const deploymentData = {
        websiteId: 'website-123',
        userId: 'user-123',
        version: '1.0.0'
      };
      
      // Mock create response
      const mockDeployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        userId: 'user-123',
        version: '1.0.0',
        status: 'queued',
        commitMessage: 'User initiated deployment',
        createdAt: new Date(),
        completedAt: null,
        buildTime: null,
        errorMessage: null
      };
      
      Deployment.create.mockResolvedValue(mockDeployment);
      
      // Call the service method
      const result = await deploymentService.createDeployment(deploymentData);
      
      // Assertions
      expect(Deployment.create).toHaveBeenCalledWith({
        websiteId: 'website-123',
        userId: 'user-123',
        version: '1.0.0',
        status: 'queued',
        commitMessage: 'User initiated deployment'
      });
      
      expect(result).toEqual(mockDeployment);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Deployment created'));
    });
    
    it('should use provided status and commit message if specified', async () => {
      // Mock data
      const deploymentData = {
        websiteId: 'website-123',
        userId: 'user-123',
        version: '1.0.0',
        status: 'in_progress',
        commitMessage: 'Custom commit message'
      };
      
      // Mock create response
      const mockDeployment = {
        id: 'deployment-123',
        ...deploymentData,
        createdAt: new Date(),
        completedAt: null,
        buildTime: null,
        errorMessage: null
      };
      
      Deployment.create.mockResolvedValue(mockDeployment);
      
      // Call the service method
      const result = await deploymentService.createDeployment(deploymentData);
      
      // Assertions
      expect(Deployment.create).toHaveBeenCalledWith({
        websiteId: 'website-123',
        userId: 'user-123',
        version: '1.0.0',
        status: 'in_progress',
        commitMessage: 'Custom commit message'
      });
      
      expect(result).toEqual(mockDeployment);
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Deployment.create.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(deploymentService.createDeployment({
        websiteId: 'website-123',
        userId: 'user-123',
        version: '1.0.0'
      })).rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error creating deployment:', mockError);
    });
  });
  
  describe('getDeployments', () => {
    it('should get deployments for a website with default pagination', async () => {
      // Mock data
      const websiteId = 'website-123';
      const mockDeployments = [
        {
          id: 'deployment-1',
          websiteId,
          status: 'success',
          createdAt: new Date('2023-01-03')
        },
        {
          id: 'deployment-2',
          websiteId,
          status: 'failed',
          createdAt: new Date('2023-01-02')
        }
      ];
      
      // Mock findAndCountAll response
      Deployment.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockDeployments
      });
      
      // Call the service method
      const result = await deploymentService.getDeployments(websiteId);
      
      // Assertions
      expect(Deployment.findAndCountAll).toHaveBeenCalledWith({
        where: { websiteId },
        limit: 10,
        offset: 0,
        order: [['createdAt', 'DESC']]
      });
      
      expect(result).toEqual({
        items: mockDeployments,
        pagination: {
          totalItems: 2,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 1
        }
      });
    });
    
    it('should respect pagination options', async () => {
      // Mock data
      const websiteId = 'website-123';
      const options = { limit: 2, page: 2 };
      const mockDeployments = [
        { id: 'deployment-3', websiteId },
        { id: 'deployment-4', websiteId }
      ];
      
      // Mock findAndCountAll response
      Deployment.findAndCountAll.mockResolvedValue({
        count: 6,
        rows: mockDeployments
      });
      
      // Call the service method
      const result = await deploymentService.getDeployments(websiteId, options);
      
      // Assertions
      expect(Deployment.findAndCountAll).toHaveBeenCalledWith({
        where: { websiteId },
        limit: 2,
        offset: 2, // Page 2 with limit 2
        order: [['createdAt', 'DESC']]
      });
      
      expect(result).toEqual({
        items: mockDeployments,
        pagination: {
          totalItems: 6,
          itemsPerPage: 2,
          currentPage: 2,
          totalPages: 3 // 6 items with 2 per page = 3 pages
        }
      });
    });
    
    it('should handle empty results', async () => {
      // Mock findAndCountAll response for empty results
      Deployment.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });
      
      // Call the service method
      const result = await deploymentService.getDeployments('website-456');
      
      // Assertions
      expect(result).toEqual({
        items: [],
        pagination: {
          totalItems: 0,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 0
        }
      });
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Deployment.findAndCountAll.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(deploymentService.getDeployments('website-123'))
        .rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error fetching deployments:', mockError);
    });
  });
  
  describe('getDeploymentById', () => {
    it('should return a deployment by ID', async () => {
      // Mock data
      const deploymentId = 'deployment-123';
      const mockDeployment = {
        id: deploymentId,
        websiteId: 'website-123',
        status: 'success'
      };
      
      // Mock findByPk response
      Deployment.findByPk.mockResolvedValue(mockDeployment);
      
      // Call the service method
      const result = await deploymentService.getDeploymentById(deploymentId);
      
      // Assertions
      expect(Deployment.findByPk).toHaveBeenCalledWith(deploymentId);
      expect(result).toEqual(mockDeployment);
    });
    
    it('should return null if deployment not found', async () => {
      // Mock findByPk response for not found
      Deployment.findByPk.mockResolvedValue(null);
      
      // Call the service method
      const result = await deploymentService.getDeploymentById('non-existent-id');
      
      // Assertions
      expect(result).toBeNull();
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Deployment.findByPk.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(deploymentService.getDeploymentById('deployment-123'))
        .rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error fetching deployment by ID:', mockError);
    });
  });
  
  describe('updateDeployment', () => {
    it('should update a deployment', async () => {
      // Mock data
      const deploymentId = 'deployment-123';
      const updates = {
        status: 'success',
        completedAt: new Date(),
        buildTime: 5000
      };
      
      // Mock findByPk response
      const mockDeployment = {
        id: deploymentId,
        websiteId: 'website-123',
        status: 'in_progress',
        save: jest.fn().mockResolvedValue(true)
      };
      
      // Updated deployment after applying updates
      const updatedDeployment = {
        ...mockDeployment,
        ...updates
      };
      
      Deployment.findByPk.mockResolvedValue(mockDeployment);
      
      // Call the service method
      const result = await deploymentService.updateDeployment(deploymentId, updates);
      
      // Assertions
      expect(Deployment.findByPk).toHaveBeenCalledWith(deploymentId);
      
      // Check that the deployment object was updated
      expect(mockDeployment.status).toBe('success');
      expect(mockDeployment.completedAt).toEqual(updates.completedAt);
      expect(mockDeployment.buildTime).toBe(5000);
      
      expect(mockDeployment.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Deployment updated'));
    });
    
    it('should return null if deployment not found', async () => {
      // Mock findByPk response for not found
      Deployment.findByPk.mockResolvedValue(null);
      
      // Call the service method
      const result = await deploymentService.updateDeployment('non-existent-id', { status: 'success' });
      
      // Assertions
      expect(result).toBeNull();
      expect(logger.info).not.toHaveBeenCalled();
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Deployment.findByPk.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(deploymentService.updateDeployment('deployment-123', { status: 'success' }))
        .rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error updating deployment:', mockError);
    });
  });
  
  describe('getLatestSuccessfulDeployment', () => {
    it('should return the most recent successful deployment', async () => {
      // Mock data
      const websiteId = 'website-123';
      const mockDeployment = {
        id: 'deployment-latest',
        websiteId,
        status: 'success',
        createdAt: new Date()
      };
      
      // Mock findOne response
      Deployment.findOne.mockResolvedValue(mockDeployment);
      
      // Call the service method
      const result = await deploymentService.getLatestSuccessfulDeployment(websiteId);
      
      // Assertions
      expect(Deployment.findOne).toHaveBeenCalledWith({
        where: {
          websiteId,
          status: 'success'
        },
        order: [['createdAt', 'DESC']]
      });
      
      expect(result).toEqual(mockDeployment);
    });
    
    it('should return null if no successful deployments found', async () => {
      // Mock findOne response for not found
      Deployment.findOne.mockResolvedValue(null);
      
      // Call the service method
      const result = await deploymentService.getLatestSuccessfulDeployment('website-123');
      
      // Assertions
      expect(result).toBeNull();
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Deployment.findOne.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(deploymentService.getLatestSuccessfulDeployment('website-123'))
        .rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error fetching latest successful deployment:', mockError);
    });
  });
  
  describe('hasActiveDeployments', () => {
    it('should return true if website has active deployments', async () => {
      // Mock data
      const websiteId = 'website-123';
      
      // Mock count response
      Deployment.count.mockResolvedValue(2); // 2 active deployments
      
      // Call the service method
      const result = await deploymentService.hasActiveDeployments(websiteId);
      
      // Assertions
      expect(Deployment.count).toHaveBeenCalledWith({
        where: {
          websiteId,
          status: {
            [Op.in]: ['queued', 'in_progress']
          }
        }
      });
      
      expect(result).toBe(true);
    });
    
    it('should return false if website has no active deployments', async () => {
      // Mock count response for no active deployments
      Deployment.count.mockResolvedValue(0);
      
      // Call the service method
      const result = await deploymentService.hasActiveDeployments('website-123');
      
      // Assertions
      expect(result).toBe(false);
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Deployment.count.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(deploymentService.hasActiveDeployments('website-123'))
        .rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error checking for active deployments:', mockError);
    });
  });
});