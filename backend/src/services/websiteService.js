const logger = require('../utils/logger');
const { Website } = require('../models');
const { Op } = require('sequelize');

/**
 * Service for managing websites
 */
const websiteService = {
  /**
   * Get a website by ID
   * @param {string} websiteId - Website ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Website or null if not found
   */
  async getWebsiteById(websiteId, userId) {
    try {
      const website = await Website.findOne({
        where: {
          id: websiteId,
          userId: userId
        }
      });
      
      return website;
    } catch (error) {
      logger.error('Error fetching website by ID:', error);
      throw error;
    }
  },
  
  /**
   * Update a website
   * @param {string} websiteId - Website ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object|null>} - Updated website or null if not found
   */
  async updateWebsite(websiteId, updates) {
    try {
      const website = await Website.findByPk(websiteId);
      
      if (!website) {
        return null;
      }
      
      // Apply updates
      Object.keys(updates).forEach(key => {
        website[key] = updates[key];
      });
      
      await website.save();
      logger.info(`Website updated: ${websiteId}`);
      
      return website;
    } catch (error) {
      logger.error('Error updating website:', error);
      throw error;
    }
  },
  
  /**
   * Get websites for a user
   * @param {string} userId - User ID
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Object>} - Websites with pagination
   */
  async getWebsitesByUserId(userId, options = {}) {
    try {
      const { limit = 10, page = 1, status } = options;
      const offset = (page - 1) * limit;
      
      // Build query conditions
      const whereClause = {
        userId: userId
      };
      
      if (status) {
        whereClause.status = status;
      }
      
      // Execute query with pagination
      const { count, rows } = await Website.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [['updatedAt', 'DESC']]
      });
      
      // Calculate pagination info
      const totalItems = count;
      const totalPages = Math.ceil(totalItems / limit);
      
      return {
        items: rows,
        pagination: {
          totalItems,
          itemsPerPage: limit,
          currentPage: page,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error fetching websites by user ID:', error);
      throw error;
    }
  },
  
  /**
   * Create a new website
   * @param {Object} data - Website data
   * @returns {Promise<Object>} - Created website
   */
  async createWebsite(data) {
    try {
      // Set default settings if not provided
      if (!data.settings) {
        data.settings = {
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
        };
      }
      
      // Create the website
      const website = await Website.create({
        userId: data.userId,
        name: data.name,
        description: data.description || '',
        status: 'draft',
        settings: data.settings
      });
      
      logger.info(`Website created: ${website.id} for user ${website.userId}`);
      
      return website;
    } catch (error) {
      logger.error('Error creating website:', error);
      throw error;
    }
  },
  
  /**
   * Delete a website
   * @param {string} websiteId - Website ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  async deleteWebsite(websiteId, userId) {
    try {
      const deletedRows = await Website.destroy({
        where: {
          id: websiteId,
          userId: userId
        }
      });
      
      const success = deletedRows > 0;
      
      if (success) {
        logger.info(`Website deleted: ${websiteId}`);
      }
      
      return success;
    } catch (error) {
      logger.error('Error deleting website:', error);
      throw error;
    }
  }
};

module.exports = websiteService;