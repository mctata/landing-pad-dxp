const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

/**
 * Service for managing images, including uploads and integration with stock photo APIs
 */
const imageService = {
  /**
   * Upload an image to the server
   * @param {Object} imageFile - Image file from multer
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Uploaded image details
   */
  async uploadImage(imageFile, userId) {
    try {
      if (!imageFile) {
        throw new Error('No image file provided');
      }
      
      // Generate a unique filename
      const fileExtension = path.extname(imageFile.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      
      // Create user-specific directory if it doesn't exist
      const userUploadDir = path.join(__dirname, '../../../uploads', userId);
      await fs.mkdir(userUploadDir, { recursive: true });
      
      // Save file to disk
      const filePath = path.join(userUploadDir, fileName);
      await fs.writeFile(filePath, imageFile.buffer);
      
      // Create relative path for storage in database
      const relativePath = `/uploads/${userId}/${fileName}`;
      
      logger.info(`Image uploaded: ${relativePath}`);
      
      return {
        id: uuidv4(),
        userId,
        fileName,
        originalName: imageFile.originalname,
        filePath: relativePath,
        fileSize: imageFile.size,
        mimeType: imageFile.mimetype,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw error;
    }
  },
  
  /**
   * Delete an image from the server
   * @param {string} imagePath - Path to the image
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteImage(imagePath) {
    try {
      // Ensure the path is not outside the uploads directory
      if (!imagePath.startsWith('/uploads/')) {
        throw new Error('Invalid image path');
      }
      
      // Convert relative path to absolute path
      const absolutePath = path.join(__dirname, '../../..', imagePath);
      
      // Check if the file exists
      await fs.access(absolutePath);
      
      // Delete the file
      await fs.unlink(absolutePath);
      
      logger.info(`Image deleted: ${imagePath}`);
      
      return true;
    } catch (error) {
      logger.error('Error deleting image:', error);
      throw error;
    }
  },
  
  /**
   * Search for stock photos from Unsplash API
   * @param {string} query - Search query
   * @param {Object} options - Search options (page, per_page, orientation)
   * @returns {Promise<Object>} - Search results
   */
  async searchStockPhotos(query, options = {}) {
    try {
      if (!process.env.UNSPLASH_ACCESS_KEY) {
        throw new Error('Unsplash API key not configured');
      }
      
      const { page = 1, per_page = 20, orientation = 'landscape' } = options;
      
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query,
          page,
          per_page,
          orientation,
        },
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      });
      
      return {
        results: response.data.results.map(photo => ({
          id: photo.id,
          description: photo.description || photo.alt_description || '',
          url: photo.urls.regular,
          thumbnail: photo.urls.thumb,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html,
        })),
        total: response.data.total,
        totalPages: response.data.total_pages,
      };
    } catch (error) {
      logger.error('Error searching stock photos:', error);
      throw error;
    }
  },
  
  /**
   * Get a random stock photo from Unsplash API
   * @param {string} query - Search query (optional)
   * @param {Object} options - Search options (orientation, count)
   * @returns {Promise<Object|Array>} - Random photo(s)
   */
  async getRandomStockPhoto(query, options = {}) {
    try {
      if (!process.env.UNSPLASH_ACCESS_KEY) {
        throw new Error('Unsplash API key not configured');
      }
      
      const { orientation = 'landscape', count = 1 } = options;
      
      const params = {
        orientation,
        count,
      };
      
      if (query) {
        params.query = query;
      }
      
      const response = await axios.get('https://api.unsplash.com/photos/random', {
        params,
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      });
      
      const formatPhoto = (photo) => ({
        id: photo.id,
        description: photo.description || photo.alt_description || '',
        url: photo.urls.regular,
        thumbnail: photo.urls.thumb,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
      });
      
      if (Array.isArray(response.data)) {
        return response.data.map(formatPhoto);
      }
      
      return formatPhoto(response.data);
    } catch (error) {
      logger.error('Error getting random stock photo:', error);
      throw error;
    }
  },
  
  /**
   * Get image details
   * @param {string} imageId - Image ID
   * @returns {Promise<Object>} - Image details
   */
  async getImageDetails(imageId) {
    // In a real implementation, this would fetch from a database
    // For demonstration purposes, we'll just return mock data
    return {
      id: imageId,
      fileName: `${imageId}.jpg`,
      originalName: 'example.jpg',
      filePath: `/uploads/user123/${imageId}.jpg`,
      fileSize: 12345,
      mimeType: 'image/jpeg',
      createdAt: new Date(),
    };
  },
  
  /**
   * Optimize an image
   * @param {string} imagePath - Path to the image
   * @param {Object} options - Optimization options (width, height, quality)
   * @returns {Promise<Object>} - Optimized image details
   */
  async optimizeImage(imagePath, options = {}) {
    // In a real implementation, this would use something like Sharp
    // to resize and optimize the image
    // For demonstration purposes, we'll just return mock data
    logger.info(`Image optimized: ${imagePath} with options:`, options);
    return {
      originalPath: imagePath,
      optimizedPath: imagePath.replace(/\.\w+$/, '_optimized$&'),
      width: options.width || 800,
      height: options.height || 600,
      quality: options.quality || 80,
    };
  }
};

module.exports = imageService;