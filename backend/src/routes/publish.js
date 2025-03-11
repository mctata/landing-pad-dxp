const express = require('express');
const router = express.Router();
const publishController = require('../controllers/publishController');
const { authenticate } = require('../middleware/auth');

/**
 * @route POST /api/websites/:websiteId/publish
 * @desc Publish a website
 * @access Private
 */
router.post(
  '/websites/:websiteId/publish',
  authenticate,
  publishController.publishWebsite
);

/**
 * @route GET /api/websites/:websiteId/deployments
 * @desc Get deployments for a website
 * @access Private
 */
router.get(
  '/websites/:websiteId/deployments',
  authenticate,
  publishController.getDeployments
);

/**
 * @route GET /api/websites/:websiteId/deployments/:deploymentId
 * @desc Get a specific deployment
 * @access Private
 */
router.get(
  '/websites/:websiteId/deployments/:deploymentId',
  authenticate,
  publishController.getDeployment
);

/**
 * @route GET /api/websites/:websiteId/domains
 * @desc Get domains for a website
 * @access Private
 */
router.get(
  '/websites/:websiteId/domains',
  authenticate,
  publishController.getDomains
);

/**
 * @route POST /api/websites/:websiteId/domains
 * @desc Add a domain to a website
 * @access Private
 */
router.post(
  '/websites/:websiteId/domains',
  authenticate,
  publishController.addDomain
);

/**
 * @route DELETE /api/websites/:websiteId/domains/:domainId
 * @desc Remove a domain from a website
 * @access Private
 */
router.delete(
  '/websites/:websiteId/domains/:domainId',
  authenticate,
  publishController.removeDomain
);

/**
 * @route PUT /api/websites/:websiteId/domains/:domainId/primary
 * @desc Set a domain as primary
 * @access Private
 */
router.put(
  '/websites/:websiteId/domains/:domainId/primary',
  authenticate,
  publishController.setPrimaryDomain
);

/**
 * @route POST /api/websites/:websiteId/domains/:domainId/verify
 * @desc Verify a domain
 * @access Private
 */
router.post(
  '/websites/:websiteId/domains/:domainId/verify',
  authenticate,
  publishController.verifyDomain
);

module.exports = router;