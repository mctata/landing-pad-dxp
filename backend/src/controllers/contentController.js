const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');
const { Content, User, Website } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs').promises;

/**
 * Controller for content management
 */
const contentController = {
  /**
   * Get all content with filtering and pagination
   * @route GET /api/admin/content
   */
  async getAllContent(req, res, next) {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        throw new APIError('Unauthorized', 401);
      }

      const { 
        page = 1, 
        limit = 12, 
        type, 
        status,
        search = '',
        websiteId,
        tags
      } = req.query;
      
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      // Build query conditions
      const whereClause = {};
      
      // Filter by content type
      if (type && type !== 'all') {
        whereClause.type = type;
      }
      
      // Filter by status
      if (status) {
        whereClause.status = status;
      }
      
      // Filter by website ID
      if (websiteId) {
        whereClause.websiteId = websiteId;
      }
      
      // Filter by tags
      if (tags) {
        const tagArray = tags.split(',');
        whereClause.tags = {
          [Op.overlap]: tagArray
        };
      }
      
      // Search by title or description
      if (search) {
        whereClause[Op.or] = [
          {
            title: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            description: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            tags: {
              [Op.contains]: [search]
            }
          }
        ];
      }
      
      // Non-admin users can only see their own content or published content
      if (req.user.role !== 'admin') {
        whereClause[Op.or] = [
          { userId: req.user.id },
          { status: 'published' }
        ];
      }

      // Execute query with pagination
      const { count, rows } = await Content.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit, 10),
        offset,
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Website,
            as: 'website',
            attributes: ['id', 'name'],
            required: false
          }
        ]
      });

      // Format response data for the frontend
      const formattedContent = rows.map(content => ({
        id: content.id,
        title: content.title,
        type: content.type,
        status: content.status,
        author: {
          id: content.user.id,
          name: `${content.user.firstName} ${content.user.lastName}`
        },
        tags: content.tags,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
        publishedAt: content.publishedAt,
        preview: content.preview,
        slug: content.slug,
        description: content.description,
        websiteId: content.websiteId,
        websiteName: content.website ? content.website.name : null
      }));

      // Calculate pagination info
      const totalItems = count;
      const totalPages = Math.ceil(totalItems / parseInt(limit, 10));

      res.status(200).json({
        content: formattedContent,
        pagination: {
          totalItems,
          itemsPerPage: parseInt(limit, 10),
          currentPage: parseInt(page, 10),
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get content by ID
   * @route GET /api/admin/content/:contentId
   */
  async getContentById(req, res, next) {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        throw new APIError('Unauthorized', 401);
      }

      const { contentId } = req.params;

      // Get content
      const content = await Content.findByPk(contentId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Website,
            as: 'website',
            attributes: ['id', 'name'],
            required: false
          }
        ]
      });

      if (!content) {
        throw new APIError('Content not found', 404);
      }

      // Non-admin users can only view their own content or published content
      if (req.user.role !== 'admin' && 
          content.userId !== req.user.id && 
          content.status !== 'published') {
        throw new APIError('You do not have permission to view this content', 403);
      }

      // Format response
      const formattedContent = {
        id: content.id,
        title: content.title,
        description: content.description,
        type: content.type,
        content: content.content,
        status: content.status,
        author: {
          id: content.user.id,
          name: `${content.user.firstName} ${content.user.lastName}`
        },
        tags: content.tags,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
        publishedAt: content.publishedAt,
        preview: content.preview,
        slug: content.slug,
        websiteId: content.websiteId,
        websiteName: content.website ? content.website.name : null,
        config: content.config,
        parentId: content.parentId
      };

      res.status(200).json({ content: formattedContent });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new content
   * @route POST /api/admin/content
   */
  async createContent(req, res, next) {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        throw new APIError('Unauthorized', 401);
      }

      const {
        title,
        description,
        type,
        content,
        status = 'draft',
        tags = [],
        preview,
        websiteId,
        config = {},
        parentId,
        slug
      } = req.body;

      // Validate required fields
      if (!title || !type) {
        throw new APIError('Title and type are required', 400);
      }

      // Validate content type
      const validTypes = ['template', 'page', 'section', 'component'];
      if (!validTypes.includes(type)) {
        throw new APIError(`Invalid content type. Must be one of: ${validTypes.join(', ')}`, 400);
      }

      // Check if website exists if websiteId is provided
      if (websiteId) {
        const website = await Website.findByPk(websiteId);
        if (!website) {
          throw new APIError('Website not found', 404);
        }

        // Check if user has permission to add content to this website
        if (req.user.role !== 'admin' && website.userId !== req.user.id) {
          throw new APIError('You do not have permission to add content to this website', 403);
        }
      }

      // Check if parent content exists if parentId is provided
      if (parentId) {
        const parentContent = await Content.findByPk(parentId);
        if (!parentContent) {
          throw new APIError('Parent content not found', 404);
        }
      }

      // Set published date if status is published
      const publishedAt = status === 'published' ? new Date() : null;

      // Create content
      const newContent = await Content.create({
        title,
        description,
        type,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        status,
        publishedAt,
        tags,
        preview,
        userId: req.user.id,
        websiteId,
        config: typeof config === 'string' ? config : JSON.stringify(config),
        parentId,
        slug
      });

      logger.info(`Content created: ${newContent.id}`);

      res.status(201).json({
        message: 'Content created successfully',
        content: {
          id: newContent.id,
          title: newContent.title,
          type: newContent.type,
          status: newContent.status,
          createdAt: newContent.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update content
   * @route PUT /api/admin/content/:contentId
   */
  async updateContent(req, res, next) {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        throw new APIError('Unauthorized', 401);
      }

      const { contentId } = req.params;
      const {
        title,
        description,
        type,
        content,
        status,
        tags,
        preview,
        websiteId,
        config,
        parentId,
        slug
      } = req.body;

      // Get content
      const existingContent = await Content.findByPk(contentId);

      if (!existingContent) {
        throw new APIError('Content not found', 404);
      }

      // Check if user has permission to update content
      if (req.user.role !== 'admin' && existingContent.userId !== req.user.id) {
        throw new APIError('You do not have permission to update this content', 403);
      }

      // Check if website exists if websiteId is being updated
      if (websiteId && websiteId !== existingContent.websiteId) {
        const website = await Website.findByPk(websiteId);
        if (!website) {
          throw new APIError('Website not found', 404);
        }

        // Check if user has permission to add content to this website
        if (req.user.role !== 'admin' && website.userId !== req.user.id) {
          throw new APIError('You do not have permission to add content to this website', 403);
        }
      }

      // Check if parent content exists if parentId is being updated
      if (parentId && parentId !== existingContent.parentId) {
        // Don't allow circular references
        if (parentId === contentId) {
          throw new APIError('Content cannot be its own parent', 400);
        }

        const parentContent = await Content.findByPk(parentId);
        if (!parentContent) {
          throw new APIError('Parent content not found', 404);
        }
      }

      // Set updates
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (type !== undefined) {
        // Validate content type
        const validTypes = ['template', 'page', 'section', 'component'];
        if (!validTypes.includes(type)) {
          throw new APIError(`Invalid content type. Must be one of: ${validTypes.join(', ')}`, 400);
        }
        updates.type = type;
      }
      if (content !== undefined) {
        updates.content = typeof content === 'string' ? content : JSON.stringify(content);
      }
      if (status !== undefined) {
        updates.status = status;
        // Update publishedAt if status is changing to published
        if (status === 'published' && existingContent.status !== 'published') {
          updates.publishedAt = new Date();
        }
      }
      if (tags !== undefined) updates.tags = tags;
      if (preview !== undefined) updates.preview = preview;
      if (websiteId !== undefined) updates.websiteId = websiteId;
      if (config !== undefined) {
        updates.config = typeof config === 'string' ? config : JSON.stringify(config);
      }
      if (parentId !== undefined) updates.parentId = parentId;
      if (slug !== undefined) updates.slug = slug;

      // Update content
      await existingContent.update(updates);

      logger.info(`Content updated: ${contentId}`);

      res.status(200).json({
        message: 'Content updated successfully',
        content: {
          id: existingContent.id,
          title: existingContent.title,
          type: existingContent.type,
          status: existingContent.status,
          updatedAt: existingContent.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete content
   * @route DELETE /api/admin/content/:contentId
   */
  async deleteContent(req, res, next) {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        throw new APIError('Unauthorized', 401);
      }

      const { contentId } = req.params;

      // Get content
      const content = await Content.findByPk(contentId);

      if (!content) {
        throw new APIError('Content not found', 404);
      }

      // Check if user has permission to delete content
      if (req.user.role !== 'admin' && content.userId !== req.user.id) {
        throw new APIError('You do not have permission to delete this content', 403);
      }

      // Check if content has children
      const childrenCount = await Content.count({
        where: { parentId: contentId }
      });

      if (childrenCount > 0) {
        throw new APIError('Cannot delete content that has child content. Please delete the children first.', 400);
      }

      // Delete content
      await content.destroy();

      logger.info(`Content deleted: ${contentId}`);

      res.status(200).json({
        message: 'Content deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all tags
   * @route GET /api/admin/content/tags
   */
  async getAllTags(req, res, next) {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        throw new APIError('Unauthorized', 401);
      }

      // Custom query to extract all unique tags
      const result = await Content.sequelize.query(`
        SELECT DISTINCT unnest(tags) as tag
        FROM "Contents"
        ORDER BY tag ASC
      `, { type: Content.sequelize.QueryTypes.SELECT });

      const tags = result.map(item => item.tag);

      res.status(200).json({ tags });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Publish content
   * @route POST /api/admin/content/:contentId/publish
   */
  async publishContent(req, res, next) {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        throw new APIError('Unauthorized', 401);
      }

      const { contentId } = req.params;

      // Get content
      const content = await Content.findByPk(contentId);

      if (!content) {
        throw new APIError('Content not found', 404);
      }

      // Check if user has permission to publish content
      if (req.user.role !== 'admin' && content.userId !== req.user.id) {
        throw new APIError('You do not have permission to publish this content', 403);
      }

      // Update status to published
      await content.update({
        status: 'published',
        publishedAt: new Date()
      });

      logger.info(`Content published: ${contentId}`);

      res.status(200).json({
        message: 'Content published successfully',
        content: {
          id: content.id,
          title: content.title,
          status: content.status,
          publishedAt: content.publishedAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Unpublish content
   * @route POST /api/admin/content/:contentId/unpublish
   */
  async unpublishContent(req, res, next) {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        throw new APIError('Unauthorized', 401);
      }

      const { contentId } = req.params;

      // Get content
      const content = await Content.findByPk(contentId);

      if (!content) {
        throw new APIError('Content not found', 404);
      }

      // Check if user has permission to unpublish content
      if (req.user.role !== 'admin' && content.userId !== req.user.id) {
        throw new APIError('You do not have permission to unpublish this content', 403);
      }

      // Update status to draft
      await content.update({
        status: 'draft'
      });

      logger.info(`Content unpublished: ${contentId}`);

      res.status(200).json({
        message: 'Content unpublished successfully',
        content: {
          id: content.id,
          title: content.title,
          status: content.status
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Clone content
   * @route POST /api/admin/content/:contentId/clone
   */
  async cloneContent(req, res, next) {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        throw new APIError('Unauthorized', 401);
      }

      const { contentId } = req.params;
      const { title } = req.body;

      // Get content
      const content = await Content.findByPk(contentId);

      if (!content) {
        throw new APIError('Content not found', 404);
      }

      // Non-admin users can only clone their own content or published content
      if (req.user.role !== 'admin' && 
          content.userId !== req.user.id && 
          content.status !== 'published') {
        throw new APIError('You do not have permission to clone this content', 403);
      }

      // Create clone
      const clonedContent = await Content.create({
        title: title || `${content.title} (Copy)`,
        description: content.description,
        type: content.type,
        content: content.content,
        status: 'draft',
        tags: content.tags,
        preview: content.preview,
        userId: req.user.id,
        websiteId: content.websiteId,
        config: content.config,
        parentId: content.parentId
      });

      logger.info(`Content cloned: ${contentId} -> ${clonedContent.id}`);

      res.status(201).json({
        message: 'Content cloned successfully',
        content: {
          id: clonedContent.id,
          title: clonedContent.title,
          type: clonedContent.type,
          status: clonedContent.status
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Import content from file (JSON or ZIP)
   * @route POST /api/admin/content/import
   */
  async importContent(req, res, next) {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        throw new APIError('Unauthorized', 401);
      }

      // Check if file exists
      if (!req.file) {
        throw new APIError('No file uploaded', 400);
      }

      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      
      // Process different file types
      let importedData = [];
      let importedCount = 0;
      
      if (fileExtension === 'json') {
        // Process JSON file
        try {
          const fileContent = await fs.readFile(req.file.path, 'utf8');
          const parsedData = JSON.parse(fileContent);
          
          if (Array.isArray(parsedData)) {
            importedData = parsedData;
          } else if (parsedData.items && Array.isArray(parsedData.items)) {
            importedData = parsedData.items;
          } else {
            importedData = [parsedData];
          }
        } catch (parseError) {
          throw new APIError('Invalid JSON file', 400);
        }
      } else if (fileExtension === 'zip') {
        // For ZIP files, we would extract and process the contents
        // This would require additional libraries like 'adm-zip' or 'unzipper'
        throw new APIError('ZIP import not yet implemented', 501);
      } else {
        throw new APIError('Unsupported file format. Please upload a JSON or ZIP file.', 400);
      }
      
      // Validate and import content items
      const validItems = [];
      
      for (const item of importedData) {
        // Basic validation
        if (!item.title || !item.type) {
          continue;
        }
        
        // Validate content type
        const validTypes = ['template', 'page', 'section', 'component'];
        if (!validTypes.includes(item.type)) {
          continue;
        }
        
        // Prepare for import
        const contentItem = {
          title: item.title,
          description: item.description || null,
          type: item.type,
          content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content || {}),
          status: 'draft', // Always import as draft
          tags: Array.isArray(item.tags) ? item.tags : [],
          preview: item.preview || null,
          userId: req.user.id,
          websiteId: null, // Don't associate with a website during import
          config: typeof item.config === 'string' ? item.config : JSON.stringify(item.config || {})
        };
        
        validItems.push(contentItem);
      }
      
      // Import valid items
      if (validItems.length > 0) {
        const importedItems = await Content.bulkCreate(validItems);
        importedCount = importedItems.length;
      }
      
      // Clean up temp file
      await fs.unlink(req.file.path);
      
      logger.info(`Content imported: ${importedCount} items by user ${req.user.id}`);
      
      res.status(200).json({
        message: `Successfully imported ${importedCount} content items`,
        importedCount
      });
    } catch (error) {
      // Clean up temp file on error
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error('Error deleting temp file:', unlinkError);
        }
      }
      
      next(error);
    }
  }
};

module.exports = contentController;