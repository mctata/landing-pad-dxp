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
    optional: ['API_VERSION', 'LOG_LEVEL', 'LOG_FORMAT', 'ENABLE_COMPRESSION', 'ENABLE_HELMET']
  },
  // Database configuration
  database: {
    required: [], // Either DB_URL or individual connection params
    optional: ['DB_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_SSL']
  },
  // Authentication configuration
  auth: {
    required: ['JWT_SECRET'],
    optional: [
      'JWT_ACCESS_SECRET', 'JWT_ACCESS_EXPIRATION',
      'JWT_REFRESH_SECRET', 'JWT_REFRESH_EXPIRATION',
      'ENABLE_COOKIE_SECURE', 'BYPASS_AUTH'
    ]
  },
  // CORS configuration
  cors: {
    required: ['CORS_ORIGIN'],
    optional: ['CORS_METHODS']
  },
  // Rate limiting
  rateLimiting: {
    optional: ['RATE_LIMIT_MAX', 'RATE_LIMIT_WINDOW_MS']
  },
  // OpenAI configuration
  openai: {
    optional: ['OPENAI_API_KEY', 'OPENAI_MODEL']
  },
  // Deployment configuration
  deployment: {
    optional: ['RUN_WORKER_IN_PROCESS', 'ASSUME_PAID_USER']
  },
  // Storage configuration
  storage: {
    optional: ['UPLOAD_DIR', 'NEXT_PUBLIC_STORAGE_URL', 'NEXT_PUBLIC_UPLOADS_URL']
  },
  // Redis configuration
  redis: {
    optional: ['REDIS_URL']
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
      CORS_ORIGIN: 'http://localhost:3000',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'landing_pad_dev',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
      LOG_LEVEL: 'debug',
      OPENAI_MODEL: 'gpt-3.5-turbo',
      UPLOAD_DIR: './uploads',
      NEXT_PUBLIC_STORAGE_URL: 'http://localhost:3001/storage',
      NEXT_PUBLIC_UPLOADS_URL: 'http://localhost:3001/uploads'
    };
    
    // Only set if not already set
    Object.keys(defaults).forEach(key => {
      if (!process.env[key]) {
        process.env[key] = defaults[key];
        logger.debug(`[DEV] Setting default value for ${key}`);
      }
    });
    
    logger.info('Development environment defaults loaded');
  }
}

module.exports = {
  validateEnv,
  checkEnv,
  loadDevDefaults
};