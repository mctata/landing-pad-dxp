/**
 * Main seed script for running all seed operations
 */
require('dotenv').config();
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const seedTemplates = require('./templates');
const seedUsers = require('./users');
const seedWebsites = require('./websites');
const seedContent = require('./content');

// Run all seed functions
const runSeeds = async () => {
  try {
    logger.info('Starting database seeding...');
    
    // Sync database (only force in development with explicit flag)
    const forceSync = process.env.NODE_ENV === 'development' && process.env.DB_FORCE_RESET === 'true';
    await sequelize.sync({ force: forceSync });
    logger.info(`Database synced ${forceSync ? 'with force reset' : ''}`);
    
    // Run seeds in order - templates first, then users, then websites (which depend on users)
    await seedTemplates();
    
    // Seed users and websites (if not in production)
    if (process.env.NODE_ENV !== 'production') {
      await seedUsers();
      
      // Seed websites after users (since websites depend on users)
      await seedWebsites();
      
      // Seed content after users and websites (since content depends on both)
      await seedContent();
    }
    
    logger.info('All seeds completed successfully');
    
    // Close the database connection
    await sequelize.close();
    
    // Exit if running directly
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error running seeds:', error);
    
    if (require.main === module) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

// Run seeds if this file is executed directly
if (require.main === module) {
  runSeeds();
}

module.exports = runSeeds;
