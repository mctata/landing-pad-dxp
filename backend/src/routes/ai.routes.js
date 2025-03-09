const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/error');

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// Generate website content
router.post(
  '/generate-content',
  [
    body('prompt').trim().not().isEmpty().withMessage('Prompt is required'),
    body('contentType')
      .isIn(['headline', 'description', 'about', 'features', 'testimonial'])
      .withMessage('Invalid content type'),
    validate,
  ],
  aiController.generateContent
);

// Generate color scheme
router.post(
  '/generate-color-scheme',
  [
    body('industry').optional().trim(),
    body('mood').optional().trim(),
    body('baseColor').optional().trim(),
    validate,
  ],
  aiController.generateColorScheme
);

// Generate font pairings
router.post(
  '/generate-font-pairings',
  [
    body('style').optional().trim(),
    body('industry').optional().trim(),
    validate,
  ],
  aiController.generateFontPairings
);

module.exports = router;
