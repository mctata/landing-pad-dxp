'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'react-toastify';
import aiService from '../services/aiService';

// Content types for AI generation
type ContentType = 'headline' | 'description' | 'about' | 'features' | 'testimonial';

// Color scheme interface
interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

// Font pairing interface
interface FontPairing {
  heading: string;
  body: string;
}

interface AIContextProps {
  children: ReactNode;
}

interface AIError {
  isError: boolean;
  message: string;
  retrying: boolean;
}

interface AIContextValue {
  isGeneratingContent: boolean;
  isGeneratingSuggestions: boolean;
  latestContentResult: any | null;
  latestSuggestions: any[];
  error: AIError;
  
  // Legacy methods
  generateContent: (params: any) => Promise<any>;
  generateSuggestions: (websiteId: string, pageId: string, type: string, prompt: string) => Promise<any>;
  modifyContent: (content: string, action: string, parameters?: any) => Promise<any>;
  clearResults: () => void;
  clearError: () => void;
  retryLastOperation: () => Promise<any>;
  
  // New methods from frontend-backend-integration
  isLoading: boolean;
  generateAdvancedContent: (prompt: string, contentType: ContentType) => Promise<string>;
  generateColorScheme: (data: { industry?: string; mood?: string; baseColor?: string }) => Promise<ColorScheme>;
  generateFontPairings: (data: { style?: string; industry?: string }) => Promise<FontPairing[]>;
}

const AIContext = createContext<AIContextValue | undefined>(undefined);

