import { apiHelpers } from '@/lib/api';

interface AIGenerateContentParams {
  websiteId: string;
  pageId: string;
  elementType: string;
  prompt: string;
  tone?: string;
  length?: string;
}

interface AIGenerateLayoutParams {
  websiteId: string;
  pageId: string;
  prompt: string;
  pageType?: string;
}

interface AIGenerateStyleParams {
  websiteId: string;
  prompt: string;
}

interface AIModifyContentParams {
  content: string;
  action: string;
  parameters?: Record<string, any>;
}

export const aiService = {
  /**
   * Generate content for a specific element
   */
  generateContent: async (params: AIGenerateContentParams) => {
    try {
      const response = await apiHelpers.post('/ai/generate/content', params);
      return response.data;
    } catch (error) {
      console.error('Error generating AI content:', error);
      throw error;
    }
  },

  /**
   * Generate layout suggestions
   */
  generateLayout: async (params: AIGenerateLayoutParams) => {
    try {
      const response = await apiHelpers.post('/ai/generate/layout', params);
      return response.data;
    } catch (error) {
      console.error('Error generating AI layout:', error);
      throw error;
    }
  },

  /**
   * Generate style suggestions (colors, typography, etc.)
   */
  generateStyle: async (params: AIGenerateStyleParams) => {
    try {
      const response = await apiHelpers.post('/ai/generate/style', params);
      return response.data;
    } catch (error) {
      console.error('Error generating AI style:', error);
      throw error;
    }
  },

  /**
   * Modify existing content with AI (rewrite, expand, shorten, etc.)
   */
  modifyContent: async (params: AIModifyContentParams) => {
    try {
      const response = await apiHelpers.post('/ai/modify/content', params);
      return response.data;
    } catch (error) {
      console.error('Error modifying content with AI:', error);
      throw error;
    }
  },

  /**
   * Generate AI suggestions based on website data and user prompt
   */
  getSuggestions: async (websiteId: string, pageId: string, type: string, prompt: string) => {
    try {
      const response = await apiHelpers.post(`/ai/suggestions/${websiteId}/${pageId}`, { 
        type,
        prompt 
      });
      return response.data;
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      throw error;
    }
  }
};

export default aiService;
