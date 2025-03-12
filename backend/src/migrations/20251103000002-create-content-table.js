'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Contents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('template', 'page', 'section', 'component'),
        allowNull: false
      },
      content: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: []
      },
      preview: {
        type: Sequelize.STRING,
        allowNull: true
      },
      parentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Contents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      websiteId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Websites',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('Contents', ['userId']);
    await queryInterface.addIndex('Contents', ['websiteId']);
    await queryInterface.addIndex('Contents', ['type']);
    await queryInterface.addIndex('Contents', ['status']);
    await queryInterface.addIndex('Contents', ['slug']);
    await queryInterface.addIndex('Contents', ['parentId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Contents');
  }
};