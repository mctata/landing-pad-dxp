/**
 * Database initialization script
 * 
 * This script initializes the database, creates all tables, and seeds initial data.
 * It's meant to be run manually during initial setup or for development purposes.
 * 
 * Usage:
 *   - Normal initialization: node src/scripts/initDb.js
 *   - Force reset (drop all tables): node src/scripts/initDb.js --force
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

// Import all models to ensure they're registered with Sequelize
const models = require('../models');

// Import seed functions
const seedTemplates = require('../seeds/templates');
const seedUsers = require('../seeds/users');

async function initializeDatabase() {
  const force = process.argv.includes('--force');
  
  logger.info(`Initializing database${force ? ' with force reset' : ''}...`);
  
  try {
    // Test connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    // Sync database (create tables)
    await sequelize.sync({ force });
    logger.info(`Database schema ${force ? 'reset and ' : ''}synchronized.`);
    
    // Seed initial data if force is true or if tables are empty
    const shouldSeed = force || await isEmptyDatabase();
    
    if (shouldSeed) {
      logger.info('Seeding initial data...');
      
      // Add admin user (if on development/testing)
      if (process.env.NODE_ENV !== 'production') {
        await seedUsers();
        logger.info('Users seeded.');
      }
      
      // Add templates
      await seedTemplates();
      logger.info('Templates seeded.');
      
      logger.info('Database seeding completed.');
    } else {
      logger.info('Database already contains data, skipping seed process.');
    }
    
    logger.info('Database initialization completed successfully.');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  } finally {
    // Close connection
    await sequelize.close();
  }
}

// Helper function to check if the database is empty
async function isEmptyDatabase() {
  try {
    const userCount = await models.User.count();
    const templateCount = await models.Template.count();
    
    return userCount === 0 && templateCount === 0;
  } catch (error) {
    logger.error('Error checking if database is empty:', error);
    return true; // Assume empty if there's an error
  }
}

// Run the initialization
initializeDatabase();