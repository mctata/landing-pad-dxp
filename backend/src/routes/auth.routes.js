const express = require('express');
const { body, param } = require('express-validator');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/error');

// Initialize passport for social auth
require('../config/passport');

const router = express.Router();

// Register a new user
router.post(
  '/register',
  [
    body('firstName').trim().not().isEmpty().withMessage('First name is required'),
    body('lastName').trim().not().isEmpty().withMessage('Last name is required'),
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

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout user
router.post('/logout', authenticate, authController.logout);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Verify email
router.get(
  '/verify-email/:token',
  [
    param('token').not().isEmpty().withMessage('Verification token is required'),
    validate,
  ],
  authController.verifyEmail
);

// Resend verification email
router.post(
  '/resend-verification',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    validate,
  ],
  authController.resendVerification
);

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

// Reset password
router.post(
  '/reset-password',
  [
    body('token').not().isEmpty().withMessage('Token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('New password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('New password must contain an uppercase letter'),
    validate,
  ],
  authController.resetPassword
);

// Social authentication routes
// Google Auth
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/auth/login',
    session: false 
  }),
  authController.googleCallback
);

// Facebook Auth
router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['email', 'public_profile'] 
}));

router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: '/auth/login',
    session: false 
  }),
  authController.facebookCallback
);

// LinkedIn Auth
router.get('/linkedin', passport.authenticate('linkedin', { 
  scope: ['r_emailaddress', 'r_liteprofile']
}));

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { 
    failureRedirect: '/auth/login',
    session: false 
  }),
  authController.linkedinCallback
);

module.exports = router;
