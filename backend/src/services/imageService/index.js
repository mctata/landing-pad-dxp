const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');
const storageService = require('../storageService');

/**
 * Service for managing images, including uploads and integration with stock photo APIs
 */
const imageService = {
  /**
   * Upload an image to the server or S3
   * @param {Object} imageFile - Image file from multer
   * @param {string} userId - User ID
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Uploaded image details
   */
  async uploadImage(imageFile, userId, options = {}) {
    try {
      if (!imageFile) {
        throw new Error('No image file provided');
      }
      
      // Generate a unique filename
      const fileExtension = path.extname(imageFile.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      
      // Determine if we should use S3
      if (storageService.isS3Enabled) {
        logger.info(`Uploading image to S3 for user: ${userId}`);
        
        // Prepare file data for S3 upload
        const folder = options.folder || 'images';
        const uploadType = options.uploadType || 'uploads';
        
        // Upload to S3
        const uploadResult = await storageService.uploadFile({
          ...imageFile,
          uploadType
        }, folder, userId);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image to S3');
        }
        
        // Return the uploaded image details
        return {
          id: uuidv4(),
          userId,
          fileName: uploadResult.fileName,
          originalName: imageFile.originalname,
          filePath: uploadResult.filePath,
          url: uploadResult.url,
          fileSize: imageFile.size,
          mimeType: imageFile.mimetype,
          s3: true,
          createdAt: new Date(),
        };
      } else {
        // Local file system storage
        // Create user-specific directory if it doesn't exist
        const userUploadDir = path.join(__dirname, '../../../uploads', userId);
        await fs.mkdir(userUploadDir, { recursive: true });
        
        // Save file to disk
        const filePath = path.join(userUploadDir, fileName);
        await fs.writeFile(filePath, imageFile.buffer);
        
        // Create relative path for storage in database
        const relativePath = `/uploads/${userId}/${fileName}`;
        
        logger.info(`Image uploaded to local storage: ${relativePath}`);
        
        // Build the URL using the configured uploads URL
        const url = `${process.env.NEXT_PUBLIC_UPLOADS_URL || ''}${relativePath.replace(/\\/g, '/')}`;
        
        return {
          id: uuidv4(),
          userId,
          fileName,
          originalName: imageFile.originalname,
          filePath: relativePath,
          url,
          fileSize: imageFile.size,
          mimeType: imageFile.mimetype,
          s3: false,
          createdAt: new Date(),
        };
      }
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw error;
    }
  },
  
  /**
   * Delete an image from the server or S3
   * @param {string} imagePath - Path to the image
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteImage(imagePath) {
    try {
      // For S3 paths or paths that include the bucket name
      if (imagePath.includes('s3://') || 
          imagePath.includes('landingpad-dxp') ||
          storageService.isS3Enabled) {
        
        logger.info(`Deleting image from S3: ${imagePath}`);
        const result = await storageService.deleteFile(imagePath);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete image from S3');
        }
        
        return true;
      }
      
      // Local file system logic
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
      
      logger.info(`Image deleted from local storage: ${imagePath}`);
      
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
    try {
      // Try to get image details from storage service first if it's an S3 path
      if (imageId.includes('s3://') || imageId.includes('landingpad-dxp')) {
        const result = await storageService.getFileInfo(imageId);
        if (result.success) {
          return {
            id: imageId,
            fileName: path.basename(imageId),
            originalName: path.basename(imageId),
            filePath: imageId,
            fileSize: result.size || 0,
            mimeType: result.mimetype || 'image/jpeg',
            url: result.url,
            createdAt: result.lastModified || new Date(),
          };
        }
      }
      
      // Fallback to mock data
      return {
        id: imageId,
        fileName: `${imageId}.jpg`,
        originalName: 'example.jpg',
        filePath: `/uploads/user123/${imageId}.jpg`,
        fileSize: 12345,
        mimeType: 'image/jpeg',
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Error getting image details:', error);
      throw error;
    }
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
  },
  
  /**
   * Save an Unsplash image to S3 storage
   * @param {string} imageUrl - URL of the Unsplash image
   * @param {string} userId - User ID
   * @param {Object} metadata - Image metadata (photographer, description, etc.)
   * @returns {Promise<Object>} - Saved image details
   */
  async saveUnsplashImageToS3(imageUrl, userId, metadata = {}) {
    try {
      if (!imageUrl) {
        throw new Error('Image URL is required');
      }
      
      // Download the image from Unsplash
      logger.info(`Downloading Unsplash image: ${imageUrl}`);
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(imageResponse.data, 'binary');
      
      // Generate a unique filename
      const fileName = `unsplash-${metadata.id || uuidv4()}${path.extname(imageUrl) || '.jpg'}`;
      
      // Upload to S3 
      const fileData = {
        buffer,
        originalname: fileName,
        mimetype: imageResponse.headers['content-type'] || 'image/jpeg',
        size: buffer.length,
        uploadType: 'uploads'
      };
      
      // Determine folder structure
      const folder = metadata.folder || 'unsplash';
      
      // Upload the file to S3
      logger.info(`Uploading Unsplash image to S3: ${fileName}`);
      const uploadResult = await storageService.uploadFile(fileData, folder, userId);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload image to S3');
      }
      
      // Return the uploaded image details
      return {
        id: metadata.id || uuidv4(),
        fileName,
        originalUrl: imageUrl,
        filePath: uploadResult.filePath,
        url: uploadResult.url,
        fileSize: buffer.length,
        mimeType: imageResponse.headers['content-type'] || 'image/jpeg',
        metadata: {
          ...metadata,
          unsplashAttribution: true,
          photographer: metadata.photographer || 'Unsplash Photographer',
          photographerUrl: metadata.photographerUrl || 'https://unsplash.com',
        },
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Error saving Unsplash image to S3:', error);
      throw error;
    }
  }
};

module.exports = imageService;