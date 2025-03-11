const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const aiValidators = require('../middleware/validators/aiValidators');
const authMiddleware = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

/**
 * AI routes
 * All routes require authentication and are rate limited
 */

// Apply authentication middleware and rate limiting to all AI routes
// AI endpoints can be expensive, so we apply stricter rate limits
router.use(authMiddleware.authenticate);
router.use(rateLimiter.aiLimiter);

/**
 * @route POST /api/ai/generate/content
 * @desc Generate content for a specific element
 * @access Private
 */
router.post(
  '/generate/content',
  aiValidators.generateContent,
  aiController.generateContent
);

/**
 * @route POST /api/ai/generate/layout
 * @desc Generate layout structure based on website data and prompt
 * @access Private
 */
router.post(
  '/generate/layout',
  aiValidators.generateLayout,
  aiController.generateLayout
);

/**
 * @route POST /api/ai/generate/style
 * @desc Generate style recommendations including colors and typography
 * @access Private
 */
router.post(
  '/generate/style',
  aiValidators.generateStyle,
  aiController.generateStyle
);

/**
 * @route POST /api/ai/modify/content
 * @desc Modify existing content with AI (rewrite, expand, shorten, etc.)
 * @access Private
 */
router.post(
  '/modify/content',
  aiValidators.modifyContent,
  aiController.modifyContent
);

/**
 * @route POST /api/ai/suggestions/:websiteId/:pageId
 * @desc Generate AI suggestions based on website data and user prompt
 * @access Private
 */
router.post(
  '/suggestions/:websiteId/:pageId',
  aiValidators.getSuggestions,
  aiController.getSuggestions
);

/**
 * Legacy routes for backwards compatibility
 */

/**
 * @route POST /api/ai/generate-content
 * @desc Legacy endpoint for content generation
 * @access Private
 */
router.post(
  '/generate-content',
  aiValidators.generateContent,
  aiController.generateContent
);

/**
 * @route POST /api/ai/generate-color-scheme
 * @desc Generate color scheme based on industry, mood, or base color
 * @access Private
 */
router.post(
  '/generate-color-scheme',
  aiValidators.generateColorScheme,
  aiController.generateColorScheme
);

/**
 * @route POST /api/ai/generate-font-pairings
 * @desc Generate font pairings based on style and industry
 * @access Private
 */
router.post(
  '/generate-font-pairings',
  aiValidators.generateFontPairings,
  aiController.generateFontPairings
);

module.exports = router;