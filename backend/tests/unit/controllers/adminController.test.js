const adminController = require('../../../src/controllers/adminController');
const queueService = require('../../../src/services/queueService');
const deploymentService = require('../../../src/services/deploymentService');
const domainService = require('../../../src/services/domainService');
const logger = require('../../../src/utils/logger');

// Mock the services and other dependencies
jest.mock('../../../src/services/queueService', () => ({
  getQueueStats: jest.fn(),
  getQueueJobs: jest.fn(),
  getJob: jest.fn(),
  pauseQueue: jest.fn(),
  resumeQueue: jest.fn(),
  cleanQueue: jest.fn()
}));

jest.mock('../../../src/services/deploymentService', () => ({
  getDeploymentById: jest.fn(),
  updateDeployment: jest.fn()
}));

jest.mock('../../../src/services/domainService', () => ({
  getDomainById: jest.fn(),
  updateDomain: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Admin Controller', () => {
  let mockReq;
  let mockRes;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock Express request and response
    mockReq = {
      params: {},
      query: {},
      body: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });
  
  describe('getQueueDashboard', () => {
    it('should return queue dashboard data', async () => {
      // Mock queue service responses
      queueService.getQueueStats.mockImplementation((queue) => {
        if (queue.name === 'deployments') {
          return Promise.resolve({
            active: 2,
            completed: 10,
            failed: 3,
            delayed: 1,
            waiting: 5
          });
        } else if (queue.name === 'domains') {
          return Promise.resolve({
            active: 1,
            completed: 8,
            failed: 2,
            delayed: 0,
            waiting: 3
          });
        }
      });
      
      queueService.getQueueJobs.mockImplementation((queue, states) => {
        if (queue.name === 'deployments') {
          return Promise.resolve([
            { id: 'job-1', name: 'deployments', data: { websiteId: 'website-1' }, state: 'active' },
            { id: 'job-2', name: 'deployments', data: { websiteId: 'website-2' }, state: 'failed' }
          ]);
        } else if (queue.name === 'domains') {
          return Promise.resolve([
            { id: 'job-3', name: 'domains', data: { domainId: 'domain-1' }, state: 'active' }
          ]);
        }
      });
      
      // Call the controller method
      await adminController.getQueueDashboard(mockReq, mockRes);
      
      // Assertions
      expect(queueService.getQueueStats).toHaveBeenCalledTimes(2);
      expect(queueService.getQueueJobs).toHaveBeenCalledTimes(2);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        queues: expect.arrayContaining([
          expect.objectContaining({
            name: 'deployments',
            stats: expect.objectContaining({
              active: 2,
              completed: 10
            }),
            recentJobs: expect.arrayContaining([
              expect.objectContaining({ id: 'job-1' })
            ])
          }),
          expect.objectContaining({
            name: 'domains',
            stats: expect.objectContaining({
              active: 1,
              completed: 8
            })
          })
        ])
      });
    });
    
    it('should handle errors properly', async () => {
      // Mock service error
      queueService.getQueueStats.mockRejectedValue(new Error('Service Error'));
      
      // Call the controller method
      await adminController.getQueueDashboard(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch queue dashboard data',
        details: expect.any(String)
      });
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error getting queue dashboard'), expect.any(Error));
    });
  });
  
  describe('getQueueDetails', () => {
    it('should return detailed queue information', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      mockReq.query = {
        type: 'failed',
        page: '1',
        limit: '10'
      };
      
      // Mock queue stats
      queueService.getQueueStats.mockResolvedValue({
        active: 2,
        completed: 30,
        failed: 5,
        delayed: 0,
        waiting: 3
      });
      
      // Mock queue jobs
      queueService.getQueueJobs.mockResolvedValue([
        { id: 'job-1', data: { websiteId: 'website-1' }, state: 'failed', reason: 'API error' },
        { id: 'job-2', data: { websiteId: 'website-2' }, state: 'failed', reason: 'Timeout' }
      ]);
      
      // Call the controller method
      await adminController.getQueueDetails(mockReq, mockRes);
      
      // Assertions
      expect(queueService.getQueueStats).toHaveBeenCalled();
      expect(queueService.getQueueJobs).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'deployments' }),
        ['failed'],
        0,
        10
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        name: 'deployments',
        stats: expect.objectContaining({
          active: 2,
          completed: 30,
          failed: 5
        }),
        jobs: expect.arrayContaining([
          expect.objectContaining({ id: 'job-1' }),
          expect.objectContaining({ id: 'job-2' })
        ]),
        pagination: expect.objectContaining({
          page: 1,
          limit: 10
        })
      });
    });
    
    it('should handle invalid queue name', async () => {
      // Set up request with invalid queue name
      mockReq.params.queueName = 'invalid-queue';
      
      // Call the controller method
      await adminController.getQueueDetails(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Queue not found',
        details: expect.any(String)
      });
    });
    
    it('should handle service errors', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      
      // Mock service error
      queueService.getQueueStats.mockRejectedValue(new Error('Stats Error'));
      
      // Call the controller method
      await adminController.getQueueDetails(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch queue details',
        details: expect.any(String)
      });
    });
  });
  
  describe('pauseQueue', () => {
    it('should pause a queue', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      
      // Mock pause success
      queueService.pauseQueue.mockResolvedValue(true);
      
      // Call the controller method
      await adminController.pauseQueue(mockReq, mockRes);
      
      // Assertions
      expect(queueService.pauseQueue).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'deployments' })
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('Queue paused')
      });
    });
    
    it('should handle invalid queue name', async () => {
      // Set up request with invalid queue name
      mockReq.params.queueName = 'invalid-queue';
      
      // Call the controller method
      await adminController.pauseQueue(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Queue not found',
        details: expect.any(String)
      });
      
      expect(queueService.pauseQueue).not.toHaveBeenCalled();
    });
    
    it('should handle pause errors', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      
      // Mock pause error
      queueService.pauseQueue.mockRejectedValue(new Error('Pause Error'));
      
      // Call the controller method
      await adminController.pauseQueue(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to pause queue',
        details: expect.any(String)
      });
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error pausing queue'), expect.any(Error));
    });
  });
  
  describe('resumeQueue', () => {
    it('should resume a queue', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      
      // Mock resume success
      queueService.resumeQueue.mockResolvedValue(true);
      
      // Call the controller method
      await adminController.resumeQueue(mockReq, mockRes);
      
      // Assertions
      expect(queueService.resumeQueue).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'deployments' })
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('Queue resumed')
      });
    });
    
    it('should handle invalid queue name', async () => {
      // Set up request with invalid queue name
      mockReq.params.queueName = 'invalid-queue';
      
      // Call the controller method
      await adminController.resumeQueue(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Queue not found',
        details: expect.any(String)
      });
      
      expect(queueService.resumeQueue).not.toHaveBeenCalled();
    });
    
    it('should handle resume errors', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      
      // Mock resume error
      queueService.resumeQueue.mockRejectedValue(new Error('Resume Error'));
      
      // Call the controller method
      await adminController.resumeQueue(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to resume queue',
        details: expect.any(String)
      });
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error resuming queue'), expect.any(Error));
    });
  });
  
  describe('getJob', () => {
    it('should return job details', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      mockReq.params.jobId = 'job-123';
      
      // Mock job data
      const mockJob = {
        id: 'job-123',
        data: {
          deploymentId: 'deployment-123',
          websiteId: 'website-123'
        },
        progress: 50,
        state: 'active',
        timestamp: Date.now(),
        attemptsMade: 1
      };
      
      queueService.getJob.mockResolvedValue(mockJob);
      
      // Mock deployment data
      deploymentService.getDeploymentById.mockResolvedValue({
        id: 'deployment-123',
        websiteId: 'website-123',
        status: 'in_progress'
      });
      
      // Call the controller method
      await adminController.getJob(mockReq, mockRes);
      
      // Assertions
      expect(queueService.getJob).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'deployments' }),
        'job-123'
      );
      
      expect(deploymentService.getDeploymentById).toHaveBeenCalledWith('deployment-123');
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        job: expect.objectContaining({
          id: 'job-123',
          data: expect.objectContaining({
            deploymentId: 'deployment-123'
          })
        }),
        relatedEntity: expect.objectContaining({
          id: 'deployment-123',
          websiteId: 'website-123'
        })
      });
    });
    
    it('should handle job not found', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      mockReq.params.jobId = 'non-existent-job';
      
      // Mock job not found
      queueService.getJob.mockResolvedValue(null);
      
      // Call the controller method
      await adminController.getJob(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Job not found',
        details: expect.any(String)
      });
    });
    
    it('should handle invalid queue name', async () => {
      // Set up request with invalid queue name
      mockReq.params.queueName = 'invalid-queue';
      mockReq.params.jobId = 'job-123';
      
      // Call the controller method
      await adminController.getJob(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Queue not found',
        details: expect.any(String)
      });
    });
    
    it('should handle service errors', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      mockReq.params.jobId = 'job-123';
      
      // Mock service error
      queueService.getJob.mockRejectedValue(new Error('Service Error'));
      
      // Call the controller method
      await adminController.getJob(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch job details',
        details: expect.any(String)
      });
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error getting job details'), expect.any(Error));
    });
  });
  
  describe('retryDeployment', () => {
    it('should retry a failed deployment', async () => {
      // Set up request
      mockReq.params.deploymentId = 'deployment-123';
      
      // Mock deployment data - failed deployment
      const mockDeployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        status: 'failed',
        errorMessage: 'Network error'
      };
      
      deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);
      deploymentService.updateDeployment.mockImplementation((id, updates) => {
        return Promise.resolve({
          ...mockDeployment,
          ...updates
        });
      });
      
      // Mock queue service
      queueService.addToQueue = jest.fn().mockResolvedValue({ id: 'new-job-123' });
      
      // Call the controller method
      await adminController.retryDeployment(mockReq, mockRes);
      
      // Assertions
      expect(deploymentService.getDeploymentById).toHaveBeenCalledWith('deployment-123');
      expect(deploymentService.updateDeployment).toHaveBeenCalledWith(
        'deployment-123',
        expect.objectContaining({
          status: 'queued',
          errorMessage: null
        })
      );
      
      expect(queueService.addToQueue).toHaveBeenCalled();
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('Deployment queued for retry'),
        deployment: expect.objectContaining({
          id: 'deployment-123',
          status: 'queued'
        })
      });
    });
    
    it('should not retry non-failed deployments', async () => {
      // Set up request
      mockReq.params.deploymentId = 'deployment-123';
      
      // Mock deployment data - successful deployment
      const mockDeployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        status: 'success'
      };
      
      deploymentService.getDeploymentById.mockResolvedValue(mockDeployment);
      
      // Call the controller method
      await adminController.retryDeployment(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Only failed deployments can be retried',
        details: expect.any(String)
      });
      
      expect(deploymentService.updateDeployment).not.toHaveBeenCalled();
      expect(queueService.addToQueue).not.toHaveBeenCalled();
    });
    
    it('should handle deployment not found', async () => {
      // Set up request
      mockReq.params.deploymentId = 'non-existent-id';
      
      // Mock deployment not found
      deploymentService.getDeploymentById.mockResolvedValue(null);
      
      // Call the controller method
      await adminController.retryDeployment(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Deployment not found',
        details: expect.any(String)
      });
    });
    
    it('should handle service errors', async () => {
      // Set up request
      mockReq.params.deploymentId = 'deployment-123';
      
      // Mock service error
      deploymentService.getDeploymentById.mockRejectedValue(new Error('Service Error'));
      
      // Call the controller method
      await adminController.retryDeployment(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to retry deployment',
        details: expect.any(String)
      });
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error retrying deployment'), expect.any(Error));
    });
  });
  
  describe('cleanQueue', () => {
    it('should clean a queue', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      mockReq.body = {
        status: 'completed',
        olderThan: 86400000 // 24 hours in milliseconds
      };
      
      // Mock clean success
      queueService.cleanQueue.mockResolvedValue(5); // 5 jobs removed
      
      // Call the controller method
      await adminController.cleanQueue(mockReq, mockRes);
      
      // Assertions
      expect(queueService.cleanQueue).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'deployments' }),
        'completed',
        86400000
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('5 jobs removed'),
        count: 5
      });
    });
    
    it('should handle invalid queue name', async () => {
      // Set up request with invalid queue name
      mockReq.params.queueName = 'invalid-queue';
      mockReq.body = {
        status: 'completed',
        olderThan: 86400000
      };
      
      // Call the controller method
      await adminController.cleanQueue(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Queue not found',
        details: expect.any(String)
      });
      
      expect(queueService.cleanQueue).not.toHaveBeenCalled();
    });
    
    it('should handle invalid parameters', async () => {
      // Set up request with missing parameters
      mockReq.params.queueName = 'deployments';
      mockReq.body = {}; // Missing required fields
      
      // Call the controller method
      await adminController.cleanQueue(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid parameters',
        details: expect.stringContaining('status and olderThan')
      });
      
      expect(queueService.cleanQueue).not.toHaveBeenCalled();
    });
    
    it('should handle service errors', async () => {
      // Set up request
      mockReq.params.queueName = 'deployments';
      mockReq.body = {
        status: 'completed',
        olderThan: 86400000
      };
      
      // Mock service error
      queueService.cleanQueue.mockRejectedValue(new Error('Clean Error'));
      
      // Call the controller method
      await adminController.cleanQueue(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to clean queue',
        details: expect.any(String)
      });
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error cleaning queue'), expect.any(Error));
    });
  });
  
  describe('retryDomainVerification', () => {
    it('should retry domain verification', async () => {
      // Set up request
      mockReq.params.domainId = 'domain-123';
      
      // Mock domain data - failed verification
      const mockDomain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123',
        status: 'pending',
        verificationStatus: 'failed'
      };
      
      domainService.getDomainById.mockResolvedValue(mockDomain);
      domainService.updateDomain.mockImplementation((id, updates) => {
        return Promise.resolve({
          ...mockDomain,
          ...updates
        });
      });
      
      // Mock queue service
      queueService.addToQueue = jest.fn().mockResolvedValue({ id: 'new-job-123' });
      
      // Call the controller method
      await adminController.retryDomainVerification(mockReq, mockRes);
      
      // Assertions
      expect(domainService.getDomainById).toHaveBeenCalledWith('domain-123');
      expect(domainService.updateDomain).toHaveBeenCalledWith(
        'domain-123',
        expect.objectContaining({
          verificationStatus: 'pending'
        })
      );
      
      expect(queueService.addToQueue).toHaveBeenCalled();
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining('Domain verification queued for retry'),
        domain: expect.objectContaining({
          id: 'domain-123',
          verificationStatus: 'pending'
        })
      });
    });
    
    it('should not retry already verified domains', async () => {
      // Set up request
      mockReq.params.domainId = 'domain-123';
      
      // Mock domain data - verified domain
      const mockDomain = {
        id: 'domain-123',
        name: 'example.com',
        websiteId: 'website-123',
        status: 'active',
        verificationStatus: 'verified'
      };
      
      domainService.getDomainById.mockResolvedValue(mockDomain);
      
      // Call the controller method
      await adminController.retryDomainVerification(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Only failed verifications can be retried',
        details: expect.any(String)
      });
      
      expect(domainService.updateDomain).not.toHaveBeenCalled();
      expect(queueService.addToQueue).not.toHaveBeenCalled();
    });
    
    it('should handle domain not found', async () => {
      // Set up request
      mockReq.params.domainId = 'non-existent-id';
      
      // Mock domain not found
      domainService.getDomainById.mockResolvedValue(null);
      
      // Call the controller method
      await adminController.retryDomainVerification(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Domain not found',
        details: expect.any(String)
      });
    });
    
    it('should handle service errors', async () => {
      // Set up request
      mockReq.params.domainId = 'domain-123';
      
      // Mock service error
      domainService.getDomainById.mockRejectedValue(new Error('Service Error'));
      
      // Call the controller method
      await adminController.retryDomainVerification(mockReq, mockRes);
      
      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to retry domain verification',
        details: expect.any(String)
      });
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error retrying domain verification'), expect.any(Error));
    });
  });
});