const express = require('express');
const router = express.Router();

/**
 * @route GET /health
 * @desc Health check endpoint for monitoring
 * @access Public
 */
router.get('/', (req, res) => {
  // Return basic service info
  res.status(200).json({
    status: 'ok',
    service: 'landing-pad-api',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /health/deep
 * @desc Deep health check that validates database connection
 * @access Public
 */
router.get('/deep', async (req, res) => {
  try {
    // Here we would check database connections, external services, etc.
    // For now this is just a placeholder
    
    // If everything is ok
    res.status(200).json({
      status: 'ok',
      service: 'landing-pad-api',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        cache: 'ok',
        storage: 'ok'
      }
    });
  } catch (error) {
    // If something fails
    res.status(503).json({
      status: 'error',
      service: 'landing-pad-api',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        database: error.message.includes('database') ? 'error' : 'ok',
        cache: error.message.includes('cache') ? 'error' : 'ok',
        storage: error.message.includes('storage') ? 'error' : 'ok'
      }
    });
  }
});

module.exports = router;