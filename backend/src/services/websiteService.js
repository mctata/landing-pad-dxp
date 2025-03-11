const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// In a real app, this would be replaced with database models
// For now, we'll use an in-memory store
const websites = [
  {
    id: 'demo-website',
    userId: 'user-1',
    name: 'Demo Website',
    description: 'A demo website for testing',
    createdAt: '2023-09-15T12:00:00Z',
    updatedAt: '2023-09-15T12:00:00Z',
    lastPublishedAt: null,
    status: 'draft',
    settings: {
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
    }
  }
];

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
    const website = websites.find(w => w.id === websiteId);
    
    // Check if website exists and belongs to the user
    if (!website || website.userId !== userId) {
      return null;
    }
    
    return website;
  },
  
  /**
   * Update a website
   * @param {string} websiteId - Website ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object|null>} - Updated website or null if not found
   */
  async updateWebsite(websiteId, updates) {
    const index = websites.findIndex(w => w.id === websiteId);
    if (index === -1) {
      return null;
    }
    
    // Apply updates
    websites[index] = {
      ...websites[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    logger.info(`Website updated: ${websiteId}`);
    
    return websites[index];
  },
  
  /**
   * Get websites for a user
   * @param {string} userId - User ID
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Object>} - Websites with pagination
   */
  async getWebsitesByUserId(userId, options = {}) {
    const { limit = 10, page = 1, status } = options;
    const skip = (page - 1) * limit;
    
    // Filter by userId and optionally by status
    let filteredWebsites = websites.filter(w => w.userId === userId);
    
    if (status) {
      filteredWebsites = filteredWebsites.filter(w => w.status === status);
    }
    
    // Sort by updatedAt descending
    filteredWebsites.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    const totalItems = filteredWebsites.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    const items = filteredWebsites.slice(skip, skip + limit);
    
    return {
      items,
      pagination: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages
      }
    };
  },
  
  /**
   * Create a new website
   * @param {Object} data - Website data
   * @returns {Promise<Object>} - Created website
   */
  async createWebsite(data) {
    const website = {
      id: data.id || uuidv4(),
      userId: data.userId,
      name: data.name,
      description: data.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastPublishedAt: null,
      status: 'draft',
      settings: data.settings || {
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
      }
    };
    
    websites.push(website);
    logger.info(`Website created: ${website.id} for user ${website.userId}`);
    
    return website;
  },
  
  /**
   * Delete a website
   * @param {string} websiteId - Website ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  async deleteWebsite(websiteId, userId) {
    const index = websites.findIndex(w => w.id === websiteId && w.userId === userId);
    if (index === -1) {
      return false;
    }
    
    websites.splice(index, 1);
    logger.info(`Website deleted: ${websiteId}`);
    
    return true;
  }
};

module.exports = websiteService;