import { apiHelpers } from '@/lib/api';
import aiService from '@/lib/services/aiService';

// Mock the API helpers
jest.mock('@/lib/api', () => ({
  apiHelpers: {
    post: jest.fn(),
  }
}));

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should call the API with correct parameters', async () => {
      // Mock response
      const mockResponse = {
        data: {
          heading: 'Test Heading',
          subheading: 'Test Subheading',
          body: 'Test body content'
        }
      };
      (apiHelpers.post as jest.Mock).mockResolvedValue(mockResponse);

      // Test parameters
      const params = {
        websiteId: 'website-123',
        pageId: 'page-456',
        elementType: 'text',
        prompt: 'Create content for testing',
        tone: 'professional',
        length: 'medium'
      };

      // Call the service
      const result = await aiService.generateContent(params);

      // Assertions
      expect(apiHelpers.post).toHaveBeenCalledWith('/ai/generate/content', params);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors appropriately', async () => {
      // Mock error
      const mockError = new Error('API Error');
      (apiHelpers.post as jest.Mock).mockRejectedValue(mockError);

      // Test parameters
      const params = {
        websiteId: 'website-123',
        pageId: 'page-456',
        elementType: 'text',
        prompt: 'Create content',
        tone: 'professional',
        length: 'medium'
      };

      // Call the service and expect error
      await expect(aiService.generateContent(params)).rejects.toThrow('API Error');
      expect(apiHelpers.post).toHaveBeenCalledWith('/ai/generate/content', params);
    });
  });

  describe('getSuggestions', () => {
    it('should call the API with correct parameters', async () => {
      // Mock response
      const mockResponse = {
        data: [
          {
            id: '1',
            type: 'text',
            title: 'Suggestion 1',
            content: { heading: 'Test 1', subheading: 'Subhead 1' }
          }
        ]
      };
      (apiHelpers.post as jest.Mock).mockResolvedValue(mockResponse);

      // Call the service
      const result = await aiService.getSuggestions('website-123', 'page-456', 'text', 'Give me suggestions');

      // Assertions
      expect(apiHelpers.post).toHaveBeenCalledWith(
        '/ai/suggestions/website-123/page-456',
        { type: 'text', prompt: 'Give me suggestions' }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('modifyContent', () => {
    it('should call the API with correct parameters', async () => {
      // Mock response
      const mockResponse = {
        data: {
          content: 'Modified content here'
        }
      };
      (apiHelpers.post as jest.Mock).mockResolvedValue(mockResponse);

      // Call the service
      const result = await aiService.modifyContent({
        content: 'Original content',
        action: 'rewrite',
        parameters: { style: 'casual' }
      });

      // Assertions
      expect(apiHelpers.post).toHaveBeenCalledWith('/ai/modify/content', {
        content: 'Original content',
        action: 'rewrite',
        parameters: { style: 'casual' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
