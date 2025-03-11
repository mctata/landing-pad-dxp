const { body, param, validationResult } = require('express-validator');
const { APIError } = require('../errorHandler');

/**
 * Middleware to check validation results
 */
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new APIError('Validation error', 400, errors.array());
  }
  next();
};

/**
 * Validator for content generation
 */
const validateGenerateContent = [
  body('websiteId').isString().notEmpty().withMessage('Website ID is required'),
  body('pageId').isString().notEmpty().withMessage('Page ID is required'),
  body('elementType').isString().notEmpty().withMessage('Element type is required'),
  body('prompt').isString().notEmpty().withMessage('Prompt is required'),
  body('tone').optional().isString(),
  body('length').optional().isString(),
  checkValidation
];

/**
 * Validator for suggestions
 */
const validateSuggestions = [
  param('websiteId').isString().notEmpty().withMessage('Website ID is required'),
  param('pageId').isString().notEmpty().withMessage('Page ID is required'),
  body('type').isString().notEmpty().withMessage('Type is required')
    .isIn(['text', 'layout', 'style']).withMessage('Type must be one of: text, layout, style'),
  body('prompt').isString().notEmpty().withMessage('Prompt is required'),
  checkValidation
];

/**
 * Validator for content modification
 */
const validateModifyContent = [
  body('content').isString().notEmpty().withMessage('Content is required'),
  body('action').isString().notEmpty().withMessage('Action is required')
    .isIn(['rewrite', 'expand', 'shorten', 'changeStyle', 'proofread']).withMessage('Invalid action'),
  body('parameters').optional().isObject(),
  checkValidation
];

module.exports = {
  validateGenerateContent,
  validateSuggestions,
  validateModifyContent
};
