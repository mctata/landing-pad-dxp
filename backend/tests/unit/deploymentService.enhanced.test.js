const deploymentService = require('../../src/services/deploymentService');
const { Deployment } = require('../../src/models');
const logger = require('../../src/utils/logger');
const axios = require('axios');

// Mock the models, axios, and other dependencies
jest.mock('../../src/models', () => ({
  Deployment: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn()
  }
}));

jest.mock('axios');

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Deployment Service - Enhanced Features', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('validateDeployment', () => {
    it('should validate deployment files successfully', async () => {
      // Mock data
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        files: [
          { path: 'index.html', content: '<html><body>Hello</body></html>' },
          { path: 'styles.css', content: 'body { color: black; }' },
          { path: 'script.js', content: 'console.log("Hello");' }
        ]
      };
      
      // Call the service method
      const result = await deploymentService.validateDeployment(deployment);
      
      // Assertions
      expect(result).toEqual({
        valid: true,
        errors: []
      });
    });
    
    it('should detect missing index.html', async () => {
      // Mock data without index.html
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        files: [
          { path: 'styles.css', content: 'body { color: black; }' },
          { path: 'script.js', content: 'console.log("Hello");' }
        ]
      };
      
      // Call the service method
      const result = await deploymentService.validateDeployment(deployment);
      
      // Assertions
      expect(result).toEqual({
        valid: false,
        errors: [
          expect.objectContaining({
            type: 'missing_file',
            message: expect.stringContaining('index.html')
          })
        ]
      });
    });
    
    it('should detect invalid HTML', async () => {
      // Mock data with invalid HTML
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        files: [
          { path: 'index.html', content: '<html><body>Hello</body>' }, // Missing closing html tag
          { path: 'styles.css', content: 'body { color: black; }' }
        ]
      };
      
      // Call the service method
      const result = await deploymentService.validateDeployment(deployment);
      
      // Assertions
      expect(result).toEqual({
        valid: false,
        errors: [
          expect.objectContaining({
            type: 'invalid_html',
            message: expect.stringContaining('HTML validation failed')
          })
        ]
      });
    });
    
    it('should detect invalid CSS', async () => {
      // Mock data with invalid CSS
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        files: [
          { path: 'index.html', content: '<html><body>Hello</body></html>' },
          { path: 'styles.css', content: 'body { color: ; }' } // Invalid CSS
        ]
      };
      
      // Call the service method
      const result = await deploymentService.validateDeployment(deployment);
      
      // Assertions
      expect(result).toEqual({
        valid: false,
        errors: [
          expect.objectContaining({
            type: 'invalid_css',
            message: expect.stringContaining('CSS validation failed')
          })
        ]
      });
    });
    
    it('should detect oversized files', async () => {
      // Create a large string
      const largeContent = 'x'.repeat(5 * 1024 * 1024); // 5MB
      
      // Mock data with oversized file
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        files: [
          { path: 'index.html', content: '<html><body>Hello</body></html>' },
          { path: 'large-file.txt', content: largeContent }
        ]
      };
      
      // Call the service method
      const result = await deploymentService.validateDeployment(deployment);
      
      // Assertions
      expect(result).toEqual({
        valid: false,
        errors: [
          expect.objectContaining({
            type: 'file_too_large',
            message: expect.stringContaining('exceeds maximum allowed size')
          })
        ]
      });
    });
  });
  
  describe('validateDeployedWebsite', () => {
    it('should validate deployed website successfully', async () => {
      // Mock data
      const deploymentId = 'deployment-123';
      const websiteUrl = 'https://example.com';
      
      // Mock deployment
      const mockDeployment = {
        id: deploymentId,
        websiteId: 'website-123',
        url: websiteUrl,
        status: 'in_progress'
      };
      
      Deployment.findByPk.mockResolvedValue(mockDeployment);
      
      // Mock axios response for website check
      axios.get.mockResolvedValueOnce({
        status: 200,
        data: '<html><head><title>Test Site</title></head><body>Hello World</body></html>'
      });
      
      // Call the service method
      const result = await deploymentService.validateDeployedWebsite(deploymentId);
      
      // Assertions
      expect(Deployment.findByPk).toHaveBeenCalledWith(deploymentId);
      expect(axios.get).toHaveBeenCalledWith(websiteUrl, expect.any(Object));
      expect(result).toEqual({
        valid: true,
        checks: expect.arrayContaining([
          { name: 'accessibility', passed: true },
          { name: 'page_load', passed: true }
        ])
      });
    });
    
    it('should fail validation for inaccessible website', async () => {
      // Mock data
      const deploymentId = 'deployment-123';
      const websiteUrl = 'https://example.com';
      
      // Mock deployment
      const mockDeployment = {
        id: deploymentId,
        websiteId: 'website-123',
        url: websiteUrl,
        status: 'in_progress'
      };
      
      Deployment.findByPk.mockResolvedValue(mockDeployment);
      
      // Mock axios response with error
      const httpError = new Error('Connection refused');
      axios.get.mockRejectedValue(httpError);
      
      // Call the service method
      const result = await deploymentService.validateDeployedWebsite(deploymentId);
      
      // Assertions
      expect(result).toEqual({
        valid: false,
        checks: expect.arrayContaining([
          {
            name: 'accessibility',
            passed: false,
            error: expect.stringContaining('Failed to access')
          }
        ])
      });
    });
    
    it('should fail validation for non-200 status code', async () => {
      // Mock data
      const deploymentId = 'deployment-123';
      const websiteUrl = 'https://example.com';
      
      // Mock deployment
      const mockDeployment = {
        id: deploymentId,
        websiteId: 'website-123',
        url: websiteUrl,
        status: 'in_progress'
      };
      
      Deployment.findByPk.mockResolvedValue(mockDeployment);
      
      // Mock axios response with non-200 status
      axios.get.mockResolvedValueOnce({
        status: 404,
        data: 'Not Found'
      });
      
      // Call the service method
      const result = await deploymentService.validateDeployedWebsite(deploymentId);
      
      // Assertions
      expect(result).toEqual({
        valid: false,
        checks: expect.arrayContaining([
          {
            name: 'page_load',
            passed: false,
            error: expect.stringContaining('Unexpected status code: 404')
          }
        ])
      });
    });
    
    it('should fail validation for missing HTML structure', async () => {
      // Mock data
      const deploymentId = 'deployment-123';
      const websiteUrl = 'https://example.com';
      
      // Mock deployment
      const mockDeployment = {
        id: deploymentId,
        websiteId: 'website-123',
        url: websiteUrl,
        status: 'in_progress'
      };
      
      Deployment.findByPk.mockResolvedValue(mockDeployment);
      
      // Mock axios response with invalid HTML
      axios.get.mockResolvedValueOnce({
        status: 200,
        data: 'This is not HTML'
      });
      
      // Call the service method
      const result = await deploymentService.validateDeployedWebsite(deploymentId);
      
      // Assertions
      expect(result).toEqual({
        valid: false,
        checks: expect.arrayContaining([
          {
            name: 'html_structure',
            passed: false,
            error: expect.stringContaining('Invalid HTML structure')
          }
        ])
      });
    });
    
    it('should throw error if deployment not found', async () => {
      // Mock deployment not found
      Deployment.findByPk.mockResolvedValue(null);
      
      // Call the service method and expect error
      await expect(deploymentService.validateDeployedWebsite('non-existent-id'))
        .rejects.toThrow('Deployment not found');
    });
  });
  
  describe('deployToProvider', () => {
    it('should deploy successfully to provider', async () => {
      // Mock data
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        files: [
          { path: 'index.html', content: '<html><body>Hello</body></html>' }
        ],
        status: 'queued',
        save: jest.fn().mockResolvedValue(true)
      };
      const provider = 'vercel';
      
      // Mock validation
      jest.spyOn(deploymentService, 'validateDeployment').mockResolvedValue({
        valid: true,
        errors: []
      });
      
      // Mock axios responses for deployment API calls
      axios.post.mockResolvedValueOnce({
        status: 200,
        data: { deploymentId: 'vercel-deployment-123', url: 'https://example.vercel.app' }
      });
      
      // Mock deployed website validation
      jest.spyOn(deploymentService, 'validateDeployedWebsite').mockResolvedValue({
        valid: true,
        checks: [
          { name: 'accessibility', passed: true },
          { name: 'page_load', passed: true },
          { name: 'html_structure', passed: true }
        ]
      });
      
      // Call the service method
      const result = await deploymentService.deployToProvider(deployment, provider);
      
      // Assertions
      expect(deploymentService.validateDeployment).toHaveBeenCalledWith(deployment);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/deploy'),
        expect.objectContaining({
          files: deployment.files,
          websiteId: deployment.websiteId
        }),
        expect.any(Object)
      );
      
      expect(deployment.status).toBe('success');
      expect(deployment.providerDeploymentId).toBe('vercel-deployment-123');
      expect(deployment.url).toBe('https://example.vercel.app');
      expect(deployment.completedAt).toBeDefined();
      expect(deployment.buildTime).toBeGreaterThanOrEqual(0);
      
      expect(deployment.save).toHaveBeenCalled();
      expect(result).toEqual(deployment);
    });
    
    it('should handle validation failures before deployment', async () => {
      // Mock data
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        files: [
          // Missing index.html
          { path: 'styles.css', content: 'body { color: black; }' }
        ],
        status: 'queued',
        save: jest.fn().mockResolvedValue(true)
      };
      const provider = 'vercel';
      
      // Mock validation failure
      jest.spyOn(deploymentService, 'validateDeployment').mockResolvedValue({
        valid: false,
        errors: [
          { type: 'missing_file', message: 'Missing required file: index.html' }
        ]
      });
      
      // Call the service method
      const result = await deploymentService.deployToProvider(deployment, provider);
      
      // Assertions
      expect(deployment.status).toBe('failed');
      expect(deployment.errorMessage).toContain('Missing required file');
      expect(axios.post).not.toHaveBeenCalled(); // API should not be called
      expect(deployment.save).toHaveBeenCalled();
    });
    
    it('should handle API errors during deployment', async () => {
      // Mock data
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        files: [
          { path: 'index.html', content: '<html><body>Hello</body></html>' }
        ],
        status: 'queued',
        save: jest.fn().mockResolvedValue(true)
      };
      const provider = 'vercel';
      
      // Mock validation success
      jest.spyOn(deploymentService, 'validateDeployment').mockResolvedValue({
        valid: true,
        errors: []
      });
      
      // Mock API error
      const apiError = new Error('API Error');
      apiError.response = {
        status: 500,
        data: { error: 'Internal Server Error' }
      };
      axios.post.mockRejectedValue(apiError);
      
      // Call the service method
      const result = await deploymentService.deployToProvider(deployment, provider);
      
      // Assertions
      expect(deployment.status).toBe('failed');
      expect(deployment.errorMessage).toContain('API Error');
      expect(deployment.save).toHaveBeenCalled();
    });
    
    it('should handle validation failures after deployment', async () => {
      // Mock data
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        files: [
          { path: 'index.html', content: '<html><body>Hello</body></html>' }
        ],
        status: 'queued',
        save: jest.fn().mockResolvedValue(true)
      };
      const provider = 'vercel';
      
      // Mock pre-deployment validation success
      jest.spyOn(deploymentService, 'validateDeployment').mockResolvedValue({
        valid: true,
        errors: []
      });
      
      // Mock API success
      axios.post.mockResolvedValueOnce({
        status: 200,
        data: { deploymentId: 'vercel-deployment-123', url: 'https://example.vercel.app' }
      });
      
      // Mock post-deployment validation failure
      jest.spyOn(deploymentService, 'validateDeployedWebsite').mockResolvedValue({
        valid: false,
        checks: [
          { name: 'accessibility', passed: false, error: 'Site not accessible' }
        ]
      });
      
      // Call the service method
      const result = await deploymentService.deployToProvider(deployment, provider);
      
      // Assertions
      expect(deployment.status).toBe('failed');
      expect(deployment.errorMessage).toContain('Deployed website validation failed');
      expect(deployment.providerDeploymentId).toBe('vercel-deployment-123');
      expect(deployment.url).toBe('https://example.vercel.app');
      expect(deployment.save).toHaveBeenCalled();
    });
    
    it('should retry API calls on transient errors', async () => {
      // Mock data
      const deployment = {
        id: 'deployment-123',
        websiteId: 'website-123',
        files: [
          { path: 'index.html', content: '<html><body>Hello</body></html>' }
        ],
        status: 'queued',
        save: jest.fn().mockResolvedValue(true)
      };
      const provider = 'vercel';
      
      // Mock validation success
      jest.spyOn(deploymentService, 'validateDeployment').mockResolvedValue({
        valid: true,
        errors: []
      });
      
      // Mock API error first time, success second time
      const networkError = new Error('Network Error');
      networkError.code = 'ECONNRESET';
      
      axios.post.mockRejectedValueOnce(networkError).mockResolvedValueOnce({
        status: 200,
        data: { deploymentId: 'vercel-deployment-123', url: 'https://example.vercel.app' }
      });
      
      // Mock deployed website validation
      jest.spyOn(deploymentService, 'validateDeployedWebsite').mockResolvedValue({
        valid: true,
        checks: [
          { name: 'accessibility', passed: true }
        ]
      });
      
      // Call the service method
      const result = await deploymentService.deployToProvider(deployment, provider);
      
      // Assertions
      expect(axios.post).toHaveBeenCalledTimes(2); // Should have retried
      expect(deployment.status).toBe('success');
      expect(deployment.save).toHaveBeenCalled();
    });
  });
});