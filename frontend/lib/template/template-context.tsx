'use client';

import React, { createContext, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { templateAPI } from '../api';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  content?: any;
  styles?: any;
  settings?: any;
  isDefault: boolean;
}

interface TemplateContextType {
  templates: Template[];
  currentTemplate: Template | null;
  isLoading: boolean;
  fetchTemplates: () => Promise<void>;
  fetchTemplateById: (id: string) => Promise<void>;
  fetchTemplatesByCategory: (category: string) => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all templates
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await templateAPI.getTemplates();
      setTemplates(response.data.templates);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a template by ID
  const fetchTemplateById = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await templateAPI.getTemplateById(id);
      setCurrentTemplate(response.data.template);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch template');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch templates by category
  const fetchTemplatesByCategory = async (category: string) => {
    setIsLoading(true);
    try {
      const response = await templateAPI.getTemplatesByCategory(category);
      setTemplates(response.data.templates);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch templates by category');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    templates,
    currentTemplate,
    isLoading,
    fetchTemplates,
    fetchTemplateById,
    fetchTemplatesByCategory,
  };

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
}
