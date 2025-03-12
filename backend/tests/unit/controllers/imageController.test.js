// Mocking modules before requiring the controller
jest.mock('../../../src/services/imageService/index', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  searchStockPhotos: jest.fn(),
  getRandomStockPhoto: jest.fn(),
  getImageDetails: jest.fn(),
  optimizeImage: jest.fn()
}));

jest.mock('../../../src/middleware/errorHandler', () => ({
  APIError: class APIError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Require the controller after mocking
const imageController = require('../../../src/controllers/imageController');
const imageService = require('../../../src/services/imageService/index');
const { APIError } = require('../../../src/middleware/errorHandler');

describe('Image Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request, response, and next function
    req = {
      user: {
        id: 'user-123'
      },
      params: {
        imageId: 'image-123'
      },
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  describe('uploadImage', () => {
    it('should upload an image successfully', async () => {
      // Mock file in request
      req.file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test image data')
      };

      const uploadedImage = {
        id: 'image-123',
        userId: 'user-123',
        fileName: 'image-123.jpg',
        originalName: 'test.jpg',
        filePath: '/uploads/user-123/image-123.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        createdAt: new Date()
      };

      // Mock service response
      imageService.uploadImage.mockResolvedValue(uploadedImage);

      // Call the controller method
      await imageController.uploadImage(req, res, next);

      // Assertions
      expect(imageService.uploadImage).toHaveBeenCalledWith(req.file, 'user-123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Image uploaded successfully',
        image: uploadedImage
      });
    });

    it('should return 400 if no image file provided', async () => {
      // No file in request
      req.file = null;

      // Call the controller method
      await imageController.uploadImage(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(APIError);
      expect(next.mock.calls[0][0].message).toBe('No image file provided');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(imageService.uploadImage).not.toHaveBeenCalled();
    });

    it('should pass service errors to error handler', async () => {
      // Mock file in request
      req.file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test image data')
      };

      // Mock service error
      const error = new Error('Upload failed');
      imageService.uploadImage.mockRejectedValue(error);

      // Call the controller method
      await imageController.uploadImage(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteImage', () => {
    it('should delete an image successfully', async () => {
      // Mock request body
      req.body = {
        imagePath: '/uploads/user-123/image-123.jpg'
      };

      // Mock service response
      imageService.deleteImage.mockResolvedValue(true);

      // Call the controller method
      await imageController.deleteImage(req, res, next);

      // Assertions
      expect(imageService.deleteImage).toHaveBeenCalledWith('/uploads/user-123/image-123.jpg');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Image deleted successfully'
      });
    });

    it('should return 400 if image path is not provided', async () => {
      // Empty request body
      req.body = {};

      // Call the controller method
      await imageController.deleteImage(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(APIError);
      expect(next.mock.calls[0][0].message).toBe('Image path is required');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(imageService.deleteImage).not.toHaveBeenCalled();
    });

    it('should pass service errors to error handler', async () => {
      // Mock request body
      req.body = {
        imagePath: '/uploads/user-123/image-123.jpg'
      };

      // Mock service error
      const error = new Error('Delete failed');
      imageService.deleteImage.mockRejectedValue(error);

      // Call the controller method
      await imageController.deleteImage(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('searchStockPhotos', () => {
    it('should search stock photos successfully', async () => {
      // Mock query parameters
      req.query = {
        query: 'nature',
        page: '2',
        per_page: '15',
        orientation: 'portrait'
      };

      const searchResults = {
        results: [
          {
            id: 'photo-1',
            description: 'Mountain landscape',
            url: 'https://example.com/photo1.jpg',
            thumbnail: 'https://example.com/photo1-thumb.jpg',
            photographer: 'John Doe',
            photographerUrl: 'https://example.com/johndoe'
          }
        ],
        total: 100,
        totalPages: 7
      };

      // Mock service response
      imageService.searchStockPhotos.mockResolvedValue(searchResults);

      // Call the controller method
      await imageController.searchStockPhotos(req, res, next);

      // Assertions
      expect(imageService.searchStockPhotos).toHaveBeenCalledWith('nature', {
        page: 2,
        per_page: 15,
        orientation: 'portrait'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        ...searchResults
      });
    });

    it('should use default values for missing query parameters', async () => {
      // Only provide search query
      req.query = {
        query: 'nature'
      };

      const searchResults = {
        results: [],
        total: 0,
        totalPages: 0
      };

      // Mock service response
      imageService.searchStockPhotos.mockResolvedValue(searchResults);

      // Call the controller method
      await imageController.searchStockPhotos(req, res, next);

      // Assertions
      expect(imageService.searchStockPhotos).toHaveBeenCalledWith('nature', {
        page: 1,
        per_page: 20,
        orientation: 'landscape'
      });
    });

    it('should return 400 if search query is not provided', async () => {
      // Empty query parameters
      req.query = {};

      // Call the controller method
      await imageController.searchStockPhotos(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(APIError);
      expect(next.mock.calls[0][0].message).toBe('Search query is required');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(imageService.searchStockPhotos).not.toHaveBeenCalled();
    });

    it('should handle API errors properly', async () => {
      // Mock query parameters
      req.query = {
        query: 'nature'
      };

      // Mock API error
      const apiError = new Error('API error');
      apiError.response = {
        status: 429,
        data: {
          errors: 'Rate limit exceeded'
        }
      };
      imageService.searchStockPhotos.mockRejectedValue(apiError);

      // Call the controller method
      await imageController.searchStockPhotos(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      const passedError = next.mock.calls[0][0];
      expect(passedError).toBeInstanceOf(APIError);
      expect(passedError.message).toBe('Rate limit exceeded');
      expect(passedError.statusCode).toBe(429);
    });
  });

  describe('getRandomStockPhotos', () => {
    it('should get random stock photos successfully', async () => {
      // Mock query parameters
      req.query = {
        query: 'landscape',
        orientation: 'landscape',
        count: '3'
      };

      const randomPhotos = [
        {
          id: 'photo-1',
          description: 'Mountain landscape',
          url: 'https://example.com/photo1.jpg',
          thumbnail: 'https://example.com/photo1-thumb.jpg',
          photographer: 'John Doe',
          photographerUrl: 'https://example.com/johndoe'
        },
        {
          id: 'photo-2',
          description: 'Ocean view',
          url: 'https://example.com/photo2.jpg',
          thumbnail: 'https://example.com/photo2-thumb.jpg',
          photographer: 'Jane Smith',
          photographerUrl: 'https://example.com/janesmith'
        },
        {
          id: 'photo-3',
          description: 'Desert sunset',
          url: 'https://example.com/photo3.jpg',
          thumbnail: 'https://example.com/photo3-thumb.jpg',
          photographer: 'Bob Johnson',
          photographerUrl: 'https://example.com/bobjohnson'
        }
      ];

      // Mock service response
      imageService.getRandomStockPhoto.mockResolvedValue(randomPhotos);

      // Call the controller method
      await imageController.getRandomStockPhotos(req, res, next);

      // Assertions
      expect(imageService.getRandomStockPhoto).toHaveBeenCalledWith('landscape', {
        orientation: 'landscape',
        count: 3
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        photos: randomPhotos
      });
    });

    it('should handle a single photo result', async () => {
      // Mock query parameters (default count = 1)
      req.query = {
        query: 'landscape'
      };

      const singlePhoto = {
        id: 'photo-1',
        description: 'Mountain landscape',
        url: 'https://example.com/photo1.jpg',
        thumbnail: 'https://example.com/photo1-thumb.jpg',
        photographer: 'John Doe',
        photographerUrl: 'https://example.com/johndoe'
      };

      // Mock service response
      imageService.getRandomStockPhoto.mockResolvedValue(singlePhoto);

      // Call the controller method
      await imageController.getRandomStockPhotos(req, res, next);

      // Assertions
      expect(imageService.getRandomStockPhoto).toHaveBeenCalledWith('landscape', {
        orientation: 'landscape',
        count: 1
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        photos: [singlePhoto]
      });
    });

    it('should use default values when parameters are not provided', async () => {
      // Empty query parameters
      req.query = {};

      const randomPhoto = {
        id: 'photo-1',
        description: 'Random photo',
        url: 'https://example.com/random.jpg',
        thumbnail: 'https://example.com/random-thumb.jpg',
        photographer: 'Random Photographer',
        photographerUrl: 'https://example.com/random'
      };

      // Mock service response
      imageService.getRandomStockPhoto.mockResolvedValue(randomPhoto);

      // Call the controller method
      await imageController.getRandomStockPhotos(req, res, next);

      // Assertions
      expect(imageService.getRandomStockPhoto).toHaveBeenCalledWith(undefined, {
        orientation: 'landscape',
        count: 1
      });
    });

    it('should handle API errors properly', async () => {
      // Mock query parameters
      req.query = {
        query: 'landscape'
      };

      // Mock API error
      const apiError = new Error('API error');
      apiError.response = {
        status: 429,
        data: {
          errors: 'Rate limit exceeded'
        }
      };
      imageService.getRandomStockPhoto.mockRejectedValue(apiError);

      // Call the controller method
      await imageController.getRandomStockPhotos(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      const passedError = next.mock.calls[0][0];
      expect(passedError).toBeInstanceOf(APIError);
      expect(passedError.message).toBe('Rate limit exceeded');
      expect(passedError.statusCode).toBe(429);
    });
  });

  describe('getImageDetails', () => {
    it('should get image details successfully', async () => {
      const image = {
        id: 'image-123',
        fileName: 'image-123.jpg',
        originalName: 'example.jpg',
        filePath: '/uploads/user123/image-123.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg',
        createdAt: new Date()
      };

      // Mock service response
      imageService.getImageDetails.mockResolvedValue(image);

      // Call the controller method
      await imageController.getImageDetails(req, res, next);

      // Assertions
      expect(imageService.getImageDetails).toHaveBeenCalledWith('image-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        image
      });
    });

    it('should return 400 if image ID is not provided', async () => {
      // Remove image ID from params
      req.params = {};

      // Call the controller method
      await imageController.getImageDetails(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(APIError);
      expect(next.mock.calls[0][0].message).toBe('Image ID is required');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(imageService.getImageDetails).not.toHaveBeenCalled();
    });

    it('should pass service errors to error handler', async () => {
      // Mock service error
      const error = new Error('Image not found');
      imageService.getImageDetails.mockRejectedValue(error);

      // Call the controller method
      await imageController.getImageDetails(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('optimizeImage', () => {
    it('should optimize an image successfully', async () => {
      // Mock request body
      req.body = {
        width: 800,
        height: 600,
        quality: 85
      };

      const image = {
        id: 'image-123',
        fileName: 'image-123.jpg',
        originalName: 'example.jpg',
        filePath: '/uploads/user123/image-123.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg',
        createdAt: new Date()
      };

      const optimizedImage = {
        originalPath: '/uploads/user123/image-123.jpg',
        optimizedPath: '/uploads/user123/image-123_optimized.jpg',
        width: 800,
        height: 600,
        quality: 85
      };

      // Mock service responses
      imageService.getImageDetails.mockResolvedValue(image);
      imageService.optimizeImage.mockResolvedValue(optimizedImage);

      // Call the controller method
      await imageController.optimizeImage(req, res, next);

      // Assertions
      expect(imageService.getImageDetails).toHaveBeenCalledWith('image-123');
      expect(imageService.optimizeImage).toHaveBeenCalledWith('/uploads/user123/image-123.jpg', {
        width: 800,
        height: 600,
        quality: 85
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Image optimized successfully',
        image: optimizedImage
      });
    });

    it('should use default values for missing optimization parameters', async () => {
      // Empty request body
      req.body = {};

      const image = {
        id: 'image-123',
        fileName: 'image-123.jpg',
        originalName: 'example.jpg',
        filePath: '/uploads/user123/image-123.jpg',
        fileSize: 12345,
        mimeType: 'image/jpeg',
        createdAt: new Date()
      };

      const optimizedImage = {
        originalPath: '/uploads/user123/image-123.jpg',
        optimizedPath: '/uploads/user123/image-123_optimized.jpg',
        width: null,
        height: null,
        quality: 80
      };

      // Mock service responses
      imageService.getImageDetails.mockResolvedValue(image);
      imageService.optimizeImage.mockResolvedValue(optimizedImage);

      // Call the controller method
      await imageController.optimizeImage(req, res, next);

      // Assertions
      expect(imageService.optimizeImage).toHaveBeenCalledWith('/uploads/user123/image-123.jpg', {
        width: null,
        height: null,
        quality: 80
      });
    });

    it('should return 400 if image ID is not provided', async () => {
      // Remove image ID from params
      req.params = {};

      // Call the controller method
      await imageController.optimizeImage(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(APIError);
      expect(next.mock.calls[0][0].message).toBe('Image ID is required');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(imageService.getImageDetails).not.toHaveBeenCalled();
      expect(imageService.optimizeImage).not.toHaveBeenCalled();
    });

    it('should pass service errors to error handler', async () => {
      // Mock service error
      const error = new Error('Image not found');
      imageService.getImageDetails.mockRejectedValue(error);

      // Call the controller method
      await imageController.optimizeImage(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});