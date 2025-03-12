const imageService = require('../services/imageService');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

/**
 * Controller for handling image-related requests
 */
const imageController = {
  /**
   * Upload an image
   * @route POST /api/images/upload
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        throw new APIError('No image file provided', 400);
      }
      
      const userId = req.user.id;
      const image = await imageService.uploadImage(req.file, userId);
      
      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        image,
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete an image
   * @route DELETE /api/images/:imageId
   */
  async deleteImage(req, res, next) {
    try {
      const { imagePath } = req.body;
      
      if (!imagePath) {
        throw new APIError('Image path is required', 400);
      }
      
      await imageService.deleteImage(imagePath);
      
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Search for stock photos
   * @route GET /api/images/stock/search
   */
  async searchStockPhotos(req, res, next) {
    try {
      const { query, page, per_page, orientation } = req.query;
      
      if (!query) {
        throw new APIError('Search query is required', 400);
      }
      
      const options = {
        page: parseInt(page) || 1,
        per_page: parseInt(per_page) || 20,
        orientation: orientation || 'landscape',
      };
      
      const results = await imageService.searchStockPhotos(query, options);
      
      res.status(200).json({
        success: true,
        ...results,
      });
    } catch (error) {
      logger.error('Error searching stock photos:', error);
      
      // Handle specific API errors
      if (error.response && error.response.data) {
        next(new APIError(
          error.response.data.errors || 'Error searching stock photos',
          error.response.status || 500
        ));
      } else {
        next(error);
      }
    }
  },
  
  /**
   * Get random stock photos
   * @route GET /api/images/stock/random
   */
  async getRandomStockPhotos(req, res, next) {
    try {
      const { query, orientation, count } = req.query;
      
      const options = {
        orientation: orientation || 'landscape',
        count: parseInt(count) || 1,
      };
      
      const photos = await imageService.getRandomStockPhoto(query, options);
      
      res.status(200).json({
        success: true,
        photos: Array.isArray(photos) ? photos : [photos],
      });
    } catch (error) {
      logger.error('Error getting random stock photos:', error);
      
      // Handle specific API errors
      if (error.response && error.response.data) {
        next(new APIError(
          error.response.data.errors || 'Error getting random stock photos',
          error.response.status || 500
        ));
      } else {
        next(error);
      }
    }
  },
  
  /**
   * Get image details
   * @route GET /api/images/:imageId
   */
  async getImageDetails(req, res, next) {
    try {
      const { imageId } = req.params;
      
      if (!imageId) {
        throw new APIError('Image ID is required', 400);
      }
      
      const image = await imageService.getImageDetails(imageId);
      
      res.status(200).json({
        success: true,
        image,
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Optimize an image
   * @route POST /api/images/:imageId/optimize
   */
  async optimizeImage(req, res, next) {
    try {
      const { imageId } = req.params;
      const { width, height, quality } = req.body;
      
      if (!imageId) {
        throw new APIError('Image ID is required', 400);
      }
      
      // Get the image details first
      const image = await imageService.getImageDetails(imageId);
      
      // Optimize the image
      const options = {
        width: parseInt(width) || null,
        height: parseInt(height) || null,
        quality: parseInt(quality) || 80,
      };
      
      const optimizedImage = await imageService.optimizeImage(image.filePath, options);
      
      res.status(200).json({
        success: true,
        message: 'Image optimized successfully',
        image: optimizedImage,
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = imageController;