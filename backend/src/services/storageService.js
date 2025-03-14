/**
 * Storage Service
 * Handles file storage operations with AWS S3 or local filesystem
 */

const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Configure AWS S3
const s3Config = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1'
};

const s3 = new AWS.S3(s3Config);
const useS3Storage = process.env.S3_ENABLED === 'true' || process.env.AWS_S3_ENABLED === 'true';

// Determine which S3 bucket to use based on environment
function getBucketName(type = 'storage') {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return type === 'uploads' ? 'landingpad-dxp-prod/uploads' : 'landingpad-dxp-prod/storage';
    case 'staging':
      return type === 'uploads' ? 'landingpad-dxp-staging/uploads' : 'landingpad-dxp-staging/storage';
    case 'development':
    default:
      return type === 'uploads' ? 'landingpad-dxp-dev/uploads' : 'landingpad-dxp-dev/storage';
  }
}

// Override bucket name if explicitly set in environment
const storageBucket = process.env.S3_STORAGE_BUCKET || getBucketName('storage');
const uploadsBucket = process.env.S3_UPLOADS_BUCKET || getBucketName('uploads');
const bucketName = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || storageBucket;

// Configure local storage directory
const uploadDir = process.env.UPLOAD_DIR || './uploads';
// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info(`Created upload directory: ${uploadDir}`);
  } catch (error) {
    logger.error(`Failed to create upload directory: ${error.message}`);
  }
}

// Configure multer for file uploads
const storage = useS3Storage
  ? multerS3({
      s3,
      bucket: (req, file) => {
        // Determine which bucket to use based on the upload type
        const uploadType = req.body.uploadType || 'storage';
        return uploadType === 'uploads' ? uploadsBucket : storageBucket;
      },
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const userId = req.user?.id || 'anonymous';
        const folder = req.body.folder || 'general';
        const fileName = `${folder}/${userId}/${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, fileName);
      }
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const userId = req.user?.id || 'anonymous';
        const folder = req.body.folder || 'general';
        const destPath = path.join(uploadDir, folder, userId);
        
        // Create user directory if it doesn't exist
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        
        cb(null, destPath);
      },
      filename: (req, file, cb) => {
        const uniqueFileName = `${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, uniqueFileName);
      }
    });

// Parse allowed file types from environment
const allowedFileTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp,application/pdf')
  .split(',')
  .map(type => type.trim());

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) // 5MB default
  },
  fileFilter
});

/**
 * Upload a file to S3 or local storage
 * @param {Object} file - The file object to upload
 * @param {string} folder - Optional folder path
 * @param {string} userId - User ID for organization
 * @returns {Promise<Object>} - The uploaded file information
 */