export function AIProvider({ children }: AIContextProps) {
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [latestContentResult, setLatestContentResult] = useState<any | null>(null);
  const [latestSuggestions, setLatestSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AIError>({
    isError: false,
    message: '',
    retrying: false
  });
  
  const [lastOperation, setLastOperation] = useState<{
    type: string;
    params: any;
  } | null>(null);

  // Legacy content generation for the editor
  const generateContent = async (params: any) => {
    setIsGeneratingContent(true);
    setLastOperation({
      type: 'content',
      params
    });
    
    try {
      // Call the actual API
      let result;
      try {
        result = await aiService.generateContent({
          websiteId: params.websiteId || 'default',
          pageId: params.pageId || 'default',
          elementType: params.elementType,
          prompt: params.prompt,
          tone: params.tone,
          length: params.length
        });
      } catch (apiError) {
        console.warn('API call failed, using fallback mock data', apiError);
        
        // Fallback to mock data if API fails
        if (params.elementType === 'text') {
          result = {
            heading: 'Transform Your Digital Presence',
            subheading: 'Create beautiful websites in minutes with our AI-powered platform',
            body: 'Landing Pad Digital provides everything you need to build a professional website without coding skills. Our intuitive drag-and-drop editor combined with AI suggestions makes website creation faster than ever before.'
          };
        } else if (params.elementType === 'hero') {
          result = {
            headline: 'Build Your Dream Website',
            subheadline: 'No coding required, just your imagination',
            ctaText: 'Get Started Free',
            imagePosition: 'right'
          };
        } else {
          result = {
            content: 'Generated content for ' + params.elementType + ' with tone: ' + params.tone
          };
        }
      }
      
      setLatestContentResult(result);
      setIsGeneratingContent(false);
      return result;
    } catch (error: any) {
      console.error('Error generating content:', error);
      setIsGeneratingContent(false);
      setError({
        isError: true,
        message: error.message || 'Failed to generate content',
        retrying: false
      });
      throw error;
    }
  };

  // Legacy suggestion generation
  const generateSuggestions = async (websiteId: string, pageId: string, type: string, prompt: string) => {
    setIsGeneratingSuggestions(true);
    setLastOperation({
      type: 'suggestions',
      params: { websiteId, pageId, type, prompt }
    });
    
    try {
      // Call the actual API
      let suggestions = [];
      try {
        const result = await aiService.getSuggestions(websiteId, pageId, type, prompt);
        suggestions = result;
      } catch (apiError) {
        console.warn('API call failed, using fallback mock data', apiError);
        
        // Fallback to mock data if API fails
        if (type === 'text') {
          suggestions = [
            {
              id: '1',
              type: 'text',
              title: 'Modern Homepage Headline',
              content: {
                heading: 'Create Stunning Websites Without Code',
                subheading: 'Our AI-powered platform makes it easy to build professional websites in minutes'
              }
            },
            {
              id: '2',
              type: 'text',
              title: 'Feature Highlight',
              content: {
                heading: 'Powerful Features, Simple Interface',
                subheading: 'Everything you need to succeed online'
              }
            }
          ];
        } else if (type === 'layout') {
          suggestions = [
            {
              id: '1',
              type: 'layout',
              title: 'Modern SaaS Homepage',
              content: {
                structure: 'Hero > Features > Testimonials > Pricing > CTA',
                elements: ['Header', 'Hero', 'Features Grid', 'Testimonials', 'Pricing Table', 'Call to Action', 'Footer']
              }
            },
            {
              id: '2',
              type: 'layout',
              title: 'Professional Services',
              content: {
                structure: 'Hero > Services > About > Team > Contact',
                elements: ['Header', 'Hero', 'Services Grid', 'About Section', 'Team Members', 'Contact Form', 'Footer']
              }
            }
          ];
        } else if (type === 'style') {
          suggestions = [
            {
              id: '1',
              type: 'style',
              title: 'Modern Tech Theme',
              content: {
                colors: {
                  primary: '#3B82F6',
                  secondary: '#1E293B',
                  accent: '#06B6D4',
                  background: '#F8FAFC'
                },
                typography: {
                  heading: 'Inter',
                  body: 'Inter'
                }
              }
            },
            {
              id: '2',
              type: 'style',
              title: 'Elegant Professional Theme',
              content: {
                colors: {
                  primary: '#4F46E5',
                  secondary: '#334155',
                  accent: '#EC4899',
                  background: '#FFFFFF'
                },
                typography: {
                  heading: 'Playfair Display',
                  body: 'Source Sans Pro'
                }
              }
            }
          ];
        }
      }
      
      setLatestSuggestions(suggestions);
      setIsGeneratingSuggestions(false);
      return suggestions;
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      setIsGeneratingSuggestions(false);
      setError({
        isError: true,
        message: error.message || 'Failed to generate suggestions',
        retrying: false
      });
      throw error;
    }
  };

  // Legacy content modification
  const modifyContent = async (content: string, action: string, parameters?: any) => {
    setLastOperation({
      type: 'modify',
      params: { content, action, parameters }
    });
    
    try {
      // Call the actual API
      let modifiedContent;
      try {
        const result = await aiService.modifyContent({
          content,
          action,
          parameters
        });
        modifiedContent = result.content;
      } catch (apiError) {
        console.warn('API call failed, using fallback content modification', apiError);
        
        // Fallback to simple modifications if API fails
        modifiedContent = content;
        
        switch (action) {
          case 'shorten':
            modifiedContent = content.split(' ').slice(0, Math.ceil(content.split(' ').length * 0.7)).join(' ');
            break;
          case 'expand':
            modifiedContent = content + ' Additionally, we offer exceptional customer support and a user-friendly interface that ensures a seamless experience for all users.';
            break;
          case 'changeStyle':
            if (parameters?.style === 'professional') {
              modifiedContent = content.replace(/we/gi, 'our team').replace(/great/gi, 'exceptional');
            } else if (parameters?.style === 'casual') {
              modifiedContent = content.replace(/utilize/gi, 'use').replace(/additionally/gi, 'also');
            }
            break;
          default:
            modifiedContent = content;
        }
      }
      
      return modifiedContent;
    } catch (error: any) {
      console.error('Error modifying content:', error);
      setError({
        isError: true,
        message: error.message || 'Failed to modify content',
        retrying: false
      });
      throw error;
    }
  };

  // New methods from frontend-backend-integration branch
  // Generate content with advanced API
  const generateAdvancedContent = async (prompt: string, contentType: ContentType): Promise<string> => {
    setIsLoading(true);
    try {
      // This would normally call an API, but for now we'll return mock data
      // const response = await aiAPI.generateContent(prompt, contentType);
      // return response.data.content;
      
      // Mock response for now
      return `Here is some generated ${contentType} content based on your prompt: "${prompt}"`;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate content');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate color scheme
  const generateColorScheme = async (data: { industry?: string; mood?: string; baseColor?: string }): Promise<ColorScheme> => {
    setIsLoading(true);
    try {
      // This would normally call an API, but for now we'll return mock data
      // const response = await aiAPI.generateColorScheme(data);
      // return response.data.colors;
      
      // Mock color schemes based on industry or mood
      const schemes = {
        technology: {
          primary: '#3B82F6',
          secondary: '#1E293B',
          accent: '#06B6D4',
          background: '#F8FAFC',
          text: '#0F172A'
        },
        healthcare: {
          primary: '#10B981',
          secondary: '#1E293B',
          accent: '#06B6D4',
          background: '#F8FAFC',
          text: '#0F172A'
        },
        finance: {
          primary: '#6366F1',
          secondary: '#334155',
          accent: '#EC4899',
          background: '#FFFFFF',
          text: '#0F172A'
        },
        default: {
          primary: '#3B82F6',
          secondary: '#334155',
          accent: '#EC4899',
          background: '#FFFFFF',
          text: '#0F172A'
        }
      };
      
      if (data.industry === 'technology') return schemes.technology;
      if (data.industry === 'healthcare') return schemes.healthcare;
      if (data.industry === 'finance') return schemes.finance;
      
      return schemes.default;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate color scheme');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate font pairings
  const generateFontPairings = async (data: { style?: string; industry?: string }): Promise<FontPairing[]> => {
    setIsLoading(true);
    try {
      // This would normally call an API, but for now we'll return mock data
      // const response = await aiAPI.generateFontPairings(data);
      // return response.data.pairings;
      
      // Mock font pairings
      return [
        { heading: 'Playfair Display', body: 'Source Sans Pro' },
        { heading: 'Montserrat', body: 'Merriweather' },
        { heading: 'Poppins', body: 'Roboto' }
      ];
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate font pairings');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Utility methods
  const clearResults = () => {
    setLatestContentResult(null);
    setLatestSuggestions([]);
  };
  
  const clearError = () => {
    setError({
      isError: false,
      message: '',
      retrying: false
    });
  };
  
  const retryLastOperation = async () => {
    if (!lastOperation) return null;
    
    setError({
      ...error,
      retrying: true
    });
    
    try {
      let result;
      switch (lastOperation.type) {
        case 'content':
          result = await generateContent(lastOperation.params);
          break;
        case 'suggestions':
          result = await generateSuggestions(
            lastOperation.params.websiteId,
            lastOperation.params.pageId,
            lastOperation.params.type,
            lastOperation.params.prompt
          );
          break;
        case 'modify':
          result = await modifyContent(
            lastOperation.params.content,
            lastOperation.params.action,
            lastOperation.params.parameters
          );
          break;
        default:
          result = null;
      }
      
      clearError();
      return result;
    } catch (error: any) {
      setError({
        isError: true,
        message: error.message || 'Retry failed',
        retrying: false
      });
      return null;
    }
  };

  const value = {
    // Legacy properties
    isGeneratingContent,
    isGeneratingSuggestions,
    latestContentResult,
    latestSuggestions,
    generateContent,
    generateSuggestions,
    modifyContent,
    clearResults,
    clearError,
    retryLastOperation,
    error,
    
    // New properties from frontend-backend-integration
    isLoading,
    generateAdvancedContent,
    generateColorScheme,
    generateFontPairings
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
