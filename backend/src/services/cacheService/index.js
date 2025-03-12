const NodeCache = require('node-cache');
const crypto = require('crypto');
const logger = require('../../utils/logger');

/**
 * Cache service for storing and retrieving cached data
 * Primarily used for AI requests to reduce API costs and improve performance
 */
class CacheService {
  constructor(ttlSeconds = 3600) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
      useClones: false
    });
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0
    };
    
    logger.info(`Cache service initialized with TTL of ${ttlSeconds} seconds`);
  }
  
  /**
   * Generate a cache key from the input
   * @param {any} input - Input to generate a key from
   * @returns {string} - Cache key
   */
  generateKey(input) {
    // If input is an object, stringify it first
    const data = typeof input === 'object' ? JSON.stringify(input) : String(input);
    
    // Generate a hash of the input
    return crypto.createHash('md5').update(data).digest('hex');
  }
  
  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {boolean} - True if successful
   */
  set(key, value, ttl = undefined) {
    try {
      const success = this.cache.set(key, value, ttl);
      this.stats.keys = this.cache.keys().length;
      return success;
    } catch (error) {
      logger.error('Error setting cache:', error);
      return false;
    }
  }
  
  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any} - Cached value or undefined if not found
   */
  get(key) {
    try {
      const value = this.cache.get(key);
      
      if (value === undefined) {
        this.stats.misses++;
        return undefined;
      }
      
      this.stats.hits++;
      return value;
    } catch (error) {
      logger.error('Error getting from cache:', error);
      return undefined;
    }
  }
  
  /**
   * Check if a key exists in the cache
   * @param {string} key - Cache key
   * @returns {boolean} - True if key exists
   */
  has(key) {
    return this.cache.has(key);
  }
  
  /**
   * Delete a value from the cache
   * @param {string} key - Cache key
   * @returns {number} - Number of deleted entries
   */
  del(key) {
    try {
      const deleted = this.cache.del(key);
      this.stats.keys = this.cache.keys().length;
      return deleted;
    } catch (error) {
      logger.error('Error deleting from cache:', error);
      return 0;
    }
  }
  
  /**
   * Flush the entire cache
   * @returns {void}
   */
  flush() {
    try {
      this.cache.flushAll();
      this.stats.keys = 0;
      logger.info('Cache flushed');
    } catch (error) {
      logger.error('Error flushing cache:', error);
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      memoryUsage: this.cache.getStats().vsize,
      items: this.cache.keys().length
    };
  }
}

// Create a singleton instance
const cacheService = new CacheService();

module.exports = cacheService;