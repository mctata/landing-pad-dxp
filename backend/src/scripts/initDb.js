/**
 * Database initialization script
 * 
 * This script initializes the database, creates all tables, and seeds initial data.
 * It's meant to be run manually during initial setup or for development purposes.
 * 
 * Usage:
 *   - Normal initialization: node src/scripts/initDb.js
 *   - Force reset (drop all tables): node src/scripts/initDb.js --force
 *   - Run migrations: node src/scripts/initDb.js --migrate
 *   - Skip seeding: node src/scripts/initDb.js --no-seed
 *   - Production mode: node src/scripts/initDb.js --production
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Import all models to ensure they're registered with Sequelize
const models = require('../models');

// Import seed functions
const seedTemplates = require('../seeds/templates');
const seedUsers = require('../seeds/users');
const seedWebsites = require('../seeds/websites');
const seedContent = require('../seeds/content');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  migrate: args.includes('--migrate'),
  seed: !args.includes('--no-seed'),
  production: args.includes('--production')
};

async function runMigrations() {
  logger.info('Running database migrations...');
  
  try {
    // Determine the path to sequelize-cli
    const sequelizePath = path.resolve(__dirname, '../../node_modules/.bin/sequelize');
    
    // Run migrations
    const { stdout, stderr } = await execPromise(`${sequelizePath} db:migrate`);
    
    if (stderr) {
      logger.warn('Migration warnings:', stderr);
    }
    
    logger.info('Migrations completed successfully:');
    logger.info(stdout);
    
    return true;
  } catch (error) {
    logger.error('Migration error:', error.message);
    if (error.stdout) logger.error(error.stdout);
    if (error.stderr) logger.error(error.stderr);
    return false;
  }
}

async function initializeDatabase() {
  logger.info(`Initializing database with options: ${JSON.stringify(options)}`);
  
  try {
    // Test connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    // If production mode, only run migrations (no sync or forced reset)
    if (options.production) {
      logger.info('Running in production mode - only running migrations');
      if (options.migrate) {
        const migrationsSuccessful = await runMigrations();
        if (!migrationsSuccessful) {
          throw new Error('Migrations failed in production mode');
        }
      } else {
        logger.info('Skipping migrations (not requested)');
      }
    } else {
      // Development mode - can use sync
      if (options.migrate) {
        logger.info('Running migrations instead of sync...');
        await runMigrations();
      } else {
        // Sync database (create tables)
        logger.info(`Synchronizing database${options.force ? ' with force reset' : ''}...`);
        await sequelize.sync({ force: options.force });
        logger.info(`Database schema ${options.force ? 'reset and ' : ''}synchronized.`);
      }
      
      // Seed initial data if force is true or if tables are empty
      if (options.seed && (options.force || await isEmptyDatabase())) {
        logger.info('Seeding initial data...');
        
        // Seed admin user
        await seedUsers();
        logger.info('Users seeded.');
        
        // Seed templates
        await seedTemplates();
        logger.info('Templates seeded.');
        
        // Seed example websites
        await seedWebsites();
        logger.info('Example websites seeded.');
        
        // Seed content
        await seedContent();
        logger.info('Content seeded.');
        
        logger.info('Database seeding completed.');
      } else if (!options.seed) {
        logger.info('Seeding skipped (--no-seed flag provided).');
      } else {
        logger.info('Database already contains data, skipping seed process.');
      }
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