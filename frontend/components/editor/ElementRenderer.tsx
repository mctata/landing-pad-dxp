'use client';

import React from 'react';
import { HeroElement } from './elements/HeroElement';
import { FeaturesElement } from './elements/FeaturesElement';
import { TextElement } from './elements/TextElement';
import { ImageElement } from './elements/ImageElement';
import { GalleryElement } from './elements/GalleryElement';
import { TestimonialsElement } from './elements/TestimonialsElement';
import { PricingElement } from './elements/PricingElement';
import { ContactElement } from './elements/ContactElement';
import { CtaElement } from './elements/CtaElement';
import { CustomHtmlElement } from './elements/CustomHtmlElement';

interface ElementData {
  id: string;
  type: string;
  content: any;
  settings?: any;
  position: number;
}

interface WebsiteSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  globalStyles?: {
    borderRadius?: string;
    buttonStyle?: string;
  };
}

interface ElementRendererProps {
  element: ElementData;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<ElementData>) => void;
}

export function ElementRenderer({ element, settings, isEditing = false, onUpdate }: ElementRendererProps) {
  // Render the appropriate element based on type
  switch (element.type) {
    case 'hero':
      return (
        <HeroElement 
          content={element.content} 
          settings={settings} 
          isEditing={isEditing} 
          onUpdate={onUpdate ? (updates) => onUpdate({ content: { ...element.content, ...updates } }) : undefined} 
        />
      );
      
    case 'features':
      return (
        <FeaturesElement 
          content={element.content} 
          settings={settings} 
          isEditing={isEditing} 
          onUpdate={onUpdate ? (updates) => onUpdate({ content: { ...element.content, ...updates } }) : undefined} 
        />
      );
      
    case 'text':
      return (
        <TextElement 
          content={element.content} 
          settings={settings} 
          isEditing={isEditing} 
          onUpdate={onUpdate ? (updates) => onUpdate({ content: { ...element.content, ...updates } }) : undefined} 
        />
      );
      
    case 'image':
      return (
        <ImageElement 
          content={element.content} 
          settings={settings} 
          isEditing={isEditing} 
          onUpdate={onUpdate ? (updates) => onUpdate({ content: { ...element.content, ...updates } }) : undefined} 
        />
      );
      
    case 'gallery':
      return (
        <GalleryElement 
          content={element.content} 
          settings={settings} 
          isEditing={isEditing} 
          onUpdate={onUpdate ? (updates) => onUpdate({ content: { ...element.content, ...updates } }) : undefined} 
        />
      );
      
    case 'testimonials':
      return (
        <TestimonialsElement 
          content={element.content} 
          settings={settings} 
          isEditing={isEditing} 
          onUpdate={onUpdate ? (updates) => onUpdate({ content: { ...element.content, ...updates } }) : undefined} 
        />
      );
      
    case 'pricing':
      return (
        <PricingElement 
          content={element.content} 
          settings={settings} 
          isEditing={isEditing} 
          onUpdate={onUpdate ? (updates) => onUpdate({ content: { ...element.content, ...updates } }) : undefined} 
        />
      );
      
    case 'contact':
      return (
        <ContactElement 
          content={element.content} 
          settings={settings} 
          isEditing={isEditing} 
          onUpdate={onUpdate ? (updates) => onUpdate({ content: { ...element.content, ...updates } }) : undefined} 
        />
      );
      
    case 'cta':
      return (
        <CtaElement 
          content={element.content} 
          settings={settings} 
          isEditing={isEditing} 
          onUpdate={onUpdate ? (updates) => onUpdate({ content: { ...element.content, ...updates } }) : undefined} 
        />
      );
      
    case 'custom':
      return (
        <CustomHtmlElement 
          content={element.content} 
          settings={settings} 
          isEditing={isEditing} 
          onUpdate={onUpdate ? (updates) => onUpdate({ content: { ...element.content, ...updates } }) : undefined} 
        />
      );
      
    default:
      return (
        <div className="p-4 bg-red-50 text-red-500 rounded border border-red-200">
          Unknown element type: {element.type}
        </div>
      );
  }
}
