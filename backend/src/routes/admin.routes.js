const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const cacheController = require('../controllers/cacheController');
const authMiddleware = require('../middleware/auth');

/**
 * Admin API routes
 * All routes require authentication with admin role
 */

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Dashboard statistics
router.get('/stats', adminController.getStats);

// Websites management
router.get('/websites', adminController.getWebsites);
router.get('/websites/:websiteId', adminController.getWebsiteDetails);

// Deployments management 
router.get('/deployments', adminController.getDeployments);

// Domains management
router.get('/domains', adminController.getDomains);

// Cache management
router.get('/cache/stats', cacheController.getStats);
router.post('/cache/flush', cacheController.flushCache);
router.delete('/cache/key', cacheController.deleteKey);

module.exports = router;