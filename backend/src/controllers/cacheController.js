const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

/**
 * Controller for cache operations
 */
const cacheController = {
  /**
   * Get cache statistics
   * @route GET /api/admin/cache/stats
   */
  getStats(req, res, next) {
    try {
      // Only admin users should access this
      if (req.user.role !== 'admin') {
        throw new APIError('Unauthorized access to cache stats', 403);
      }
      
      const stats = cacheService.getStats();
      
      res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Flush the entire cache
   * @route POST /api/admin/cache/flush
   */
  flushCache(req, res, next) {
    try {
      // Only admin users should access this
      if (req.user.role !== 'admin') {
        throw new APIError('Unauthorized access to flush cache', 403);
      }
      
      cacheService.flush();
      
      res.status(200).json({
        success: true,
        message: 'Cache flushed successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete a specific cache key
   * @route DELETE /api/admin/cache/key
   */
  deleteKey(req, res, next) {
    try {
      // Only admin users should access this
      if (req.user.role !== 'admin') {
        throw new APIError('Unauthorized access to delete cache key', 403);
      }
      
      const { key } = req.body;
      
      if (!key) {
        throw new APIError('Cache key is required', 400);
      }
      
      const deleted = cacheService.del(key);
      
      res.status(200).json({
        success: true,
        message: `${deleted} cache entries deleted`
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = cacheController;