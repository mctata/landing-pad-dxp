const OpenAI = require('openai');
const openaiService = require('../../src/services/openaiService');
const mockResponses = require('../fixtures/openai-responses');
const { APIError } = require('../../src/middleware/errorHandler');

// Mock the OpenAI module
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
  });
});

describe('OpenAI Service', () => {
  let mockOpenAI;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup the mock instance
    mockOpenAI = new OpenAI();
    mockOpenAI.chat.completions.create.mockReset();
  });
  
  describe('generateContent', () => {
    it('should generate text content successfully', async () => {
      // Mock the OpenAI response
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponses.contentGeneration.text)
            }
          }
        ]
      });
      
      // Test parameters
      const params = {
        websiteId: 'website-123',
        pageId: 'page-456',
        elementType: 'text',
        prompt: 'Create content for a landing page',
        tone: 'professional',
        length: 'medium'
      };
      
      // Call the service
      const result = await openaiService.generateContent(params);
      
      // Verify result
      expect(result).toEqual(mockResponses.contentGeneration.text);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('professional')
            }),
            expect.objectContaining({
              role: 'user',
              content: params.prompt
            })
          ]),
          response_format: { type: 'json_object' }
        })
      );
    });
    
    it('should handle rate limit errors', async () => {
      // Mock a rate limit error
      const rateLimitError = {
        status: 429,
        message: 'Rate limit exceeded'
      };
      mockOpenAI.chat.completions.create.mockRejectedValue(rateLimitError);
      
      // Test parameters
      const params = {
        websiteId: 'website-123',
        pageId: 'page-456',
        elementType: 'text',
        prompt: 'Create content for a landing page'
      };
      
      // Call the service and expect an error
      await expect(openaiService.generateContent(params))
        .rejects
        .toThrow(APIError);
        
      await expect(openaiService.generateContent(params))
        .rejects
        .toThrow('AI service rate limit exceeded');
    });
  });
  
  describe('generateSuggestions', () => {
    it('should generate suggestions successfully', async () => {
      // Mock the OpenAI response
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestions: mockResponses.suggestions.text
              })
            }
          }
        ]
      });
      
      // Test parameters
      const params = {
        websiteId: 'website-123',
        pageId: 'page-456',
        type: 'text',
        prompt: 'I need headline ideas for a tech startup'
      };
      
      // Call the service
      const result = await openaiService.generateSuggestions(params);
      
      // Verify result
      expect(result).toEqual(mockResponses.suggestions.text);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('modifyContent', () => {
    it('should modify content successfully', async () => {
      // Mock the OpenAI response
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponses.contentModification.rewrite)
            }
          }
        ]
      });
      
      // Test parameters
      const params = {
        content: 'Original content here',
        action: 'rewrite'
      };
      
      // Call the service
      const result = await openaiService.modifyContent(params);
      
      // Verify result
      expect(result).toEqual(mockResponses.contentModification.rewrite);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });
    
    it('should support different modification actions', async () => {
      // Mock the OpenAI response
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponses.contentModification.shorten)
            }
          }
        ]
      });
      
      // Test parameters
      const params = {
        content: 'This is a long piece of content that needs to be shortened.',
        action: 'shorten'
      };
      
      // Call the service
      const result = await openaiService.modifyContent(params);
      
      // Verify result
      expect(result).toEqual(mockResponses.contentModification.shorten);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Shorten')
            })
          ])
        })
      );
    });
  });
});
