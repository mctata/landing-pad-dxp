'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if columns already exist
      const tableInfo = await queryInterface.describeTable('Users');
      
      // Add profilePicture column if it doesn't exist
      if (!tableInfo.profilePicture) {
        await queryInterface.addColumn('Users', 'profilePicture', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }
      
      // Add googleId column if it doesn't exist
      if (!tableInfo.googleId) {
        await queryInterface.addColumn('Users', 'googleId', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }
      
      // Add facebookId column if it doesn't exist
      if (!tableInfo.facebookId) {
        await queryInterface.addColumn('Users', 'facebookId', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }
      
      // Add linkedinId column if it doesn't exist
      if (!tableInfo.linkedinId) {
        await queryInterface.addColumn('Users', 'linkedinId', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }
      
      // Add tokenExpiresAt column if it doesn't exist
      if (!tableInfo.tokenExpiresAt) {
        await queryInterface.addColumn('Users', 'tokenExpiresAt', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }
      
      await transaction.commit();
      console.log('Social login fields added to User model successfully.');
    } catch (error) {
      await transaction.rollback();
      console.error('Error adding social login fields to User model:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove columns added in 'up'
      await queryInterface.removeColumn('Users', 'profilePicture', { transaction });
      await queryInterface.removeColumn('Users', 'googleId', { transaction });
      await queryInterface.removeColumn('Users', 'facebookId', { transaction });
      await queryInterface.removeColumn('Users', 'linkedinId', { transaction });
      await queryInterface.removeColumn('Users', 'tokenExpiresAt', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error reverting social login field changes:', error);
      throw error;
    }
  }
};