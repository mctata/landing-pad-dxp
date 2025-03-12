const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Deployment model for tracking website deployments
 */
class Deployment extends Model {}

Deployment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    websiteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Websites',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('queued', 'in_progress', 'success', 'failed', 'canceled'),
      allowNull: false,
      defaultValue: 'queued',
    },
    version: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    commitMessage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    buildTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Build time in milliseconds',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deploymentUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    buildLogs: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Deployment',
    tableName: 'Deployments',
  }
);

module.exports = Deployment;