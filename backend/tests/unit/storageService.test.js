const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Mock AWS services
jest.mock('aws-sdk', () => {
  const mockS3Instance = {
    upload: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue({
      Location: 'https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/test-file.jpg',
      Key: 'uploads/user-123/test-file.jpg',
      Bucket: 'landingpad-dxp-dev'
    }),
    getSignedUrl: jest.fn().mockReturnValue('https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/test-file.jpg?signature'),
    deleteObject: jest.fn().mockReturnThis(),
    headBucket: jest.fn().mockReturnThis()
  };

  return {
    S3: jest.fn(() => mockS3Instance)
  };
});

// Mock file system functions
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(Buffer.from('test file content')),
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined)
  },
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    write: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  }),
  existsSync: jest.fn().mockReturnValue(true)
}));

// After mocking dependencies, require the module under test
const storageService = require('../../src/services/storageService');

describe('Storage Service', () => {
  let originalEnv;
  let s3Instance;

  beforeEach(() => {
    // Save the original environment
    originalEnv = { ...process.env };
    
    // Set up test environment variables
    process.env.S3_ENABLED = 'true';
    process.env.S3_ACCESS_KEY_ID = 'test-access-key';
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_UPLOADS_BUCKET = 'landingpad-dxp-dev-uploads';
    process.env.S3_STORAGE_BUCKET = 'landingpad-dxp-dev-storage';
    
    // Get the mock S3 instance
    s3Instance = new AWS.S3();
    
    // Clear mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore the original environment
    process.env = originalEnv;
  });

  describe('S3 Integration', () => {
    it('should initialize with S3 when enabled', () => {
      // Test that the S3 client was initialized correctly
      expect(AWS.S3).toHaveBeenCalledWith({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1'
      });
    });

    it('should fall back to local storage when S3 is disabled', () => {
      // Disable S3
      process.env.S3_ENABLED = 'false';
      
      // Reload the module to pick up new environment settings
      jest.resetModules();
      const localStorageService = require('../../src/services/storageService');
      
      // Test local storage is used
      expect(AWS.S3).not.toHaveBeenCalled();
      expect(localStorageService.isS3Enabled()).toBe(false);
    });

    it('should upload a file to S3 successfully', async () => {
      const fileData = {
        buffer: Buffer.from('test image content'),
        mimetype: 'image/jpeg',
        originalname: 'test-image.jpg',
        userId: 'user-123',
        folder: 'uploads'
      };

      const result = await storageService.uploadFile(fileData);

      // Verify S3 upload was called
      expect(s3Instance.upload).toHaveBeenCalledWith({
        Bucket: 'landingpad-dxp-dev-uploads',
        Key: expect.stringContaining('uploads/user-123/'),
        Body: fileData.buffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
      });

      // Verify expected result
      expect(result).toEqual({
        url: 'https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/test-file.jpg',
        key: 'uploads/user-123/test-file.jpg',
        bucket: 'landingpad-dxp-dev'
      });
    });

    it('should generate a signed URL for S3 file', async () => {
      const result = await storageService.getSignedUrl('test-file.jpg', 'user-123');

      // Verify getSignedUrl was called
      expect(s3Instance.getSignedUrl).toHaveBeenCalledWith('getObject', {
        Bucket: expect.any(String),
        Key: expect.stringContaining('user-123'),
        Expires: expect.any(Number)
      });

      // Verify expected result
      expect(result).toBe('https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/test-file.jpg?signature');
    });

    it('should delete a file from S3 successfully', async () => {
      await storageService.deleteFile('uploads/user-123/test-file.jpg');

      // Verify deleteObject was called
      expect(s3Instance.deleteObject).toHaveBeenCalledWith({
        Bucket: 'landingpad-dxp-dev-uploads',
        Key: 'uploads/user-123/test-file.jpg'
      });
    });

    it('should check S3 connection successfully', async () => {
      const result = await storageService.checkHealth();

      // Verify headBucket was called
      expect(s3Instance.headBucket).toHaveBeenCalledWith({
        Bucket: 'landingpad-dxp-dev-uploads'
      });

      // Verify expected result
      expect(result).toEqual({
        healthy: true,
        s3Enabled: true,
        message: 'S3 storage is connected and healthy'
      });
    });

    it('should handle S3 connection error gracefully', async () => {
      // Mock S3 headBucket to reject with an error
      s3Instance.promise.mockRejectedValueOnce(new Error('S3 connection failed'));

      const result = await storageService.checkHealth();

      // Verify headBucket was called
      expect(s3Instance.headBucket).toHaveBeenCalled();

      // Verify expected result
      expect(result).toEqual({
        healthy: false,
        s3Enabled: true,
        message: expect.stringContaining('S3 connection error')
      });
    });
  });

  describe('Local Storage Fallback', () => {
    beforeEach(() => {
      // Disable S3
      process.env.S3_ENABLED = 'false';
      
      // Reload the module to pick up new environment settings
      jest.resetModules();
      const reloadedModule = require('../../src/services/storageService');
      // Replace the original module with the reloaded one
      Object.assign(storageService, reloadedModule);
    });

    it('should use local filesystem for uploads when S3 is disabled', async () => {
      const fileData = {
        buffer: Buffer.from('test image content'),
        mimetype: 'image/jpeg',
        originalname: 'test-image.jpg',
        userId: 'user-123',
        folder: 'uploads'
      };

      const result = await storageService.uploadFile(fileData);

      // Verify writeFile was called
      expect(fs.promises.writeFile).toHaveBeenCalled();

      // Verify mkdir was called to ensure directory exists
      expect(fs.promises.mkdir).toHaveBeenCalled();

      // Verify expected result with local path
      expect(result).toEqual({
        url: expect.stringContaining('/uploads/user-123/'),
        key: expect.stringContaining('user-123'),
        local: true
      });
    });

    it('should delete a local file successfully', async () => {
      await storageService.deleteFile('uploads/user-123/test-file.jpg');

      // Verify unlink was called to delete the file
      expect(fs.promises.unlink).toHaveBeenCalled();
    });

    it('should check local storage health successfully', async () => {
      const result = await storageService.checkHealth();

      // Verify expected result
      expect(result).toEqual({
        healthy: true,
        s3Enabled: false,
        message: 'Local storage is being used'
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle file uploads with unusual file types', async () => {
      const fileData = {
        buffer: Buffer.from('test file content'),
        mimetype: 'application/x-custom-type',
        originalname: 'unusual.xyz',
        userId: 'user-123',
        folder: 'uploads'
      };

      const result = await storageService.uploadFile(fileData);

      // Verify upload was called with correct content type
      expect(s3Instance.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'application/x-custom-type'
        })
      );

      // Verify result
      expect(result).toBeDefined();
    });

    it('should handle files with spaces and special characters in names', async () => {
      const fileData = {
        buffer: Buffer.from('test file content'),
        mimetype: 'text/plain',
        originalname: 'File with spaces & special chars!.txt',
        userId: 'user-123',
        folder: 'uploads'
      };

      const result = await storageService.uploadFile(fileData);

      // Verify upload was called with sanitized filename
      expect(s3Instance.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringMatching(/^uploads\/user-123\/.*file-with-spaces-special-chars.*\.txt$/)
        })
      );

      // Verify result
      expect(result).toBeDefined();
    });

    it('should handle S3 upload errors gracefully', async () => {
      // Mock S3 upload to reject with an error
      s3Instance.promise.mockRejectedValueOnce(new Error('S3 upload failed'));

      const fileData = {
        buffer: Buffer.from('test file content'),
        mimetype: 'text/plain',
        originalname: 'test.txt',
        userId: 'user-123',
        folder: 'uploads'
      };

      // Expect the uploadFile call to reject with an error
      await expect(storageService.uploadFile(fileData)).rejects.toThrow();

      // Verify upload was called
      expect(s3Instance.upload).toHaveBeenCalled();
    });

    it('should handle missing required parameters', async () => {
      // Missing userId
      const fileData = {
        buffer: Buffer.from('test file content'),
        mimetype: 'text/plain',
        originalname: 'test.txt',
        folder: 'uploads'
      };

      // Expect the uploadFile call to reject with an error
      await expect(storageService.uploadFile(fileData)).rejects.toThrow();
    });

    it('should handle directory creation errors in local mode', async () => {
      // Disable S3
      process.env.S3_ENABLED = 'false';
      
      // Reload the module
      jest.resetModules();
      const reloadedModule = require('../../src/services/storageService');
      Object.assign(storageService, reloadedModule);

      // Mock mkdir to reject with an error
      fs.promises.mkdir.mockRejectedValueOnce(new Error('Directory creation failed'));

      const fileData = {
        buffer: Buffer.from('test file content'),
        mimetype: 'text/plain',
        originalname: 'test.txt',
        userId: 'user-123',
        folder: 'uploads'
      };

      // Expect the uploadFile call to reject with an error
      await expect(storageService.uploadFile(fileData)).rejects.toThrow();

      // Verify mkdir was called
      expect(fs.promises.mkdir).toHaveBeenCalled();
    });
  });
});