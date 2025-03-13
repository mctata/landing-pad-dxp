const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Create Sequelize connection
const createSequelizeConnection = () => {
  if (process.env.DB_URL) {
    // If using connection URL (recommended for production environments)
    return new Sequelize(process.env.DB_URL, {
      logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      pool: {
        max: 10,                    // Maximum number of connection in pool
        min: 2,                     // Minimum number of connection in pool
        acquire: 30000,             // Maximum time (ms) that pool will try to get connection before throwing error
        idle: 10000                 // Maximum time (ms) that a connection can be idle before being released
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
        max: 5                     // How many times to retry a failing query
      }
    });
  } else {
    // If using individual connection parameters
    return new Sequelize({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'landing_pad_dev',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      pool: {
        max: 10,                    // Maximum number of connection in pool
        min: 2,                     // Minimum number of connection in pool
        acquire: 30000,             // Maximum time (ms) that pool will try to get connection before throwing error
        idle: 10000                 // Maximum time (ms) that a connection can be idle before being released
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
        max: 5                     // How many times to retry a failing query
      }
    });
  }
};

const sequelize = createSequelizeConnection();

// Test the connection
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

// Initialize database with automatic migration
const initializeDatabase = async (forceSync = false) => {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Could not connect to database');
    }
    
    // Determine if we should sync (create tables)
    if (process.env.NODE_ENV !== 'production' || forceSync) {
      logger.info(`Synchronizing database schema (force=${forceSync})...`);
      await sequelize.sync({ force: forceSync });
      logger.info('Database schema synchronized successfully.');
    } else {
      logger.info('Skipping automatic schema sync in production. Run migrations manually.');
    }
    
    return true;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    return false;
  }
};

module.exports = { 
  sequelize,
  testConnection,
  initializeDatabase
};
