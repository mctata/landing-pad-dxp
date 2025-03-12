// Mocking modules before requiring the controller
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

jest.mock('../../../src/services/openaiService', () => ({
  generateContent: jest.fn(),
  generateLayout: jest.fn(),
  generateStyle: jest.fn(),
  modifyContent: jest.fn(),
  generateSuggestions: jest.fn(),
  generateColorScheme: jest.fn(),
  generateFontPairings: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Import controller and dependencies after mocking
const { validationResult } = require('express-validator');
const openaiService = require('../../../src/services/openaiService');
const aiController = require('../../../src/controllers/aiController');
const logger = require('../../../src/utils/logger');

describe('AI Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request and response
    req = {
      body: {},
      params: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock validationResult to return no errors by default
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
  });

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      // Setup request body
      req.body = {
        websiteId: 'website-123',
        pageId: 'page-456',
        elementType: 'hero',
        prompt: 'Create a hero section for a tech company',
        tone: 'professional',
        length: 'medium'
      };

      // Mock service response
      const mockContent = {
        headline: 'Innovative Solutions for Tomorrow\'s Challenges',
        subheadline: 'We leverage cutting-edge technology to solve complex business problems.',
        ctaText: 'Start Your Journey'
      };
      openaiService.generateContent.mockResolvedValue(mockContent);

      // Call the controller method
      await aiController.generateContent(req, res);

      // Assertions
      expect(openaiService.generateContent).toHaveBeenCalledWith({
        elementType: 'hero',
        prompt: 'Create a hero section for a tech company',
        tone: 'professional',
        length: 'medium'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockContent);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Generating hero content')
      );
    });

    it('should return 400 if validation fails', async () => {
      // Setup validation errors
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Element type is required' }])
      });

      // Call the controller method
      await aiController.generateContent(req, res);

      // Assertions
      expect(openaiService.generateContent).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        errors: [{ msg: 'Element type is required' }]
      });
    });

    it('should return 500 if service throws an error', async () => {
      // Setup request body
      req.body = {
        websiteId: 'website-123',
        pageId: 'page-456',
        elementType: 'hero',
        prompt: 'Create a hero section'
      };

      // Mock service error
      const error = new Error('API rate limit exceeded');
      openaiService.generateContent.mockRejectedValue(error);

      // Call the controller method
      await aiController.generateContent(req, res);

      // Assertions
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in generateContent:'),
        error.message
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error generating content',
        error: error.message
      });
    });
  });

  describe('generateLayout', () => {
    it('should generate layout successfully', async () => {
      // Setup request body
      req.body = {
        websiteId: 'website-123',
        pageId: 'page-456',
        prompt: 'Create a layout for a SaaS landing page',
        pageType: 'landing'
      };

      // Mock service response
      const mockLayout = {
        structure: {
          type: 'landing',
          sections: ['header', 'hero', 'features', 'pricing', 'testimonials', 'cta', 'footer'],
          layout: 'single-column',
          spacing: 'comfortable'
        },
        elements: [
          {
            id: 'element-1',
            type: 'header',
            position: 'top',
            settings: { transparent: true }
          },
          {
            id: 'element-2',
            type: 'hero',
            position: 'after-header',
            settings: { fullScreen: true }
          }
        ]
      };
      openaiService.generateLayout.mockResolvedValue(mockLayout);

      // Call the controller method
      await aiController.generateLayout(req, res);

      // Assertions
      expect(openaiService.generateLayout).toHaveBeenCalledWith({
        websiteId: 'website-123',
        pageId: 'page-456',
        prompt: 'Create a layout for a SaaS landing page',
        pageType: 'landing'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockLayout);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Generating layout')
      );
    });

    it('should use default pageType if not provided', async () => {
      // Setup request body without pageType
      req.body = {
        websiteId: 'website-123',
        pageId: 'page-456',
        prompt: 'Create a layout for a SaaS landing page'
      };

      // Mock service response
      const mockLayout = {
        structure: {
          type: 'landing',
          sections: ['header', 'hero', 'features', 'footer'],
          layout: 'single-column',
          spacing: 'comfortable'
        },
        elements: []
      };
      openaiService.generateLayout.mockResolvedValue(mockLayout);

      // Call the controller method
      await aiController.generateLayout(req, res);

      // Assertions
      expect(openaiService.generateLayout).toHaveBeenCalledWith({
        websiteId: 'website-123',
        pageId: 'page-456',
        prompt: 'Create a layout for a SaaS landing page',
        pageType: undefined
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('pageType: landing')
      );
    });
  });

  describe('generateStyle', () => {
    it('should generate style successfully', async () => {
      // Setup request body
      req.body = {
        websiteId: 'website-123',
        prompt: 'Create a modern tech style',
        existingColors: {
          primary: '#3498db'
        },
        existingFonts: {
          headingFont: 'Montserrat'
        }
      };

      // Mock service response
      const mockStyle = {
        colors: {
          primary: '#3498db',
          secondary: '#2ecc71',
          accent: '#e74c3c',
          background: '#ffffff',
          text: '#333333',
          headings: '#2c3e50',
          lightBackground: '#f5f5f5',
          borders: '#dddddd'
        },
        typography: {
          headingFont: 'Montserrat',
          bodyFont: 'Open Sans',
          baseSize: 16,
          scaleRatio: 1.2,
          lineHeight: 1.5
        },
        spacing: {
          base: 8,
          scale: 2
        }
      };
      openaiService.generateStyle.mockResolvedValue(mockStyle);

      // Call the controller method
      await aiController.generateStyle(req, res);

      // Assertions
      expect(openaiService.generateStyle).toHaveBeenCalledWith({
        websiteId: 'website-123',
        prompt: 'Create a modern tech style',
        existingColors: {
          primary: '#3498db'
        },
        existingFonts: {
          headingFont: 'Montserrat'
        }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStyle);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Generating style')
      );
    });
  });

  describe('modifyContent', () => {
    it('should modify content successfully', async () => {
      // Setup request body
      req.body = {
        content: 'This is original content that needs to be improved.',
        action: 'rewrite',
        parameters: {
          tone: 'casual'
        }
      };

      // Mock service response
      const mockModifiedContent = {
        content: 'Here\'s a rewritten, more casual version of your content!'
      };
      openaiService.modifyContent.mockResolvedValue(mockModifiedContent);

      // Call the controller method
      await aiController.modifyContent(req, res);

      // Assertions
      expect(openaiService.modifyContent).toHaveBeenCalledWith({
        content: 'This is original content that needs to be improved.',
        action: 'rewrite',
        parameters: {
          tone: 'casual'
        }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockModifiedContent);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Modifying content with action: rewrite')
      );
    });
  });

  describe('getSuggestions', () => {
    it('should get suggestions successfully', async () => {
      // Setup request params and body
      req.params = {
        websiteId: 'website-123',
        pageId: 'page-456'
      };
      req.body = {
        type: 'text',
        prompt: 'Suggest headlines for our product'
      };

      // Mock service response
      const mockSuggestions = [
        {
          id: '1',
          type: 'text',
          title: 'Benefit-focused',
          content: {
            heading: 'Transform Your Workflow with Our Solution',
            subheading: 'Save time and increase productivity'
          }
        },
        {
          id: '2',
          type: 'text',
          title: 'Question-based',
          content: {
            heading: 'Ready to Revolutionize Your Business?',
            subheading: 'Discover how our platform makes it possible'
          }
        }
      ];
      openaiService.generateSuggestions.mockResolvedValue(mockSuggestions);

      // Call the controller method
      await aiController.getSuggestions(req, res);

      // Assertions
      expect(openaiService.generateSuggestions).toHaveBeenCalledWith({
        websiteId: 'website-123',
        pageId: 'page-456',
        type: 'text',
        prompt: 'Suggest headlines for our product'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSuggestions);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Getting text suggestions')
      );
    });
  });

  describe('generateColorScheme', () => {
    it('should generate color scheme successfully', async () => {
      // Setup request body
      req.body = {
        industry: 'technology',
        mood: 'professional',
        baseColor: '#3498db'
      };

      // Mock service response
      const mockColorScheme = {
        primary: '#3498db',
        secondary: '#2ecc71',
        accent: '#e74c3c',
        background: '#ffffff',
        text: '#333333',
        headings: '#2c3e50',
        lightBackground: '#f5f5f5',
        borders: '#dddddd'
      };
      openaiService.generateColorScheme.mockResolvedValue(mockColorScheme);

      // Call the controller method
      await aiController.generateColorScheme(req, res);

      // Assertions
      expect(openaiService.generateColorScheme).toHaveBeenCalledWith({
        industry: 'technology',
        mood: 'professional',
        baseColor: '#3498db'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockColorScheme);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Generating color scheme')
      );
    });
  });

  describe('generateFontPairings', () => {
    it('should generate font pairings successfully', async () => {
      // Setup request body
      req.body = {
        style: 'modern',
        industry: 'technology'
      };

      // Mock service response
      const mockFontPairings = [
        {
          heading: 'Montserrat',
          body: 'Open Sans'
        },
        {
          heading: 'Roboto',
          body: 'Source Sans Pro'
        },
        {
          heading: 'Poppins',
          body: 'Lato'
        }
      ];
      openaiService.generateFontPairings.mockResolvedValue(mockFontPairings);

      // Call the controller method
      await aiController.generateFontPairings(req, res);

      // Assertions
      expect(openaiService.generateFontPairings).toHaveBeenCalledWith({
        style: 'modern',
        industry: 'technology'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFontPairings);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Generating font pairings')
      );
    });
  });
});