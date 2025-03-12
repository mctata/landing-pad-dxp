const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Domain model for tracking custom domains
 */
class Domain extends Model {}

Domain.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isDomain(value) {
          const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
          if (!domainRegex.test(value)) {
            throw new Error('Invalid domain name format');
          }
        },
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'error'),
      allowNull: false,
      defaultValue: 'pending',
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    verificationErrors: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dnsRecords: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    lastVerifiedAt: {
      type: DataTypes.DATE,
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
    modelName: 'Domain',
    tableName: 'Domains',
    indexes: [
      {
        unique: true,
        fields: ['name'],
      },
      {
        fields: ['websiteId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['verificationStatus'],
      },
    ],
  }
);

module.exports = Domain;