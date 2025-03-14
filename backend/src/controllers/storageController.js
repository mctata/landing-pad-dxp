/**
 * Storage Controller
 * Handles file upload, retrieval, and deletion operations
 */

const storageService = require('../services/storageService');
const logger = require('../utils/logger');

/**
 * Upload a single file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const userId = req.user?.id || 'anonymous';
    const folder = req.body.folder || 'general';
    
    // If using multer-s3, file is already uploaded to S3
    if (storageService.isS3Enabled && req.file.location) {
      return res.status(200).json({
        success: true,
        file: {
          originalName: req.file.originalname,
          fileName: req.file.key.split('/').pop(),
          filePath: req.file.key,
          url: req.file.location,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    }
    
    // For local storage or manual handling
    const result = await storageService.uploadFile(req.file, folder, userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to upload file'
      });
    }
    
    return res.status(200).json({
      success: true,
      file: {
        originalName: req.file.originalname,
        fileName: result.filePath.split('/').pop(),
        filePath: result.filePath,
        url: result.url,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    logger.error(`Error in uploadFile: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Upload multiple files
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const userId = req.user?.id || 'anonymous';
    const folder = req.body.folder || 'general';
    const fileResults = [];
    
    // Process each file
    for (const file of req.files) {
      if (storageService.isS3Enabled && file.location) {
        // If using multer-s3, file is already uploaded to S3
        fileResults.push({
          originalName: file.originalname,
          fileName: file.key.split('/').pop(),
          filePath: file.key,
          url: file.location,
          mimetype: file.mimetype,
          size: file.size
        });
      } else {
        // For local storage or manual handling
        const result = await storageService.uploadFile(file, folder, userId);
        
        if (result.success) {
          fileResults.push({
            originalName: file.originalname,
            fileName: result.filePath.split('/').pop(),
            filePath: result.filePath,
            url: result.url,
            mimetype: file.mimetype,
            size: file.size
          });
        } else {
          logger.error(`Failed to upload file ${file.originalname}: ${result.error}`);
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      files: fileResults,
      count: fileResults.length
    });
  } catch (error) {
    logger.error(`Error in uploadMultipleFiles: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteFile = async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'No file path provided'
      });
    }
    
    const result = await storageService.deleteFile(filePath);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to delete file'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `File deleted: ${filePath}`
    });
  } catch (error) {
    logger.error(`Error in deleteFile: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a signed URL for a file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSignedUrl = async (req, res) => {
  try {
    const { filePath, expirySeconds = 3600 } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'No file path provided'
      });
    }
    
    const result = await storageService.getSignedUrl(filePath, expirySeconds);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate signed URL'
      });
    }
    
    return res.status(200).json({
      success: true,
      url: result.url,
      expiry: result.expiry
    });
  } catch (error) {
    logger.error(`Error in getSignedUrl: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Health check for storage service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.healthCheck = async (req, res) => {
  try {
    const result = await storageService.healthCheck();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        storage: result.storage,
        error: result.error || 'Storage service is not healthy'
      });
    }
    
    return res.status(200).json({
      success: true,
      storage: result.storage,
      message: result.message
    });
  } catch (error) {
    logger.error(`Error in storage healthCheck: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};