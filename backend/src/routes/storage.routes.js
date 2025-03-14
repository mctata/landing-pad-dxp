/**
 * Storage Routes
 * Handles routes for file uploads, retrievals, and deletions
 */

const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');
const storageService = require('../services/storageService');
const auth = require('../middleware/auth');

// Apply authentication middleware
router.use(auth.authenticate);

// Single file upload
router.post(
  '/upload',
  storageService.upload.single('file'),
  storageController.uploadFile
);

// Multiple files upload
router.post(
  '/upload-multiple',
  storageService.upload.array('files', 10), // Limit to 10 files
  storageController.uploadMultipleFiles
);

// Delete file
router.delete('/delete', storageController.deleteFile);

// Get signed URL
router.post('/signed-url', storageController.getSignedUrl);

// Health check
router.get('/health', storageController.healthCheck);

module.exports = router;