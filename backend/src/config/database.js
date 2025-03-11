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

module.exports = { 
  sequelize,
  testConnection
};
