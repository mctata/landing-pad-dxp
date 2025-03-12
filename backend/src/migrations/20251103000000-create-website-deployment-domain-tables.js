'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Websites table
    await queryInterface.createTable('Websites', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      content: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      settings: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      publicUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastPublishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastDeployedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastSuccessfulDeploymentId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes for Website table
    await queryInterface.addIndex('Websites', ['userId']);
    await queryInterface.addIndex('Websites', ['status']);

    // Create Deployments table
    await queryInterface.createTable('Deployments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      websiteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Websites',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('queued', 'in_progress', 'success', 'failed', 'canceled'),
        allowNull: false,
        defaultValue: 'queued',
      },
      version: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      commitMessage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      buildTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Build time in milliseconds',
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deploymentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      buildLogs: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      errorMessage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes for Deployments table
    await queryInterface.addIndex('Deployments', ['websiteId']);
    await queryInterface.addIndex('Deployments', ['userId']);
    await queryInterface.addIndex('Deployments', ['status']);

    // Create Domains table
    await queryInterface.createTable('Domains', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      websiteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Websites',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'error'),
        allowNull: false,
        defaultValue: 'pending',
      },
      verificationStatus: {
        type: Sequelize.ENUM('pending', 'verified', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      verificationErrors: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isPrimary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      dnsRecords: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      lastVerifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes for Domains table
    await queryInterface.addIndex('Domains', ['websiteId']);
    await queryInterface.addIndex('Domains', ['userId']);
    await queryInterface.addIndex('Domains', ['status']);
    await queryInterface.addIndex('Domains', ['verificationStatus']);

    // Update Website table to add foreign key to Deployments
    await queryInterface.addConstraint('Websites', {
      fields: ['lastSuccessfulDeploymentId'],
      type: 'foreign key',
      name: 'fk_website_last_deployment',
      references: {
        table: 'Deployments',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraint first
    await queryInterface.removeConstraint('Websites', 'fk_website_last_deployment');
    
    // Drop tables in reverse order
    await queryInterface.dropTable('Domains');
    await queryInterface.dropTable('Deployments');
    await queryInterface.dropTable('Websites');
    
    // Drop enum types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Websites_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Deployments_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Domains_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Domains_verificationStatus";');
  }
};