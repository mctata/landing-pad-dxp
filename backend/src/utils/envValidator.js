/**
 * Environment Variable Validator
 * 
 * This utility validates and categorizes required environment variables,
 * providing clear feedback on missing or misconfigured variables.
 */

const logger = require('./logger');

// Define environment variables grouped by category
const envVars = {
  // Server configuration
  server: {
    required: ['PORT', 'NODE_ENV'],
    optional: ['API_VERSION', 'LOG_LEVEL', 'LOG_FORMAT', 'ENABLE_COMPRESSION', 'ENABLE_HELMET', 'FRONTEND_URL']
  },
  // Database configuration
  database: {
    required: [], // Either DB_URL or individual connection params
    optional: [
      'DB_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 
      'DB_SSL', 'DB_SSL_REJECT_UNAUTHORIZED', 'DB_POOL_MAX', 'DB_POOL_MIN', 
      'DB_POOL_ACQUIRE', 'DB_POOL_IDLE', 'DB_RETRY_MAX'
    ]
  },
  // Authentication configuration
  auth: {
    required: ['JWT_SECRET'],
    optional: [
      'JWT_ACCESS_SECRET', 'JWT_ACCESS_EXPIRATION',
      'JWT_REFRESH_SECRET', 'JWT_REFRESH_EXPIRATION',
      'ENABLE_COOKIE_SECURE', 'BYPASS_AUTH', 'AUTH_FETCH_USER',
      'ASSUME_PAID_USER'
    ]
  },
  // CORS configuration
  cors: {
    optional: ['CORS_ORIGIN', 'CORS_METHODS']
  },
  // Rate limiting
  rateLimiting: {
    optional: ['RATE_LIMIT_MAX', 'RATE_LIMIT_WINDOW_MS', 'API_RATE_LIMIT', 'API_RATE_LIMIT_WINDOW']
  },
  // OpenAI configuration
  openai: {
    optional: ['OPENAI_API_KEY', 'OPENAI_MODEL']
  },
  // Deployment configuration
  deployment: {
    optional: [
      'RUN_WORKER_IN_PROCESS', 'WORKER_CONCURRENCY', 'WORKER_ENABLED',
      'BUILD_DIR', 'VERCEL_API_TOKEN', 'VERCEL_PROJECT_ID',
      'DEPLOYMENT_API_ENDPOINT', 'DEFAULT_HOST',
      'WEBHOOK_SECRET', 'VERCEL_WEBHOOK_SECRET'
    ]
  },
  // Storage configuration
  storage: {
    optional: [
      'UPLOAD_DIR', 'NEXT_PUBLIC_STORAGE_URL', 'NEXT_PUBLIC_UPLOADS_URL',
      'MAX_FILE_SIZE', 'ALLOWED_FILE_TYPES'
    ]
  },
  // AWS S3 configuration
  aws: {
    optional: [
      'AWS_S3_ENABLED', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION', 'AWS_S3_BUCKET',
      'S3_ENABLED', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY',
      'S3_REGION', 'S3_BUCKET'
    ]
  },
  // Redis configuration
  redis: {
    optional: [
      'REDIS_URL', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD',
      'CACHE_ENABLED', 'CACHE_TTL'
    ]
  },
  // Stripe configuration
  stripe: {
    optional: [
      'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
      'STRIPE_BASIC_PRICE_ID', 'STRIPE_PRO_PRICE_ID'
    ]
  },
  // Email configuration
  email: {
    optional: [
      'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'
    ]
  }
};

/**
 * Validate environment variables and return missing/misconfigured variables
 * @returns {Object} Result of the validation
 */
function validateEnv() {
  // Track missing and present variables
  const missing = {};
  const present = {};
  const warnings = [];
  
  // Validate each category
  Object.keys(envVars).forEach(category => {
    const { required = [], optional = [] } = envVars[category];
    
    // Check required variables
    const missingRequired = required.filter(name => !process.env[name]);
    if (missingRequired.length > 0) {
      missing[category] = missingRequired;
    }
    
    // Track present variables
    const presentVars = [...required, ...optional].filter(name => process.env[name]);
    if (presentVars.length > 0) {
      present[category] = presentVars;
    }
  });
  
  // Special case for database: either DB_URL or individual params are required
  if (!process.env.DB_URL && 
      (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER)) {
    missing.database = missing.database || [];
    missing.database.push('Either DB_URL or (DB_HOST, DB_NAME, DB_USER) are required');
  }
  
  // Special case for JWT secrets
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_ACCESS_SECRET) {
      warnings.push('JWT_ACCESS_SECRET not set in production - falling back to JWT_SECRET');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      warnings.push('JWT_REFRESH_SECRET not set in production - falling back to JWT_SECRET');
    }
  }
  
  // Check if cookies should be secure in production
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_COOKIE_SECURE !== 'true') {
    warnings.push('ENABLE_COOKIE_SECURE is not set to true in production. This is less secure.');
  }
  
  // Overall validation result
  const isValid = Object.keys(missing).length === 0;
  
  return {
    isValid,
    missing,
    present,
    warnings
  };
}

