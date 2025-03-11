const websiteService = require('../../src/services/websiteService');
const logger = require('../../src/utils/logger');

// Mock the logger
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
    
    // Preserve the demo website but reset any other websites
    // This is more complicated due to the demo website in the initial array
    const websitesArray = websiteService.getWebsiteById.__self?.websites || [];
    const demoWebsite = websitesArray.find(w => w.id === 'demo-website');
    websitesArray.length = 0;
    if (demoWebsite) {
      websitesArray.push(demoWebsite);
    }
  });
  
  describe('getWebsiteById', () => {
    it('should return a website by ID for correct user', async () => {
      const website = await websiteService.getWebsiteById('demo-website', 'user-1');
      
      expect(website).toBeDefined();
      expect(website.id).toBe('demo-website');
      expect(website.name).toBe('Demo Website');
    });
    
    it('should return null if website not found', async () => {
      const website = await websiteService.getWebsiteById('non-existent-id', 'user-1');
      
      expect(website).toBeNull();
    });
    
    it('should return null if website belongs to different user', async () => {
      const website = await websiteService.getWebsiteById('demo-website', 'different-user');
      
      expect(website).toBeNull();
    });
  });
  
  describe('updateWebsite', () => {
    it('should update a website', async () => {
      const updates = {
        name: 'Updated Demo Website',
        description: 'Updated description',
        settings: {
          colors: {
            primary: '#FF0000'
          }
        }
      };
      
      const updatedWebsite = await websiteService.updateWebsite('demo-website', updates);
      
      expect(updatedWebsite.name).toBe('Updated Demo Website');
      expect(updatedWebsite.description).toBe('Updated description');
      expect(updatedWebsite.settings.colors.primary).toBe('#FF0000');
      expect(updatedWebsite.settings.colors.secondary).toBe('#1E293B'); // Unchanged values preserved
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Website updated'));
    });
    
    it('should update the updatedAt timestamp', async () => {
      const originalWebsite = await websiteService.getWebsiteById('demo-website', 'user-1');
      const originalTimestamp = originalWebsite.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updates = { name: 'Updated Name' };
      const updatedWebsite = await websiteService.updateWebsite('demo-website', updates);
      
      expect(updatedWebsite.updatedAt).not.toBe(originalTimestamp);
    });
    
    it('should return null if website not found', async () => {
      const updates = { name: 'Updated Name' };
      
      const result = await websiteService.updateWebsite('non-existent-id', updates);
      
      expect(result).toBeNull();
      expect(logger.info).not.toHaveBeenCalled();
    });
    
    it('should deeply merge settings objects', async () => {
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
      
      const updatedWebsite = await websiteService.updateWebsite('demo-website', updates);
      
      expect(updatedWebsite.settings.colors.primary).toBe('#FF0000');
      expect(updatedWebsite.settings.colors.secondary).toBe('#1E293B'); // Unchanged
      expect(updatedWebsite.settings.fonts.heading).toBe('Inter'); // Unchanged
      expect(updatedWebsite.settings.fonts.body).toBe('Inter'); // Unchanged
      expect(updatedWebsite.settings.globalStyles.borderRadius).toBe('1rem'); // Updated
      expect(updatedWebsite.settings.globalStyles.buttonStyle).toBe('rounded'); // Unchanged
    });
  });
  
  describe('getWebsitesByUserId', () => {
    beforeEach(async () => {
      // Create test websites
      await websiteService.createWebsite({
        id: 'website-1',
        userId: 'user-123',
        name: 'Website 1',
        description: 'Description 1',
        status: 'draft',
        updatedAt: new Date('2023-01-01').toISOString()
      });
      
      await websiteService.createWebsite({
        id: 'website-2',
        userId: 'user-123',
        name: 'Website 2',
        description: 'Description 2',
        status: 'published',
        updatedAt: new Date('2023-01-03').toISOString()
      });
      
      await websiteService.createWebsite({
        id: 'website-3',
        userId: 'user-123',
        name: 'Website 3',
        description: 'Description 3',
        status: 'draft',
        updatedAt: new Date('2023-01-02').toISOString()
      });
      
      // Website for different user
      await websiteService.createWebsite({
        id: 'website-4',
        userId: 'user-456',
        name: 'Website 4',
        description: 'Description 4'
      });
    });
    
    it('should get websites for a user with default pagination', async () => {
      const result = await websiteService.getWebsitesByUserId('user-123');
      
      expect(result.items.length).toBe(3);
      expect(result.items[0].id).toBe('website-2'); // Most recent first
      expect(result.items[1].id).toBe('website-3');
      expect(result.items[2].id).toBe('website-1');
      
      expect(result.pagination).toEqual({
        totalItems: 3,
        itemsPerPage: 10,
        currentPage: 1,
        totalPages: 1
      });
    });
    
    it('should respect pagination options', async () => {
      const result = await websiteService.getWebsitesByUserId('user-123', { limit: 2, page: 1 });
      
      expect(result.items.length).toBe(2);
      expect(result.items[0].id).toBe('website-2'); // Most recent first
      expect(result.items[1].id).toBe('website-3');
      
      expect(result.pagination).toEqual({
        totalItems: 3,
        itemsPerPage: 2,
        currentPage: 1,
        totalPages: 2
      });
      
      // Test second page
      const secondPage = await websiteService.getWebsitesByUserId('user-123', { limit: 2, page: 2 });
      
      expect(secondPage.items.length).toBe(1);
      expect(secondPage.items[0].id).toBe('website-1');
      
      expect(secondPage.pagination).toEqual({
        totalItems: 3,
        itemsPerPage: 2,
        currentPage: 2,
        totalPages: 2
      });
    });
    
    it('should filter websites by status', async () => {
      const result = await websiteService.getWebsitesByUserId('user-123', { status: 'draft' });
      
      expect(result.items.length).toBe(2);
      expect(result.items[0].id).toBe('website-3'); // Most recent draft first
      expect(result.items[1].id).toBe('website-1');
    });
    
    it('should return empty array if no websites found', async () => {
      const result = await websiteService.getWebsitesByUserId('non-existent-user');
      
      expect(result.items.length).toBe(0);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });
  
  describe('createWebsite', () => {
    it('should create a website with required fields', async () => {
      const data = {
        userId: 'user-123',
        name: 'New Website'
      };
      
      const website = await websiteService.createWebsite(data);
      
      expect(website).toMatchObject({
        userId: 'user-123',
        name: 'New Website',
        description: '',
        status: 'draft',
        lastPublishedAt: null
      });
      expect(website.id).toBeDefined();
      expect(website.createdAt).toBeDefined();
      expect(website.updatedAt).toBeDefined();
      expect(website.settings).toBeDefined();
      expect(website.settings.colors).toBeDefined();
      expect(website.settings.fonts).toBeDefined();
      expect(website.settings.globalStyles).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Website created'));
    });
    
    it('should use provided ID if specified', async () => {
      const data = {
        id: 'custom-id-123',
        userId: 'user-123',
        name: 'Custom ID Website'
      };
      
      const website = await websiteService.createWebsite(data);
      
      expect(website.id).toBe('custom-id-123');
    });
    
    it('should use provided settings if specified', async () => {
      const data = {
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
      
      const website = await websiteService.createWebsite(data);
      
      expect(website.settings.colors.primary).toBe('#FF0000');
      expect(website.settings.colors.secondary).toBe('#00FF00');
      expect(website.settings.fonts.heading).toBe('Roboto');
      expect(website.settings.fonts.body).toBe('Arial');
      expect(website.settings.globalStyles.borderRadius).toBe('0');
      expect(website.settings.globalStyles.buttonStyle).toBe('square');
    });
  });
  
  describe('deleteWebsite', () => {
    beforeEach(async () => {
      await websiteService.createWebsite({
        id: 'website-to-delete',
        userId: 'user-123',
        name: 'Website To Delete'
      });
    });
    
    it('should delete a website by ID for correct user', async () => {
      const result = await websiteService.deleteWebsite('website-to-delete', 'user-123');
      
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Website deleted'));
      
      // Verify website is removed
      const website = await websiteService.getWebsiteById('website-to-delete', 'user-123');
      expect(website).toBeNull();
    });
    
    it('should return false if website not found', async () => {
      const result = await websiteService.deleteWebsite('non-existent-id', 'user-123');
      
      expect(result).toBe(false);
      expect(logger.info).not.toHaveBeenCalled();
    });
    
    it('should return false if website belongs to different user', async () => {
      const result = await websiteService.deleteWebsite('website-to-delete', 'different-user');
      
      expect(result).toBe(false);
      expect(logger.info).not.toHaveBeenCalled();
      
      // Verify website still exists
      const website = await websiteService.getWebsiteById('website-to-delete', 'user-123');
      expect(website).toBeDefined();
    });
  });
});