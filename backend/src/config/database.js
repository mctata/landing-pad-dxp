const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Create Sequelize connection with proper SSL handling
 * @returns {Sequelize} Sequelize instance with connection
 */
const createSequelizeConnection = () => {
  // Determine if SSL should be used
  const useSSL = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
  
  // Configure SSL options based on environment
  const sslOptions = useSSL ? {
    require: true,
    rejectUnauthorized: process.env.NODE_ENV === 'production' && process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false;
  
  logger.debug(`Database SSL config: ${useSSL ? 'enabled' : 'disabled'}, rejectUnauthorized: ${useSSL ? sslOptions.rejectUnauthorized : 'N/A'}`);
  
  // Shared options used in both connection methods
  const commonOptions = {
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    dialectOptions: { ssl: sslOptions },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)
    },
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: parseInt(process.env.DB_RETRY_MAX || '5', 10)
    }
  };
  
  if (process.env.DB_URL) {
    // Using connection URL (recommended for production)
    logger.debug('Using database connection URL');
    return new Sequelize(process.env.DB_URL, commonOptions);
  } else {
    // Using individual connection parameters
    logger.debug('Using individual database connection parameters');
    return new Sequelize({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'landing_pad_dev',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      dialect: 'postgres',
      ...commonOptions
    });
  }
};

// Create the connection
const sequelize = createSequelizeConnection();

/**
 * Test the database connection
 * @returns {Promise<boolean>} Whether the connection was successful
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    return false;
  }
};

/**
 * Initialize database with automatic migration
 * @param {boolean} forceSync Whether to force sync (drop tables and recreate)
 * @param {boolean} alterTables Whether to alter tables to match models
 * @returns {Promise<boolean>} Whether initialization was successful
 */
const initializeDatabase = async (forceSync = false, alterTables = false) => {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Could not connect to database');
    }
    
    // Determine if we should sync (create tables)
    if (process.env.NODE_ENV === 'production' && !forceSync && !alterTables) {
      logger.info('Skipping automatic schema sync in production. Run migrations manually.');
      return true;
    }
    
    if (forceSync) {
      logger.warn('Synchronizing database with FORCE=TRUE. All data will be lost!');
      await sequelize.sync({ force: true });
      logger.info('Database schema reset and synchronized successfully.');
    } else if (alterTables) {
      logger.info('Synchronizing database with ALTER=TRUE. Tables will be modified to match models.');
      await sequelize.sync({ alter: true });
      logger.info('Database schema altered successfully.');
    } else {
      logger.info('Synchronizing database (safe mode).');
      await sequelize.sync();
      logger.info('Database schema synchronized successfully.');
    }
    
    return true;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    return false;
  }
};

/**
 * Close the database connection
 * @returns {Promise<void>}
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed successfully.');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

module.exports = { 
  sequelize,
  testConnection,
  initializeDatabase,
  closeConnection
};
