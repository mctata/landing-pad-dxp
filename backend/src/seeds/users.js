/**
 * Seed users for development and testing
 */
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Creates a default admin user and demo users
 */
async function seedUsers() {
  try {
    // Admin user
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    await User.create({
      email: 'admin@landingpad.dev',
      password: hashedAdminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active',
      subscriptionTier: 'pro'
    });
    
    // Demo user
    const demoPassword = process.env.DEMO_DEFAULT_PASSWORD || 'demo123';
    const hashedDemoPassword = await bcrypt.hash(demoPassword, 10);
    
    await User.create({
      email: 'demo@landingpad.dev',
      password: hashedDemoPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      status: 'active',
      subscriptionTier: 'basic'
    });
    
    // Test user with advanced tier
    const testPassword = process.env.TEST_DEFAULT_PASSWORD || 'test123';
    const hashedTestPassword = await bcrypt.hash(testPassword, 10);
    
    await User.create({
      email: 'test@landingpad.dev',
      password: hashedTestPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      status: 'active',
      subscriptionTier: 'advanced'
    });
    
    logger.info('Created admin and demo users');
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
}

module.exports = seedUsers;