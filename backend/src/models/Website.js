const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Website model for storing websites
 */
class Website extends Model {}

Website.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    content: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        pages: [
          {
            id: 'home',
            name: 'Home',
            slug: 'home',
            isHome: true,
            elements: []
          }
        ]
      },
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        colors: {
          primary: '#3B82F6',
          secondary: '#1E293B',
          accent: '#06B6D4',
          background: '#F8FAFC',
          text: '#0F172A'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter'
        },
        globalStyles: {
          borderRadius: '0.5rem',
          buttonStyle: 'rounded'
        }
      },
    },
    publicUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastPublishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastDeployedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastSuccessfulDeploymentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Deployments',
        key: 'id',
      },
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL',
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
    modelName: 'Website',
    tableName: 'Websites',
    hooks: {
      beforeCreate: (website) => {
        // Generate slug from name if not provided
        if (!website.slug) {
          let slug = website.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
            
          // Add random suffix to ensure uniqueness
          const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          website.slug = `${slug}-${randomSuffix}`;
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

module.exports = Website;