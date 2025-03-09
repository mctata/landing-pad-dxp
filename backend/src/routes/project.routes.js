const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/project.controller');
const { authenticate, isPaidUser } = require('../middleware/auth');
const { validate } = require('../middleware/error');

const router = express.Router();

// All project routes require authentication
router.use(authenticate);

// Get all projects for the current user
router.get('/', projectController.getUserProjects);

// Get a single project by ID
router.get('/:id', projectController.getProjectById);

// Create a new project
router.post(
  '/',
  [
    body('name').trim().not().isEmpty().withMessage('Project name is required'),
    body('templateId').not().isEmpty().withMessage('Template ID is required'),
    validate,
  ],
  projectController.createProject
);

// Update a project
router.patch(
  '/:id',
  [
    body('name').optional().trim().not().isEmpty().withMessage('Project name cannot be empty'),
    validate,
  ],
  projectController.updateProject
);

// Delete a project
router.delete('/:id', projectController.deleteProject);

// Publish a project
router.post(
  '/:id/publish',
  [
    body('customDomain')
      .optional()
      .isURL({ require_protocol: false })
      .withMessage('Custom domain must be a valid URL'),
    validate,
  ],
  projectController.publishProject
);

// Custom domain requires paid subscription
router.post(
  '/:id/custom-domain',
  isPaidUser,
  [
    body('customDomain')
      .isURL({ require_protocol: false })
      .withMessage('Custom domain must be a valid URL'),
    validate,
  ],
  (req, res, next) => {
    req.body.customDomain = req.body.customDomain;
    projectController.publishProject(req, res, next);
  }
);

module.exports = router;
