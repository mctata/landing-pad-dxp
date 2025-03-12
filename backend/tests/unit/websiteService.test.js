const websiteService = require('../../src/services/websiteService');
const { Website } = require('../../src/models');
const logger = require('../../src/utils/logger');

// Mock the models and logger
jest.mock('../../src/models', () => ({
  Website: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    destroy: jest.fn()
  }
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Website Service', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  describe('getWebsiteById', () => {
    it('should return a website by ID for correct user', async () => {
      // Mock data
      const websiteId = 'website-123';
      const userId = 'user-123';
      const mockWebsite = {
        id: websiteId,
        userId,
        name: 'Test Website',
        description: 'A test website',
        status: 'draft'
      };
      
      // Mock findOne response
      Website.findOne.mockResolvedValue(mockWebsite);
      
      // Call the service method
      const result = await websiteService.getWebsiteById(websiteId, userId);
      
      // Assertions
      expect(Website.findOne).toHaveBeenCalledWith({
        where: {
          id: websiteId,
          userId
        }
      });
      
      expect(result).toEqual(mockWebsite);
    });
    
    it('should return null if website not found', async () => {
      // Mock findOne response for not found
      Website.findOne.mockResolvedValue(null);
      
      // Call the service method
      const result = await websiteService.getWebsiteById('non-existent-id', 'user-123');
      
      // Assertions
      expect(result).toBeNull();
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Website.findOne.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(websiteService.getWebsiteById('website-123', 'user-123'))
        .rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error fetching website by ID:', mockError);
    });
  });
  
  describe('updateWebsite', () => {
    it('should update a website', async () => {
      // Mock data
      const websiteId = 'website-123';
      const updates = {
        name: 'Updated Website',
        description: 'Updated description',
        settings: {
          colors: {
            primary: '#FF0000'
          }
        }
      };
      
      // Mock findOne response
      const mockWebsite = {
        id: websiteId,
        userId: 'user-123',
        name: 'Test Website',
        description: 'A test website',
        settings: {
          colors: {
            primary: '#0000FF',
            secondary: '#1E293B'
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
        save: jest.fn().mockResolvedValue(true)
      };
      
      Website.findOne.mockResolvedValue(mockWebsite);
      
      // Call the service method
      const result = await websiteService.updateWebsite(websiteId, updates);
      
      // Assertions
      expect(Website.findOne).toHaveBeenCalledWith({
        where: { id: websiteId }
      });
      
      // Check that the website object was updated
      expect(mockWebsite.name).toBe('Updated Website');
      expect(mockWebsite.description).toBe('Updated description');
      expect(mockWebsite.settings.colors.primary).toBe('#FF0000');
      expect(mockWebsite.settings.colors.secondary).toBe('#1E293B'); // Should be preserved
      
      expect(mockWebsite.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Website updated'));
    });
    
    it('should return null if website not found', async () => {
      // Mock findOne response for not found
      Website.findOne.mockResolvedValue(null);
      
      // Call the service method
      const result = await websiteService.updateWebsite('non-existent-id', { name: 'Updated Name' });
      
      // Assertions
      expect(result).toBeNull();
      expect(logger.info).not.toHaveBeenCalled();
    });
    
    it('should deeply merge settings objects', async () => {
      // Mock data
      const websiteId = 'website-123';
      const updates = {
        settings: {
          colors: {
            primary: '#FF0000',
            // secondary is not included, should remain unchanged
          },
          // fonts not included, should remain unchanged
          globalStyles: {
            borderRadius: '1rem',
            // buttonStyle not included, should remain unchanged
          }
        }
      };
      
      // Mock findOne response
      const mockWebsite = {
        id: websiteId,
        userId: 'user-123',
        settings: {
          colors: {
            primary: '#0000FF',
            secondary: '#1E293B'
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
        save: jest.fn().mockResolvedValue(true)
      };
      
      Website.findOne.mockResolvedValue(mockWebsite);
      
      // Call the service method
      const result = await websiteService.updateWebsite(websiteId, updates);
      
      // Assertions
      // Check that the settings were properly merged
      expect(mockWebsite.settings.colors.primary).toBe('#FF0000');
      expect(mockWebsite.settings.colors.secondary).toBe('#1E293B'); // Unchanged
      expect(mockWebsite.settings.fonts.heading).toBe('Inter'); // Unchanged
      expect(mockWebsite.settings.fonts.body).toBe('Inter'); // Unchanged
      expect(mockWebsite.settings.globalStyles.borderRadius).toBe('1rem'); // Updated
      expect(mockWebsite.settings.globalStyles.buttonStyle).toBe('rounded'); // Unchanged
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Website.findOne.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(websiteService.updateWebsite('website-123', { name: 'Updated Name' }))
        .rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error updating website:', mockError);
    });
  });
  
  describe('getWebsitesByUserId', () => {
    it('should get websites for a user with default pagination', async () => {
      // Mock data
      const userId = 'user-123';
      const mockWebsites = [
        {
          id: 'website-1',
          userId,
          name: 'Website 1',
          updatedAt: new Date('2023-01-01')
        },
        {
          id: 'website-2',
          userId,
          name: 'Website 2',
          updatedAt: new Date('2023-01-02')
        }
      ];
      
      // Mock findAndCountAll response
      Website.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockWebsites
      });
      
      // Call the service method
      const result = await websiteService.getWebsitesByUserId(userId);
      
      // Assertions
      expect(Website.findAndCountAll).toHaveBeenCalledWith({
        where: { userId },
        limit: 10,
        offset: 0,
        order: [['updatedAt', 'DESC']],
        // No status filter
      });
      
      expect(result).toEqual({
        items: mockWebsites,
        pagination: {
          totalItems: 2,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 1
        }
      });
    });
    
    it('should respect pagination options', async () => {
      // Mock data
      const userId = 'user-123';
      const options = { limit: 2, page: 2 };
      const mockWebsites = [
        {
          id: 'website-3',
          userId,
          name: 'Website 3'
        },
        {
          id: 'website-4',
          userId,
          name: 'Website 4'
        }
      ];
      
      // Mock findAndCountAll response
      Website.findAndCountAll.mockResolvedValue({
        count: 6,
        rows: mockWebsites
      });
      
      // Call the service method
      const result = await websiteService.getWebsitesByUserId(userId, options);
      
      // Assertions
      expect(Website.findAndCountAll).toHaveBeenCalledWith({
        where: { userId },
        limit: 2,
        offset: 2, // Page 2 with limit 2
        order: [['updatedAt', 'DESC']],
        // No status filter
      });
      
      expect(result).toEqual({
        items: mockWebsites,
        pagination: {
          totalItems: 6,
          itemsPerPage: 2,
          currentPage: 2,
          totalPages: 3 // 6 items with 2 per page = 3 pages
        }
      });
    });
    
    it('should filter websites by status', async () => {
      // Mock data
      const userId = 'user-123';
      const options = { status: 'draft' };
      const mockWebsites = [
        {
          id: 'website-1',
          userId,
          name: 'Website 1',
          status: 'draft'
        }
      ];
      
      // Mock findAndCountAll response
      Website.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockWebsites
      });
      
      // Call the service method
      const result = await websiteService.getWebsitesByUserId(userId, options);
      
      // Assertions
      expect(Website.findAndCountAll).toHaveBeenCalledWith({
        where: {
          userId,
          status: 'draft'
        },
        limit: 10,
        offset: 0,
        order: [['updatedAt', 'DESC']]
      });
      
      expect(result.items).toEqual(mockWebsites);
    });
    
    it('should handle empty results', async () => {
      // Mock findAndCountAll response for empty results
      Website.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });
      
      // Call the service method
      const result = await websiteService.getWebsitesByUserId('non-existent-user');
      
      // Assertions
      expect(result).toEqual({
        items: [],
        pagination: {
          totalItems: 0,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 0
        }
      });
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Website.findAndCountAll.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(websiteService.getWebsitesByUserId('user-123'))
        .rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error fetching websites by user ID:', mockError);
    });
  });
  
  describe('createWebsite', () => {
    it('should create a website with required fields', async () => {
      // Mock data
      const websiteData = {
        userId: 'user-123',
        name: 'New Website'
      };
      
      // Mock create response
      const mockWebsite = {
        id: 'website-123',
        userId: 'user-123',
        name: 'New Website',
        description: '',
        status: 'draft',
        lastPublishedAt: null,
        settings: {
          colors: {
            primary: '#3B82F6',
            secondary: '#1E293B'
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
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Website.create.mockResolvedValue(mockWebsite);
      
      // Call the service method
      const result = await websiteService.createWebsite(websiteData);
      
      // Assertions
      expect(Website.create).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'New Website',
        description: '',
        status: 'draft',
        lastPublishedAt: null,
        settings: expect.objectContaining({
          colors: expect.any(Object),
          fonts: expect.any(Object),
          globalStyles: expect.any(Object)
        })
      });
      
      expect(result).toEqual(mockWebsite);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Website created'));
    });
    
    it('should use provided settings if specified', async () => {
      // Mock data
      const websiteData = {
        userId: 'user-123',
        name: 'Custom Settings Website',
        description: 'A website with custom settings',
        settings: {
          colors: {
            primary: '#FF0000',
            secondary: '#00FF00'
          },
          fonts: {
            heading: 'Roboto',
            body: 'Arial'
          },
          globalStyles: {
            borderRadius: '0',
            buttonStyle: 'square'
          }
        }
      };
      
      // Mock create response
      const mockWebsite = {
        id: 'website-123',
        ...websiteData,
        status: 'draft',
        lastPublishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Website.create.mockResolvedValue(mockWebsite);
      
      // Call the service method
      const result = await websiteService.createWebsite(websiteData);
      
      // Assertions
      expect(Website.create).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Custom Settings Website',
        description: 'A website with custom settings',
        status: 'draft',
        lastPublishedAt: null,
        settings: {
          colors: {
            primary: '#FF0000',
            secondary: '#00FF00'
          },
          fonts: {
            heading: 'Roboto',
            body: 'Arial'
          },
          globalStyles: {
            borderRadius: '0',
            buttonStyle: 'square'
          }
        }
      });
      
      expect(result.settings.colors.primary).toBe('#FF0000');
      expect(result.settings.fonts.heading).toBe('Roboto');
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Website.create.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(websiteService.createWebsite({
        userId: 'user-123',
        name: 'New Website'
      })).rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error creating website:', mockError);
    });
  });
  
  describe('deleteWebsite', () => {
    it('should delete a website by ID for correct user', async () => {
      // Mock data
      const websiteId = 'website-123';
      const userId = 'user-123';
      
      // Mock findOne response
      const mockWebsite = {
        id: websiteId,
        userId,
        name: 'Website To Delete'
      };
      
      // Mock destroy response
      Website.findOne.mockResolvedValue(mockWebsite);
      Website.destroy.mockResolvedValue(1); // 1 row affected
      
      // Call the service method
      const result = await websiteService.deleteWebsite(websiteId, userId);
      
      // Assertions
      expect(Website.findOne).toHaveBeenCalledWith({
        where: {
          id: websiteId,
          userId
        }
      });
      
      expect(Website.destroy).toHaveBeenCalledWith({
        where: {
          id: websiteId,
          userId
        }
      });
      
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Website deleted'));
    });
    
    it('should return false if website not found', async () => {
      // Mock findOne response for not found
      Website.findOne.mockResolvedValue(null);
      
      // Call the service method
      const result = await websiteService.deleteWebsite('non-existent-id', 'user-123');
      
      // Assertions
      expect(result).toBe(false);
      expect(Website.destroy).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
    
    it('should handle errors properly', async () => {
      // Mock error
      const mockError = new Error('Database error');
      Website.findOne.mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(websiteService.deleteWebsite('website-123', 'user-123'))
        .rejects.toThrow('Database error');
      
      expect(logger.error).toHaveBeenCalledWith('Error deleting website:', mockError);
    });
  });
});