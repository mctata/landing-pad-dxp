const { body, param } = require('express-validator');

/**
 * Validators for AI-related requests
 */
const aiValidators = {
  /**
   * Validator for content generation
   */
  generateContent: [
    body('elementType')
      .notEmpty().withMessage('Element type is required')
      .isString().withMessage('Element type must be a string'),
    
    body('prompt')
      .notEmpty().withMessage('Prompt is required')
      .isString().withMessage('Prompt must be a string'),
    
    body('tone')
      .optional()
      .isString().withMessage('Tone must be a string'),
    
    body('length')
      .optional()
      .isString().withMessage('Length must be a string'),
    
    body('websiteId')
      .optional()
      .isString().withMessage('Website ID must be a string'),
    
    body('pageId')
      .optional()
      .isString().withMessage('Page ID must be a string')
  ],

  /**
   * Validator for layout generation
   */
  generateLayout: [
    body('websiteId')
      .notEmpty().withMessage('Website ID is required')
      .isString().withMessage('Website ID must be a string'),
    
    body('pageId')
      .notEmpty().withMessage('Page ID is required')
      .isString().withMessage('Page ID must be a string'),
    
    body('prompt')
      .notEmpty().withMessage('Prompt is required')
      .isString().withMessage('Prompt must be a string'),
    
    body('pageType')
      .optional()
      .isString().withMessage('Page type must be a string')
  ],

  /**
   * Validator for style generation
   */
  generateStyle: [
    body('websiteId')
      .notEmpty().withMessage('Website ID is required')
      .isString().withMessage('Website ID must be a string'),
    
    body('prompt')
      .notEmpty().withMessage('Prompt is required')
      .isString().withMessage('Prompt must be a string'),
    
    body('existingColors')
      .optional()
      .isObject().withMessage('Existing colors must be an object'),
    
    body('existingFonts')
      .optional()
      .isObject().withMessage('Existing fonts must be an object')
  ],

  /**
   * Validator for content modification
   */
  modifyContent: [
    body('content')
      .notEmpty().withMessage('Content is required')
      .isString().withMessage('Content must be a string'),
    
    body('action')
      .notEmpty().withMessage('Action is required')
      .isString().withMessage('Action must be a string')
      .isIn(['rewrite', 'expand', 'shorten', 'changeStyle', 'proofread'])
      .withMessage('Invalid action type'),
    
    body('parameters')
      .optional()
      .isObject().withMessage('Parameters must be an object')
  ],

  /**
   * Validator for suggestions
   */
  getSuggestions: [
    param('websiteId')
      .notEmpty().withMessage('Website ID is required')
      .isString().withMessage('Website ID must be a string'),
    
    param('pageId')
      .notEmpty().withMessage('Page ID is required')
      .isString().withMessage('Page ID must be a string'),
    
    body('type')
      .notEmpty().withMessage('Type is required')
      .isString().withMessage('Type must be a string')
      .isIn(['text', 'layout', 'style'])
      .withMessage('Type must be one of: text, layout, style'),
    
    body('prompt')
      .notEmpty().withMessage('Prompt is required')
      .isString().withMessage('Prompt must be a string')
  ],

  /**
   * Validator for color scheme generation
   */
  generateColorScheme: [
    body('industry')
      .optional()
      .isString().withMessage('Industry must be a string'),
    
    body('mood')
      .optional()
      .isString().withMessage('Mood must be a string'),
    
    body('baseColor')
      .optional()
      .isString().withMessage('Base color must be a string')
  ],

  /**
   * Validator for font pairing generation
   */
  generateFontPairings: [
    body('style')
      .optional()
      .isString().withMessage('Style must be a string'),
    
    body('industry')
      .optional()
      .isString().withMessage('Industry must be a string')
  ]
};

module.exports = aiValidators;