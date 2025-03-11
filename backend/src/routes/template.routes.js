const express = require('express');
const { body } = require('express-validator');
const templateController = require('../controllers/template.controller');
const { authenticate, isAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/error');

const router = express.Router();

// Get all templates
router.get('/', templateController.getAllTemplates);

// Get a template by ID
router.get('/:id', templateController.getTemplateById);

// Get templates by category
router.get('/category/:category', templateController.getTemplatesByCategory);

// Admin-only routes
// Create a template
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('name').trim().not().isEmpty().withMessage('Template name is required'),
    body('category').trim().not().isEmpty().withMessage('Category is required'),
    body('thumbnail').trim().not().isEmpty().withMessage('Thumbnail URL is required'),
    body('content').isObject().withMessage('Content must be a valid JSON object'),
    body('styles').isObject().withMessage('Styles must be a valid JSON object'),
    body('settings').isObject().withMessage('Settings must be a valid JSON object'),
    validate,
  ],
  templateController.createTemplate
);

// Update a template
router.patch(
  '/:id',
  authenticate,
  isAdmin,
  [
    body('name').optional().trim().not().isEmpty().withMessage('Template name cannot be empty'),
    body('category').optional().trim().not().isEmpty().withMessage('Category cannot be empty'),
    body('thumbnail').optional().trim().not().isEmpty().withMessage('Thumbnail URL cannot be empty'),
    body('content').optional().isObject().withMessage('Content must be a valid JSON object'),
    body('styles').optional().isObject().withMessage('Styles must be a valid JSON object'),
    body('settings').optional().isObject().withMessage('Settings must be a valid JSON object'),
    validate,
  ],
  templateController.updateTemplate
);

// Delete a template
router.delete('/:id', authenticate, isAdmin, templateController.deleteTemplate);

module.exports = router;
