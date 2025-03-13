const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
const contentController = require('../controllers/contentController');
const cacheController = require('../controllers/cacheController');
const authMiddleware = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads/temp'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Admin API routes
 * All routes require authentication with admin role
 */

// Apply auth middleware to all routes in this router
router.use(authMiddleware.authenticate);

// Dashboard statistics
router.get('/stats', adminController.getStats);

// Websites management
router.get('/websites', adminController.getWebsites);
router.get('/websites/:websiteId', adminController.getWebsiteDetails);

// Deployments management 
router.get('/deployments', adminController.getDeployments);
router.post('/deployments/:deploymentId/retry', adminController.retryDeployment);

// Domains management
router.get('/domains', adminController.getDomains);

// Queue dashboard
router.get('/queue/dashboard', adminController.getQueueDashboard);
router.post('/queue/pause', adminController.pauseQueue);
router.post('/queue/resume', adminController.resumeQueue);

// Cache management
router.get('/cache/stats', cacheController.getStats);
router.post('/cache/flush', cacheController.flushCache);
router.delete('/cache/key', cacheController.deleteKey);

// Queue management
router.get('/queue/stats', async (req, res, next) => {
  try {
    const queueService = require('../services/queueService');
    const stats = await queueService.getQueueStatus();
    res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
});

router.post('/queue/process-deployments', async (req, res, next) => {
  try {
    const queueService = require('../services/queueService');
    const result = await queueService.processQueuedDeployments();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/queue/cleanup', async (req, res, next) => {
  try {
    const queueService = require('../services/queueService');
    const { olderThan } = req.body;
    const result = await queueService.cleanupOldJobs(olderThan);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Content management
router.get('/content', contentController.getAllContent);
router.get('/content/tags', contentController.getAllTags);
router.get('/content/:contentId', contentController.getContentById);
router.post('/content', contentController.createContent);
router.put('/content/:contentId', contentController.updateContent);
router.delete('/content/:contentId', contentController.deleteContent);
router.post('/content/:contentId/publish', contentController.publishContent);
router.post('/content/:contentId/unpublish', contentController.unpublishContent);
router.post('/content/:contentId/clone', contentController.cloneContent);
router.post('/content/import', upload.single('file'), contentController.importContent);

module.exports = router;