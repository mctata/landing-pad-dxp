const express = require('express');
const router = express.Router();
const aiRoutes = require('./ai');

// Mount routes
router.use('/ai', aiRoutes);

// Base route for API
router.get('/', (req, res) => {
  res.json({
    message: 'Landing Pad Digital API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

module.exports = router;
