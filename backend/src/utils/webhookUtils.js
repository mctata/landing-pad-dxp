const crypto = require('crypto');
const logger = require('./logger');

/**
 * Utilities for working with webhooks
 */
const webhookUtils = {
  /**
   * Verify the signature of a webhook request
   * @param {Object} req - Express request object
   * @returns {boolean} - True if signature is valid
   */
  verifySignature(req) {
    try {
      // Get the signature from headers
      const signature = req.headers['x-webhook-signature'];
      if (!signature) {
        logger.warn('No webhook signature provided');
        return false;
      }

      // Get the webhook secret from environment
      const webhookSecret = process.env.WEBHOOK_SECRET;
      if (!webhookSecret) {
        logger.warn('No webhook secret configured');
        // In development, allow webhooks without verification
        return process.env.NODE_ENV !== 'production';
      }

      // Get the raw body
      const rawBody = JSON.stringify(req.body);
      
      // Create a HMAC signature using the secret
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(rawBody);
      const calculatedSignature = hmac.digest('hex');
      
      // Compare signatures
      const isValid = crypto.timingSafeEqual(
        Buffer.from(calculatedSignature),
        Buffer.from(signature)
      );
      
      // For development, log more info
      if (process.env.NODE_ENV !== 'production') {
        if (!isValid) {
          logger.debug('Webhook signature mismatch', {
            received: signature,
            calculated: calculatedSignature
          });
        }
      }
      
      return isValid;
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      return false;
    }
  },
  
  /**
   * Generate a webhook signature for testing
   * @param {Object} payload - Webhook payload
   * @returns {string} - Signature
   */
  generateSignature(payload) {
    const webhookSecret = process.env.WEBHOOK_SECRET || 'test-secret';
    const rawBody = JSON.stringify(payload);
    
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(rawBody);
    return hmac.digest('hex');
  }
};

module.exports = webhookUtils;