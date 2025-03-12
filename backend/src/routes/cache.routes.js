const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/cacheController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Cache routes
router.get('/stats', cacheController.getStats);
router.post('/flush', cacheController.flushCache);
router.delete('/key', cacheController.deleteKey);

module.exports = router;