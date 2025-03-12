'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if an admin user already exists
    const [existingAdmins] = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" WHERE role = \'admin\' LIMIT 1;'
    );
    
    if (existingAdmins.length > 0) {
      console.log('Admin user already exists, skipping creation.');
      return;
    }
    
    // Create a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create an admin user
    await queryInterface.bulkInsert('Users', [{
      id: uuidv4(),
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@landingpad.dev',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      subscriptionTier: 'pro',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    
    console.log('Admin user created successfully.');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove admin users
    await queryInterface.bulkDelete('Users', {
      role: 'admin',
      email: 'admin@landingpad.dev'
    }, {});
  }
};