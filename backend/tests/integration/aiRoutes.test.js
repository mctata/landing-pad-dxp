const request = require('supertest');
const app = require('../../src/index');
const openaiService = require('../../src/services/openaiService');
const mockResponses = require('../fixtures/openai-responses');

// Mock the OpenAI service
jest.mock('../../src/services/openaiService');

describe('AI API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/ai/generate/content', () => {
    it('should generate content successfully', async () => {
      // Mock the service response
      openaiService.generateContent.mockResolvedValue(mockResponses.contentGeneration.text);
      
      // Test request
      const response = await request(app)
        .post('/api/ai/generate/content')
        .send({
          websiteId: 'website-123',
          pageId: 'page-456',
          elementType: 'text',
          prompt: 'Create content for a landing page',
          tone: 'professional',
          length: 'medium'
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponses.contentGeneration.text);
      expect(openaiService.generateContent).toHaveBeenCalledTimes(1);
    });
    
    it('should return 400 for invalid request data', async () => {
      // Test request without required fields
      const response = await request(app)
        .post('/api/ai/generate/content')
        .send({
          // Missing required fields
          tone: 'professional'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(openaiService.generateContent).not.toHaveBeenCalled();
    });
    
    it('should handle service errors', async () => {
      // Mock the service error
      openaiService.generateContent.mockRejectedValue(new Error('Service error'));
      
      // Test request
      const response = await request(app)
        .post('/api/ai/generate/content')
        .send({
          websiteId: 'website-123',
          pageId: 'page-456',
          elementType: 'text',
          prompt: 'Create content for a landing page'
        });
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });
  
  describe('POST /api/ai/suggestions/:websiteId/:pageId', () => {
    it('should generate suggestions successfully', async () => {
      // Mock the service response
      openaiService.generateSuggestions.mockResolvedValue(mockResponses.suggestions.text);
      
      // Test request
      const response = await request(app)
        .post('/api/ai/suggestions/website-123/page-456')
        .send({
          type: 'text',
          prompt: 'I need headline ideas for a tech startup'
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponses.suggestions.text);
      expect(openaiService.generateSuggestions).toHaveBeenCalledTimes(1);
      expect(openaiService.generateSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          websiteId: 'website-123',
          pageId: 'page-456'
        })
      );
    });
    
    it('should validate suggestion type', async () => {
      // Test request with invalid type
      const response = await request(app)
        .post('/api/ai/suggestions/website-123/page-456')
        .send({
          type: 'invalid-type',
          prompt: 'I need headline ideas'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(openaiService.generateSuggestions).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/ai/modify/content', () => {
    it('should modify content successfully', async () => {
      // Mock the service response
      openaiService.modifyContent.mockResolvedValue(mockResponses.contentModification.rewrite);
      
      // Test request
      const response = await request(app)
        .post('/api/ai/modify/content')
        .send({
          content: 'Original content here',
          action: 'rewrite'
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponses.contentModification.rewrite);
      expect(openaiService.modifyContent).toHaveBeenCalledTimes(1);
    });
    
    it('should validate action type', async () => {
      // Test request with invalid action
      const response = await request(app)
        .post('/api/ai/modify/content')
        .send({
          content: 'Original content here',
          action: 'invalid-action'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(openaiService.modifyContent).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/ai/generate/layout', () => {
    it('should generate layout successfully', async () => {
      // Mock the service response
      openaiService.generateLayout.mockResolvedValue(mockResponses.layoutGeneration);
      
      // Test request
      const response = await request(app)
        .post('/api/ai/generate/layout')
        .send({
          websiteId: 'website-123',
          pageId: 'page-456',
          prompt: 'Create a layout for a SaaS landing page',
          pageType: 'landing'
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponses.layoutGeneration);
      expect(openaiService.generateLayout).toHaveBeenCalledTimes(1);
    });
    
    it('should return 400 for invalid request data', async () => {
      // Test request without required fields
      const response = await request(app)
        .post('/api/ai/generate/layout')
        .send({
          // Missing websiteId and pageId
          prompt: 'Create a layout',
          pageType: 'landing'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(openaiService.generateLayout).not.toHaveBeenCalled();
    });
    
    it('should handle service errors', async () => {
      // Mock the service error
      openaiService.generateLayout.mockRejectedValue(new Error('Service error'));
      
      // Test request
      const response = await request(app)
        .post('/api/ai/generate/layout')
        .send({
          websiteId: 'website-123',
          pageId: 'page-456',
          prompt: 'Create a layout',
          pageType: 'landing'
        });
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });
  
  describe('POST /api/ai/generate/style', () => {
    it('should generate style successfully', async () => {
      // Mock the service response
      openaiService.generateStyle.mockResolvedValue(mockResponses.styleGeneration);
      
      // Test request
      const response = await request(app)
        .post('/api/ai/generate/style')
        .send({
          websiteId: 'website-123',
          prompt: 'Create a modern and professional style'
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponses.styleGeneration);
      expect(openaiService.generateStyle).toHaveBeenCalledTimes(1);
    });
    
    it('should return 400 for invalid request data', async () => {
      // Test request without required fields
      const response = await request(app)
        .post('/api/ai/generate/style')
        .send({
          // Missing websiteId
          prompt: 'Create a modern style'
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(openaiService.generateStyle).not.toHaveBeenCalled();
    });
    
    it('should handle existing colors and fonts', async () => {
      // Mock the service response
      openaiService.generateStyle.mockResolvedValue(mockResponses.styleGeneration);
      
      // Test request with existing colors and fonts
      const response = await request(app)
        .post('/api/ai/generate/style')
        .send({
          websiteId: 'website-123',
          prompt: 'Refine our current style',
          existingColors: {
            primary: '#3366ff',
            secondary: '#ff6633'
          },
          existingFonts: {
            headingFont: 'Roboto',
            bodyFont: 'Open Sans'
          }
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(openaiService.generateStyle).toHaveBeenCalledWith(
        expect.objectContaining({
          existingColors: expect.any(Object),
          existingFonts: expect.any(Object)
        })
      );
    });
  });
});