async function uploadFile(file, folder = 'general', userId = 'anonymous') {
  try {
    if (!file) {
      throw new Error('No file provided');
    }
    
    // If already using multer with multer-s3, file is already uploaded
    if (useS3Storage && file.location) {
      logger.info(`File uploaded to S3: ${file.key}`);
      return {
        success: true,
        fileName: file.originalname,
        filePath: file.key,
        url: file.location,
        mimetype: file.mimetype,
        size: file.size
      };
    }
    
    // For local storage with multer disk storage, file is already saved
    if (!useS3Storage && file.path) {
      const relativePath = file.path.replace(process.cwd(), '');
      const url = `${process.env.NEXT_PUBLIC_UPLOADS_URL || ''}${relativePath.replace(/\\/g, '/')}`;
      
      logger.info(`File saved locally: ${relativePath}`);
      return {
        success: true,
        fileName: file.originalname,
        filePath: relativePath,
        url,
        mimetype: file.mimetype,
        size: file.size
      };
    }
    
    // Manual upload to S3
    if (useS3Storage) {
      const fileKey = `${folder}/${userId}/${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
      
      // Determine which bucket to use based on the upload type
      const uploadType = file.uploadType || folder === 'uploads' ? 'uploads' : 'storage';
      const targetBucket = uploadType === 'uploads' ? uploadsBucket : storageBucket;
      
      const params = {
        Bucket: targetBucket,
        Key: fileKey,
        Body: file.buffer || fs.createReadStream(file.path),
        ContentType: file.mimetype,
        ACL: 'public-read'
      };
      
      const result = await s3.upload(params).promise();
      
      logger.info(`File uploaded to S3: ${fileKey}`);
      return {
        success: true,
        fileName: file.originalname,
        filePath: fileKey,
        url: result.Location,
        mimetype: file.mimetype,
        size: file.size
      };
    }
    
    // Manual local save
    const destPath = path.join(uploadDir, folder, userId);
    const fileName = `${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
    const filePath = path.join(destPath, fileName);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    // Save file
    fs.writeFileSync(filePath, file.buffer || fs.readFileSync(file.path));
    
    const relativePath = filePath.replace(process.cwd(), '');
    const url = `${process.env.NEXT_PUBLIC_UPLOADS_URL || ''}${relativePath.replace(/\\/g, '/')}`;
    
    logger.info(`File saved locally: ${relativePath}`);
    return {
      success: true,
      fileName: file.originalname,
      filePath: relativePath,
      url,
      mimetype: file.mimetype,
      size: file.size
    };
  } catch (error) {
    logger.error(`Error uploading file: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a file from S3 or local storage
 * @param {string} filePath - The path of the file to delete
 * @returns {Promise<Object>} - The result of the operation
 */
async function deleteFile(filePath) {
  try {
    if (!filePath) {
      throw new Error('No file path provided');
    }
    
    if (useS3Storage) {
      // Determine which bucket to use based on the file path
      const isUploadsBucket = filePath.includes('uploads/') || filePath.includes('uploads_');
      const targetBucket = isUploadsBucket ? uploadsBucket : storageBucket;
      
      const params = {
        Bucket: targetBucket,
        Key: filePath
      };
      
      await s3.deleteObject(params).promise();
      logger.info(`File deleted from S3: ${filePath}`);
    } else {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`File deleted locally: ${filePath}`);
      } else {
        throw new Error(`File not found: ${filePath}`);
      }
    }
    
    return {
      success: true,
      message: `File deleted: ${filePath}`
    };
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get a signed URL for accessing a private file
 * @param {string} filePath - The path of the file
 * @param {number} expirySeconds - Expiry time in seconds
 * @returns {Promise<Object>} - The signed URL
 */
async function getSignedUrl(filePath, expirySeconds = 3600) {
  try {
    if (!filePath) {
      throw new Error('No file path provided');
    }
    
    if (!useS3Storage) {
      // For local storage, we can't create signed URLs,
      // so we return a direct URL if the file exists
      const fullPath = path.join(process.cwd(), filePath);
      
      if (fs.existsSync(fullPath)) {
        const url = `${process.env.NEXT_PUBLIC_UPLOADS_URL || ''}${filePath.replace(/\\/g, '/')}`;
        return {
          success: true,
          url,
          expiry: null // No expiry for local files
        };
      } else {
        throw new Error(`File not found: ${filePath}`);
      }
    }
    
    // Determine which bucket to use based on the file path
    const isUploadsBucket = filePath.includes('uploads/') || filePath.includes('uploads_');
    const targetBucket = isUploadsBucket ? uploadsBucket : storageBucket;
    
    const params = {
      Bucket: targetBucket,
      Key: filePath,
      Expires: expirySeconds
    };
    
    const url = await s3.getSignedUrlPromise('getObject', params);
    
    return {
      success: true,
      url,
      expiry: new Date(Date.now() + expirySeconds * 1000)
    };
  } catch (error) {
    logger.error(`Error getting signed URL: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Health check for the storage service
 * @returns {Promise<Object>} - Result of the health check
 */
async function healthCheck() {
  try {
    if (useS3Storage) {
      // Check if both buckets exist
      const storageResult = await s3.headBucket({ Bucket: storageBucket }).promise()
        .then(() => ({ success: true, bucket: storageBucket }))
        .catch(err => ({ success: false, bucket: storageBucket, error: err.message }));
      
      const uploadsResult = await s3.headBucket({ Bucket: uploadsBucket }).promise()
        .then(() => ({ success: true, bucket: uploadsBucket }))
        .catch(err => ({ success: false, bucket: uploadsBucket, error: err.message }));
      
      return {
        success: storageResult.success && uploadsResult.success,
        storage: 'AWS S3',
        buckets: [storageResult, uploadsResult],
        message: storageResult.success && uploadsResult.success
          ? 'All S3 buckets accessible'
          : 'Some S3 buckets are not accessible'
      };
    } else {
      // Check if upload directory exists and is writable
      const testDir = path.join(uploadDir, 'test');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      const testFile = path.join(testDir, 'health-check.txt');
      fs.writeFileSync(testFile, 'Health check');
      fs.unlinkSync(testFile);
      
      return {
        success: true,
        storage: 'Local',
        directory: uploadDir,
        message: 'Local storage accessible'
      };
    }
  } catch (error) {
    logger.error(`Storage health check failed: ${error.message}`);
    return {
      success: false,
      storage: useS3Storage ? 'AWS S3' : 'Local',
      error: error.message
    };
  }
}

module.exports = {
  upload,
  uploadFile,
  deleteFile,
  getSignedUrl,
  healthCheck,
  // Export these for other modules to use
  isS3Enabled: useS3Storage,
  s3,
  bucketName,
  storageBucket,
  uploadsBucket,
  // Helper function to determine bucket type
  getBucketForType: (type) => type === 'uploads' ? uploadsBucket : storageBucket
};