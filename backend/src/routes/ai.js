const express = require('express');
const router = express.Router();
const { validateGenerateContent, validateSuggestions, validateModifyContent } = require('../middleware/validators/aiValidators');
const aiController = require('../controllers/aiController');
const { rateLimiter } = require('../middleware/rateLimiter');

// Apply rate limiter to all AI routes
router.use(rateLimiter);

/**
 * @route POST /api/ai/generate/content
 * @desc Generate content for a specific element
 * @access Private
 */
router.post('/generate/content', validateGenerateContent, aiController.generateContent);

/**
 * @route POST /api/ai/suggestions/:websiteId/:pageId
 * @desc Generate AI suggestions based on website data and user prompt
 * @access Private
 */
router.post('/suggestions/:websiteId/:pageId', validateSuggestions, aiController.generateSuggestions);

/**
 * @route POST /api/ai/modify/content
 * @desc Modify existing content with AI (rewrite, expand, shorten, etc.)
 * @access Private
 */
router.post('/modify/content', validateModifyContent, aiController.modifyContent);

module.exports = router;
