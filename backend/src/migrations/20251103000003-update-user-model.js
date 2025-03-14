'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if columns already exist
      const tableInfo = await queryInterface.describeTable('Users');
      
      // Add refreshToken column if it doesn't exist
      if (!tableInfo.refreshToken) {
        await queryInterface.addColumn('Users', 'refreshToken', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }
      
      // Add stripeCustomerId column if it doesn't exist
      if (!tableInfo.stripeCustomerId) {
        await queryInterface.addColumn('Users', 'stripeCustomerId', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }
      
      // Add stripeSubscriptionId column if it doesn't exist
      if (!tableInfo.stripeSubscriptionId) {
        await queryInterface.addColumn('Users', 'stripeSubscriptionId', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }
      
      // Add lastLogin column if it doesn't exist
      if (!tableInfo.lastLogin) {
        await queryInterface.addColumn('Users', 'lastLogin', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }
      
      // Add verificationToken column if it doesn't exist
      if (!tableInfo.verificationToken) {
        await queryInterface.addColumn('Users', 'verificationToken', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }
      
      // Add resetPasswordToken column if it doesn't exist
      if (!tableInfo.resetPasswordToken) {
        await queryInterface.addColumn('Users', 'resetPasswordToken', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }
      
      // Add resetPasswordExpires column if it doesn't exist
      if (!tableInfo.resetPasswordExpires) {
        await queryInterface.addColumn('Users', 'resetPasswordExpires', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }
      
      // Update subscriptionTier enum if needed
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Users_subscriptionTier" ADD VALUE IF NOT EXISTS 'basic';
        ALTER TYPE "enum_Users_subscriptionTier" ADD VALUE IF NOT EXISTS 'advanced';
      `, { transaction });
      
      await transaction.commit();
      console.log('User model updated successfully.');
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating User model:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove columns added in 'up'
      await queryInterface.removeColumn('Users', 'refreshToken', { transaction });
      await queryInterface.removeColumn('Users', 'stripeCustomerId', { transaction });
      await queryInterface.removeColumn('Users', 'stripeSubscriptionId', { transaction });
      await queryInterface.removeColumn('Users', 'lastLogin', { transaction });
      
      // Note: Cannot easily revert enum changes, so we don't attempt to remove the added enum values
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error reverting User model changes:', error);
      throw error;
    }
  }
};