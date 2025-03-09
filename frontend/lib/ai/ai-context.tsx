'use client';

import React, { createContext, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { aiAPI } from '../api';

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

interface AIContextType {
  isLoading: boolean;
  // Content generation
  generateContent: (prompt: string, contentType: ContentType) => Promise<string>;
  // Color scheme generation
  generateColorScheme: (data: { industry?: string; mood?: string; baseColor?: string }) => Promise<ColorScheme>;
  // Font pairing generation
  generateFontPairings: (data: { style?: string; industry?: string }) => Promise<FontPairing[]>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  // Generate content
  const generateContent = async (prompt: string, contentType: ContentType): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await aiAPI.generateContent(prompt, contentType);
      return response.data.content;
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
      const response = await aiAPI.generateColorScheme(data);
      return response.data.colors;
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
      const response = await aiAPI.generateFontPairings(data);
      return response.data.pairings;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate font pairings');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isLoading,
    generateContent,
    generateColorScheme,
    generateFontPairings,
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
