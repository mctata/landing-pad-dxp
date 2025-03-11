const express = require('express');
const router = express.Router();
const aiRoutes = require('./ai');
const authRoutes = require('./auth.routes');
const { notFound } = require('../middleware/error');

// Mount routes
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);

// Base route for API
router.get('/', (req, res) => {
  res.json({
    message: 'Landing Pad Digital API',
    version: '1.0.0',
    documentation: '/docs/api-reference.md'
  });
});

// Add 404 handler for API routes
router.use(notFound);

module.exports = router;