/**
 * Validate environment variables and log any issues
 * @param {Boolean} exitOnFailure Whether to exit the process if validation fails
 * @returns {Boolean} Whether the validation passed
 */
function checkEnv(exitOnFailure = true) {
  const { isValid, missing, warnings } = validateEnv();
  
  // Log any missing variables
  if (!isValid) {
    logger.error('Missing required environment variables:');
    Object.keys(missing).forEach(category => {
      logger.error(`  ${category}: ${missing[category].join(', ')}`);
    });
  }
  
  // Log any warnings
  if (warnings.length > 0) {
    logger.warn('Environment configuration warnings:');
    warnings.forEach(warning => {
      logger.warn(`  ${warning}`);
    });
  }
  
  // Exit if requested and validation failed
  if (!isValid && exitOnFailure) {
    logger.error('Exiting due to missing required environment variables');
    process.exit(1);
  }
  
  return isValid;
}

// Load default values for development
function loadDevDefaults() {
  if (process.env.NODE_ENV !== 'production') {
    // Only set defaults in development
    const defaults = {
      PORT: '3001',
      JWT_SECRET: 'dev_jwt_secret_key_not_for_production',
      JWT_ACCESS_SECRET: 'dev_access_key_not_for_production',
      JWT_REFRESH_SECRET: 'dev_refresh_key_not_for_production',
      JWT_ACCESS_EXPIRATION: '1h',
      JWT_REFRESH_EXPIRATION: '7d',
      CORS_ORIGIN: 'http://localhost:3000',
      FRONTEND_URL: 'http://localhost:3000',
      
      // Database
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'landing_pad_dev',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
      DB_SSL: 'false',
      DB_POOL_MAX: '10',
      DB_POOL_MIN: '2',
      
      // Authentication
      BYPASS_AUTH: 'false',
      AUTH_FETCH_USER: 'true',
      ASSUME_PAID_USER: 'true',
      
      // Rate limiting
      RATE_LIMIT_MAX: '100',
      RATE_LIMIT_WINDOW_MS: '900000',
      
      // Logging
      LOG_LEVEL: 'debug',
      LOG_FORMAT: 'dev',
      
      // File uploads
      UPLOAD_DIR: './uploads',
      MAX_FILE_SIZE: '5242880', // 5MB
      ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/gif,image/webp,application/pdf',
      NEXT_PUBLIC_STORAGE_URL: 'http://localhost:3001/storage',
      NEXT_PUBLIC_UPLOADS_URL: 'http://localhost:3001/uploads',
      
      // AWS S3
      AWS_S3_ENABLED: 'false',
      AWS_REGION: 'us-east-1',
      AWS_S3_BUCKET: 'landingpad-dxp-dev',
      
      // OpenAI
      OPENAI_MODEL: 'gpt-3.5-turbo',
      
      // Cache settings
      CACHE_ENABLED: 'true',
      CACHE_TTL: '3600',
      
      // Worker settings
      WORKER_ENABLED: 'true',
      WORKER_CONCURRENCY: '5',
      RUN_WORKER_IN_PROCESS: 'true'
    };
    
    // Only set if not already set
    Object.keys(defaults).forEach(key => {
      if (!process.env[key]) {
        process.env[key] = defaults[key];
        logger.debug(`[DEV] Setting default value for ${key}`);
      }
    });
    
    // Special case for S3 bucket name based on environment
    if (!process.env.AWS_S3_BUCKET) {
      const env = process.env.NODE_ENV || 'development';
      
      switch (env) {
        case 'production':
          process.env.AWS_S3_BUCKET = 'landingpad-dxp-prod';
          break;
        case 'staging':
          process.env.AWS_S3_BUCKET = 'landingpad-dxp-staging';
          break;
        case 'development':
        default:
          process.env.AWS_S3_BUCKET = 'landingpad-dxp-dev';
          break;
      }
      
      logger.debug(`[ENV] Setting AWS S3 bucket for ${env} environment: ${process.env.AWS_S3_BUCKET}`);
    }
    
    logger.info('Development environment defaults loaded');
  }
}

module.exports = {
  validateEnv,
  checkEnv,
  loadDevDefaults
};