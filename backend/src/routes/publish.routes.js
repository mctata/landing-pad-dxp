const express = require('express');
const router = express.Router();
const publishController = require('../controllers/publishController');
const authMiddleware = require('../middleware/auth');

/**
 * Routes for website publishing, deployment, and domain management
 */

// Website deployment routes
router.post('/websites/:websiteId/publish', authMiddleware.authenticate, publishController.publishWebsite);
router.get('/websites/:websiteId/deployments', authMiddleware.authenticate, publishController.getDeployments);
router.get('/websites/:websiteId/deployments/:deploymentId', authMiddleware.authenticate, publishController.getDeployment);

// Domain management routes
router.get('/websites/:websiteId/domains', authMiddleware.authenticate, publishController.getDomains);
router.post('/websites/:websiteId/domains', authMiddleware.authenticate, publishController.addDomain);
router.delete('/websites/:websiteId/domains/:domainId', authMiddleware.authenticate, publishController.removeDomain);
router.put('/websites/:websiteId/domains/:domainId/primary', authMiddleware.authenticate, publishController.setPrimaryDomain);
router.post('/websites/:websiteId/domains/:domainId/verify', authMiddleware.authenticate, publishController.verifyDomain);

// Webhook endpoint (no auth required, verified by signature)
router.post('/webhooks/deployment', publishController.handleDeploymentWebhook);

module.exports = router;