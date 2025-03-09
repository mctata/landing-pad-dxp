const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/error');

const router = express.Router();

// Register a new user
router.post(
  '/register',
  [
    body('name').trim().not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter'),
    validate,
  ],
  authController.register
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').not().isEmpty().withMessage('Password is required'),
    validate,
  ],
  authController.login
);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Change password
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').not().isEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('New password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('New password must contain an uppercase letter'),
    validate,
  ],
  authController.changePassword
);

// Forgot password
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    validate,
  ],
  authController.forgotPassword
);

module.exports = router;
