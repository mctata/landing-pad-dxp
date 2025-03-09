require('dotenv').config();
const { sequelize } = require('../config/database');
const seedTemplates = require('./templates');

// Run all seed functions
const runSeeds = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: process.env.NODE_ENV === 'development' });
    
    // Run seeds
    await seedTemplates();
    
    console.log('All seeds completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  }
};

// Run seeds if this file is executed directly
if (require.main === module) {
  runSeeds();
}

module.exports = runSeeds;
