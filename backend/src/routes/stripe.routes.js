const express = require('express');
const { body } = require('express-validator');
const stripeController = require('../controllers/stripe.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/error');

const router = express.Router();

// Webhook endpoint (no authentication)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

// All other routes require authentication
router.use(authenticate);

// Get subscription plans
router.get('/plans', stripeController.getPlans);

// Create checkout session
router.post(
  '/create-checkout-session',
  [
    body('planId').isIn(['pro_plan', 'enterprise_plan']).withMessage('Invalid plan ID'),
    validate,
  ],
  stripeController.createCheckoutSession
);

// Get current subscription
router.get('/subscription', stripeController.getCurrentSubscription);

// Cancel subscription
router.post('/subscription/cancel', stripeController.cancelSubscription);

// Resume subscription
router.post('/subscription/resume', stripeController.resumeSubscription);

module.exports = router;
