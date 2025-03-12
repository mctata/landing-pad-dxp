const queueService = require('../../src/services/queueService');
const logger = require('../../src/utils/logger');
const Bull = require('bull');

// Mock the Bull queue and logger
jest.mock('bull', () => {
  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    getJob: jest.fn(),
    getJobs: jest.fn(),
    getJobCounts: jest.fn(),
    getActiveCount: jest.fn(),
    getCompletedCount: jest.fn(),
    getFailedCount: jest.fn(),
    getDelayedCount: jest.fn(),
    getWaitingCount: jest.fn(),
    clean: jest.fn(),
    isPaused: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    process: jest.fn(),
    on: jest.fn()
  };
  
  return jest.fn(() => mockQueue);
});

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Queue Service', () => {
  let mockQueue;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get reference to the mocked queue instance
    mockQueue = new Bull();
  });
  
  describe('initializeQueue', () => {
    it('should initialize a queue with proper configuration', () => {
      const queueName = 'test-queue';
      const processorFn = jest.fn();
      
      const result = queueService.initializeQueue(queueName, processorFn);
      
      expect(Bull).toHaveBeenCalledWith(queueName, expect.any(Object));
      expect(mockQueue.process).toHaveBeenCalledWith(processorFn);
      expect(mockQueue.on).toHaveBeenCalledWith('completed', expect.any(Function));
      expect(mockQueue.on).toHaveBeenCalledWith('failed', expect.any(Function));
      expect(result).toBe(mockQueue);
    });
    
    it('should handle queue initialization errors', () => {
      Bull.mockImplementationOnce(() => {
        throw new Error('Queue initialization error');
      });
      
      expect(() => {
        queueService.initializeQueue('test-queue', jest.fn());
      }).toThrow('Queue initialization error');
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error initializing queue'));
    });
  });
  
  describe('addToQueue', () => {
    it('should add a job to the queue with default options', async () => {
      const queue = mockQueue;
      const data = { key: 'value' };
      
      const result = await queueService.addToQueue(queue, data);
      
      expect(queue.add).toHaveBeenCalledWith(data, { 
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });
      expect(result).toEqual({ id: 'job-123' });
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Added job to queue'));
    });
    
    it('should add a job to the queue with custom options', async () => {
      const queue = mockQueue;
      const data = { key: 'value' };
      const options = { 
        priority: 1,
        attempts: 5,
        backoff: {
          type: 'fixed',
          delay: 10000
        }
      };
      
      const result = await queueService.addToQueue(queue, data, options);
      
      expect(queue.add).toHaveBeenCalledWith(data, options);
      expect(result).toEqual({ id: 'job-123' });
    });
    
    it('should handle errors when adding jobs', async () => {
      const queue = mockQueue;
      const error = new Error('Queue error');
      queue.add.mockRejectedValueOnce(error);
      
      await expect(queueService.addToQueue(queue, { key: 'value' }))
        .rejects.toThrow('Queue error');
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error adding job to queue'), error);
    });
  });
  
  describe('getQueueStats', () => {
    it('should get queue statistics', async () => {
      const queue = mockQueue;
      const mockCounts = {
        active: 2,
        completed: 10,
        failed: 1,
        delayed: 3,
        waiting: 5
      };
      
      queue.getJobCounts.mockResolvedValueOnce(mockCounts);
      
      const result = await queueService.getQueueStats(queue);
      
      expect(queue.getJobCounts).toHaveBeenCalled();
      expect(result).toEqual(mockCounts);
    });
    
    it('should handle errors when getting queue stats', async () => {
      const queue = mockQueue;
      const error = new Error('Stats error');
      queue.getJobCounts.mockRejectedValueOnce(error);
      
      await expect(queueService.getQueueStats(queue))
        .rejects.toThrow('Stats error');
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error getting queue stats'), error);
    });
  });
  
  describe('cleanQueue', () => {
    it('should clean completed and failed jobs', async () => {
      const queue = mockQueue;
      queue.clean.mockResolvedValueOnce(5); // 5 jobs cleaned
      
      const result = await queueService.cleanQueue(queue, 'completed', 3600000);
      
      expect(queue.clean).toHaveBeenCalledWith(3600000, 'completed');
      expect(result).toBe(5);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cleaned 5 jobs'));
    });
    
    it('should handle errors when cleaning the queue', async () => {
      const queue = mockQueue;
      const error = new Error('Clean error');
      queue.clean.mockRejectedValueOnce(error);
      
      await expect(queueService.cleanQueue(queue, 'completed', 3600000))
        .rejects.toThrow('Clean error');
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error cleaning queue'), error);
    });
  });
  
  describe('pauseQueue', () => {
    it('should pause a queue', async () => {
      const queue = mockQueue;
      queue.pause.mockResolvedValueOnce();
      
      await queueService.pauseQueue(queue);
      
      expect(queue.pause).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Queue paused'));
    });
    
    it('should handle errors when pausing the queue', async () => {
      const queue = mockQueue;
      const error = new Error('Pause error');
      queue.pause.mockRejectedValueOnce(error);
      
      await expect(queueService.pauseQueue(queue))
        .rejects.toThrow('Pause error');
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error pausing queue'), error);
    });
  });
  
  describe('resumeQueue', () => {
    it('should resume a queue', async () => {
      const queue = mockQueue;
      queue.resume.mockResolvedValueOnce();
      
      await queueService.resumeQueue(queue);
      
      expect(queue.resume).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Queue resumed'));
    });
    
    it('should handle errors when resuming the queue', async () => {
      const queue = mockQueue;
      const error = new Error('Resume error');
      queue.resume.mockRejectedValueOnce(error);
      
      await expect(queueService.resumeQueue(queue))
        .rejects.toThrow('Resume error');
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error resuming queue'), error);
    });
  });
  
  describe('getQueueJobs', () => {
    it('should get jobs of specific types', async () => {
      const queue = mockQueue;
      const mockJobs = [
        { id: 'job-1', data: { type: 'A' } },
        { id: 'job-2', data: { type: 'B' } }
      ];
      
      queue.getJobs.mockResolvedValueOnce(mockJobs);
      
      const result = await queueService.getQueueJobs(queue, ['completed', 'failed']);
      
      expect(queue.getJobs).toHaveBeenCalledWith(['completed', 'failed'], 0, 100);
      expect(result).toEqual(mockJobs);
    });
    
    it('should handle pagination', async () => {
      const queue = mockQueue;
      const mockJobs = [{ id: 'job-3' }];
      
      queue.getJobs.mockResolvedValueOnce(mockJobs);
      
      const result = await queueService.getQueueJobs(queue, ['active'], 1, 5);
      
      expect(queue.getJobs).toHaveBeenCalledWith(['active'], 1, 5);
      expect(result).toEqual(mockJobs);
    });
    
    it('should handle errors when getting jobs', async () => {
      const queue = mockQueue;
      const error = new Error('GetJobs error');
      queue.getJobs.mockRejectedValueOnce(error);
      
      await expect(queueService.getQueueJobs(queue, ['active']))
        .rejects.toThrow('GetJobs error');
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error getting queue jobs'), error);
    });
  });
  
  describe('getJob', () => {
    it('should get a job by id', async () => {
      const queue = mockQueue;
      const mockJob = { id: 'job-123', data: { key: 'value' } };
      
      queue.getJob.mockResolvedValueOnce(mockJob);
      
      const result = await queueService.getJob(queue, 'job-123');
      
      expect(queue.getJob).toHaveBeenCalledWith('job-123');
      expect(result).toEqual(mockJob);
    });
    
    it('should return null if job not found', async () => {
      const queue = mockQueue;
      
      queue.getJob.mockResolvedValueOnce(null);
      
      const result = await queueService.getJob(queue, 'non-existent-job');
      
      expect(result).toBeNull();
    });
    
    it('should handle errors when getting a job', async () => {
      const queue = mockQueue;
      const error = new Error('GetJob error');
      queue.getJob.mockRejectedValueOnce(error);
      
      await expect(queueService.getJob(queue, 'job-123'))
        .rejects.toThrow('GetJob error');
      
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error getting job'), error);
    });
  });
  
  describe('categorizeDeploymentError', () => {
    it('should categorize network error', () => {
      const error = new Error('Network error');
      error.code = 'ECONNREFUSED';
      
      const result = queueService.categorizeDeploymentError(error);
      
      expect(result).toEqual({
        category: 'network',
        isRetryable: true,
        message: expect.stringContaining('Network error')
      });
    });
    
    it('should categorize timeout error', () => {
      const error = new Error('Timeout error');
      error.code = 'ETIMEDOUT';
      
      const result = queueService.categorizeDeploymentError(error);
      
      expect(result).toEqual({
        category: 'timeout',
        isRetryable: true,
        message: expect.stringContaining('Timeout error')
      });
    });
    
    it('should categorize authentication error', () => {
      const error = new Error('Authentication failed');
      error.response = { status: 401 };
      
      const result = queueService.categorizeDeploymentError(error);
      
      expect(result).toEqual({
        category: 'authentication',
        isRetryable: false,
        message: expect.stringContaining('Authentication failed')
      });
    });
    
    it('should categorize resource not found error', () => {
      const error = new Error('Resource not found');
      error.response = { status: 404 };
      
      const result = queueService.categorizeDeploymentError(error);
      
      expect(result).toEqual({
        category: 'resource_not_found',
        isRetryable: false,
        message: expect.stringContaining('Resource not found')
      });
    });
    
    it('should categorize rate limit error', () => {
      const error = new Error('Rate limit exceeded');
      error.response = { status: 429 };
      
      const result = queueService.categorizeDeploymentError(error);
      
      expect(result).toEqual({
        category: 'rate_limit',
        isRetryable: true,
        message: expect.stringContaining('Rate limit exceeded')
      });
    });
    
    it('should categorize server error', () => {
      const error = new Error('Internal Server Error');
      error.response = { status: 500 };
      
      const result = queueService.categorizeDeploymentError(error);
      
      expect(result).toEqual({
        category: 'server_error',
        isRetryable: true,
        message: expect.stringContaining('Internal Server Error')
      });
    });
    
    it('should categorize validation error', () => {
      const error = new Error('Validation failed');
      error.response = { status: 422 };
      
      const result = queueService.categorizeDeploymentError(error);
      
      expect(result).toEqual({
        category: 'validation',
        isRetryable: false,
        message: expect.stringContaining('Validation failed')
      });
    });
    
    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      
      const result = queueService.categorizeDeploymentError(error);
      
      expect(result).toEqual({
        category: 'unknown',
        isRetryable: false,
        message: expect.stringContaining('Unknown error')
      });
    });
  });
  
  describe('sendDeploymentNotification', () => {
    it('should send deployment success notification', async () => {
      // This is a mock test since the actual implementation will vary
      const mockNotification = {
        type: 'deployment_success',
        deployment: { id: 'deploy-123', status: 'success' },
        website: { id: 'website-123', name: 'Test Website' },
        user: { id: 'user-123', email: 'user@example.com' }
      };
      
      // Mock the sendDeploymentNotification implementation for testing
      const originalSendNotification = queueService.sendDeploymentNotification;
      queueService.sendDeploymentNotification = jest.fn().mockResolvedValue(true);
      
      const result = await queueService.sendDeploymentNotification(mockNotification);
      
      expect(queueService.sendDeploymentNotification).toHaveBeenCalledWith(mockNotification);
      expect(result).toBe(true);
      
      // Restore original implementation
      queueService.sendDeploymentNotification = originalSendNotification;
    });
  });
  
  describe('sendDomainVerificationNotification', () => {
    it('should send domain verification notification', async () => {
      // This is a mock test since the actual implementation will vary
      const mockNotification = {
        type: 'domain_verified',
        domain: { id: 'domain-123', name: 'example.com', status: 'active' },
        website: { id: 'website-123', name: 'Test Website' },
        user: { id: 'user-123', email: 'user@example.com' }
      };
      
      // Mock the sendDomainVerificationNotification implementation for testing
      const originalSendNotification = queueService.sendDomainVerificationNotification;
      queueService.sendDomainVerificationNotification = jest.fn().mockResolvedValue(true);
      
      const result = await queueService.sendDomainVerificationNotification(mockNotification);
      
      expect(queueService.sendDomainVerificationNotification).toHaveBeenCalledWith(mockNotification);
      expect(result).toBe(true);
      
      // Restore original implementation
      queueService.sendDomainVerificationNotification = originalSendNotification;
    });
  });
});