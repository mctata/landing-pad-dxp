'use strict';

const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

/**
 * Content model
 * Represents a reusable content item (template, page, section, or component)
 */
module.exports = (sequelize) => {
  class Content extends Model {
    /**
     * Define associations with other models
     * @param {Object} models - The models object
     */
    static associate(models) {
      // Content belongs to a user
      Content.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      // Content may be associated with a website 
      // (optional - some content items are global templates)
      Content.belongsTo(models.Website, {
        foreignKey: 'websiteId',
        as: 'website',
        allowNull: true
      });
      
      // Content can have child items (e.g., sections in a template)
      Content.hasMany(Content, {
        foreignKey: 'parentId',
        as: 'children'
      });
      
      // Content can have a parent
      Content.belongsTo(Content, {
        foreignKey: 'parentId',
        as: 'parent',
        allowNull: true
      });
    }
  }

  Content.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('template', 'page', 'section', 'component'),
      allowNull: false
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    },
    preview: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Contents',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    websiteId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Websites',
        key: 'id'
      }
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Content',
    tableName: 'Contents',
    timestamps: true
  });

  // Hook: Before create
  Content.beforeCreate(async (content) => {
    // If publishing, set the publishedAt date
    if (content.status === 'published' && !content.publishedAt) {
      content.publishedAt = new Date();
    }
    
    // Generate a slug if not provided
    if (!content.slug) {
      const baseSlug = content.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .trim();
      
      // Check for existing slugs and make it unique if needed
      const existingWithSlug = await Content.count({
        where: { 
          slug: baseSlug 
        }
      });
      
      if (existingWithSlug > 0) {
        content.slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
      } else {
        content.slug = baseSlug;
      }
    }
  });
  
  // Hook: Before update
  Content.beforeUpdate(async (content) => {
    // If status is changing to published, set publishedAt
    if (content.changed('status') && 
        content.status === 'published' && 
        !content.publishedAt) {
      content.publishedAt = new Date();
    }
  });

  return Content;
};