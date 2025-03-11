import { apiHelpers, aiAPI } from '@/lib/api';

// Common types for AI response objects
export interface AIColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  headings: string;
  lightBackground?: string;
  borders?: string;
}

export interface AITypography {
  headingFont: string;
  bodyFont: string;
  baseSize: number;
  scaleRatio: number;
  lineHeight: number;
}

export interface AISpacing {
  base: number;
  scale: number;
}

export interface AILayoutElement {
  id: string;
  type: string;
  position: string;
  settings: Record<string, any>;
}

export interface AILayoutStructure {
  type: string;
  sections: string[];
  layout: string;
  spacing: string;
}

// Request parameter interfaces
export interface AIGenerateContentParams {
  websiteId: string;
  pageId: string;
  elementType: string;
  prompt: string;
  tone?: string;
  length?: string;
}

export interface AIGenerateLayoutParams {
  websiteId: string;
  pageId: string;
  prompt: string;
  pageType?: 'landing' | 'about' | 'services' | 'blog' | string;
}

export interface AIGenerateStyleParams {
  websiteId: string;
  prompt: string;
  existingColors?: Partial<AIColors>;
  existingFonts?: Partial<AITypography>;
}

export interface AIModifyContentParams {
  content: string;
  action: 'rewrite' | 'expand' | 'shorten' | 'changeStyle' | 'proofread' | string;
  parameters?: Record<string, any>;
}

export interface AIGetSuggestionsParams {
  websiteId: string;
  pageId: string;
  type: 'text' | 'layout' | 'style';
  prompt: string;
}

// Response interfaces
export interface AIContentResponse {
  // Fields vary depending on elementType
  [key: string]: any;
}

export interface AILayoutResponse {
  structure: AILayoutStructure;
  elements: AILayoutElement[];
}

export interface AIStyleResponse {
  colors: AIColors;
  typography: AITypography;
  spacing: AISpacing;
  shadows?: Record<string, string>;
}

export interface AIModifyContentResponse {
  content: string;
}

export interface AISuggestion {
  id: string;
  type: 'text' | 'layout' | 'style';
  title: string;
  content: any;
}

/**
 * AI Service for interacting with the AI API endpoints
 */
export const aiService = {
  /**
   * Generate content for a specific element
   * @param params Content generation parameters
   * @returns Generated content appropriate for the element type
   */
  generateContent: async (params: AIGenerateContentParams): Promise<AIContentResponse> => {
    try {
      const response = await aiAPI.generateEnhancedContent(params);
      return response.data;
    } catch (error) {
      console.error('Error generating AI content:', error);
      throw error;
    }
  },

  /**
   * Generate layout structure based on website data and prompt
   * @param params Layout generation parameters
   * @returns Generated layout structure and elements
   */
  generateLayout: async (params: AIGenerateLayoutParams): Promise<AILayoutResponse> => {
    try {
      const response = await aiAPI.generateLayout(params);
      return response.data;
    } catch (error) {
      console.error('Error generating AI layout:', error);
      throw error;
    }
  },

  /**
   * Generate style recommendations including colors and typography
   * @param params Style generation parameters 
   * @returns Generated style recommendations
   */
  generateStyle: async (params: AIGenerateStyleParams): Promise<AIStyleResponse> => {
    try {
      const response = await aiAPI.generateStyle(params);
      return response.data;
    } catch (error) {
      console.error('Error generating AI style:', error);
      throw error;
    }
  },

  /**
   * Modify existing content with AI (rewrite, expand, shorten, etc.)
   * @param params Content modification parameters
   * @returns Modified content
   */
  modifyContent: async (params: AIModifyContentParams): Promise<AIModifyContentResponse> => {
    try {
      const response = await aiAPI.modifyContent(params);
      return response.data;
    } catch (error) {
      console.error('Error modifying content with AI:', error);
      throw error;
    }
  },

  /**
   * Generate AI suggestions based on website data and user prompt
   * @param websiteId The website ID
   * @param pageId The page ID
   * @param type Type of suggestion to generate
   * @param prompt User prompt for generating suggestions
   * @returns Array of generated suggestions
   */
  getSuggestions: async (
    websiteId: string, 
    pageId: string, 
    type: 'text' | 'layout' | 'style', 
    prompt: string
  ): Promise<AISuggestion[]> => {
    try {
      const response = await aiAPI.getSuggestions(websiteId, pageId, { type, prompt });
      return response.data;
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      throw error;
    }
  }
};

export default aiService;
