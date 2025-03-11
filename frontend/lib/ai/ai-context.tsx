'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import aiService from '../services/aiService';

interface AIContextProps {
  children: ReactNode;
}

interface AIContextValue {
  isGeneratingContent: boolean;
  isGeneratingSuggestions: boolean;
  latestContentResult: any | null;
  latestSuggestions: any[];
  generateContent: (params: any) => Promise<any>;
  generateSuggestions: (websiteId: string, pageId: string, type: string) => Promise<any>;
  modifyContent: (content: string, action: string, parameters?: any) => Promise<any>;
  clearResults: () => void;
}

const AIContext = createContext<AIContextValue | undefined>(undefined);

export function AIProvider({ children }: AIContextProps) {
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [latestContentResult, setLatestContentResult] = useState<any | null>(null);
  const [latestSuggestions, setLatestSuggestions] = useState<any[]>([]);

  const generateContent = async (params: any) => {
    setIsGeneratingContent(true);
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
    } catch (error) {
      console.error('Error generating content:', error);
      setIsGeneratingContent(false);
      throw error;
    }
  };

  const generateSuggestions = async (websiteId: string, pageId: string, type: string, prompt: string) => {
    setIsGeneratingSuggestions(true);
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
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setIsGeneratingSuggestions(false);
      throw error;
    }
  };

  const modifyContent = async (content: string, action: string, parameters?: any) => {
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
    } catch (error) {
      console.error('Error modifying content:', error);
      throw error;
    }
  };

  const clearResults = () => {
    setLatestContentResult(null);
    setLatestSuggestions([]);
  };

  const value = {
    isGeneratingContent,
    isGeneratingSuggestions,
    latestContentResult,
    latestSuggestions,
    generateContent,
    generateSuggestions,
    modifyContent,
    clearResults
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
