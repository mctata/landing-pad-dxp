const crypto = require('crypto');
const logger = require('./logger');

/**
 * Utilities for working with webhooks
 */
const webhookUtils = {
  /**
   * Verify the signature of a webhook request
   * @param {Object} req - Express request object
   * @param {string} [source] - Optional source identifier for the webhook
   * @returns {boolean} - True if signature is valid
   */
  verifySignature(req, source = null) {
    try {
      // Get the signature from headers
      const signature = req.headers['x-webhook-signature'] || 
                       req.headers['x-signature'] || 
                       req.headers['x-hub-signature-256'];
                       
      if (!signature) {
        logger.warn(`No webhook signature provided${source ? ` for ${source}` : ''}`);
        return false;
      }

      // Get the webhook secret from environment, with optional source-specific secret
      const sourceEnvVar = source ? `WEBHOOK_SECRET_${source.toUpperCase()}` : null;
      const webhookSecret = sourceEnvVar && process.env[sourceEnvVar] 
                           ? process.env[sourceEnvVar] 
                           : process.env.WEBHOOK_SECRET;
                           
      if (!webhookSecret) {
        logger.warn(`No webhook secret configured${source ? ` for ${source}` : ''}`);
        // In development, allow webhooks without verification
        return process.env.NODE_ENV !== 'production';
      }

      // Get the raw body - normalize handling of string vs object bodies
      let rawBody;
      if (req.rawBody) {
        // If middleware has already parsed and saved the raw body
        rawBody = req.rawBody;
      } else if (typeof req.body === 'string') {
        rawBody = req.body;
      } else {
        rawBody = JSON.stringify(req.body);
      }
      
      // Handle different signature formats (GitHub uses 'sha256=<sig>')
      let receivedSignature = signature;
      if (signature.includes('sha256=')) {
        receivedSignature = signature.substring(7); // Remove 'sha256=' prefix
      }
      
      // Create a HMAC signature using the secret
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(rawBody);
      const calculatedSignature = hmac.digest('hex');
      
      let isValid = false;
      
      try {
        // Try timing-safe comparison if signatures are same length
        if (receivedSignature.length === calculatedSignature.length) {
          isValid = crypto.timingSafeEqual(
            Buffer.from(calculatedSignature),
            Buffer.from(receivedSignature)
          );
        } else {
          isValid = receivedSignature === calculatedSignature;
        }
      } catch (comparisonError) {
        logger.warn('Error during signature comparison:', comparisonError);
        isValid = receivedSignature === calculatedSignature;
      }
      
      // For development, log more info
      if (!isValid) {
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(`Webhook signature mismatch${source ? ` for ${source}` : ''}`, {
            received: receivedSignature,
            calculated: calculatedSignature
          });
        } else {
          logger.warn(`Invalid webhook signature received${source ? ` for ${source}` : ''}`);
        }
      }
      
      return isValid;
    } catch (error) {
      logger.error(`Error verifying webhook signature${source ? ` for ${source}` : ''}:`, error);
      return false;
    }
  },
  
  /**
   * Generate a webhook signature for testing
   * @param {Object|string} payload - Webhook payload
   * @param {string} [source] - Optional source identifier for the webhook
   * @param {boolean} [prefixed] - Whether to include the 'sha256=' prefix (for GitHub)
   * @returns {string} - Signature
   */
  generateSignature(payload, source = null, prefixed = false) {
    // Get the appropriate webhook secret based on source
    const sourceEnvVar = source ? `WEBHOOK_SECRET_${source.toUpperCase()}` : null;
    const webhookSecret = (sourceEnvVar && process.env[sourceEnvVar]) 
                        ? process.env[sourceEnvVar] 
                        : (process.env.WEBHOOK_SECRET || 'test-secret');
    
    // Convert payload to string if it's an object
    const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(rawBody);
    const signature = hmac.digest('hex');
    
    // Add prefix if requested (e.g., for GitHub)
    return prefixed ? `sha256=${signature}` : signature;
  },
  
  /**
   * Create middleware to verify webhook signatures
   * @param {string} [source] - Optional source identifier for the webhook
   * @param {boolean} [requireSignature] - Whether to require signature in production
   * @returns {Function} - Express middleware function
   */
  createSignatureVerificationMiddleware(source = null, requireSignature = true) {
    return (req, res, next) => {
      // Save the raw body for signature verification if it's available
      if (req.rawBody) {
        // Some body parsers already set this
      } else if (typeof req.body === 'string') {
        req.rawBody = req.body;
      } else {
        req.rawBody = JSON.stringify(req.body);
      }
      
      // Verify the signature
      const isValid = this.verifySignature(req, source);
      
      // In production, reject requests with invalid signatures
      if (!isValid && process.env.NODE_ENV === 'production' && requireSignature) {
        logger.warn(`Rejected webhook with invalid signature${source ? ` from ${source}` : ''}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }
      
      // Set a flag on the request for optional validation
      req.hasValidSignature = isValid;
      
      // Continue processing
      next();
    };
  }
};

module.exports = webhookUtils;