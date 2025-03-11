'use client';

import React, { useState } from 'react';

interface TextContent {
  headline?: string;
  content: string;
  alignment?: 'left' | 'center' | 'right';
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

interface TextElementProps {
  content: TextContent;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<TextContent>) => void;
}

export function TextElement({ content, settings, isEditing = false, onUpdate }: TextElementProps) {
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  
  // Get alignment class
  const getAlignmentClass = () => {
    switch (content.alignment) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      case 'center':
        return 'text-center';
      default:
        return 'text-left';
    }
  };
  
  // Handle inline editing
  const handleHeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ headline: e.target.value });
    }
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdate) {
      onUpdate({ content: e.target.value });
    }
  };
  
  // Handle content as HTML
  const renderContent = () => {
    return { __html: content.content };
  };
  
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: settings.colors.background }}>
      <div className={`max-w-prose mx-auto ${getAlignmentClass()}`}>
        {/* Headline (optional) */}
        {content.headline && (
          isEditing && isEditingHeadline ? (
            <input
              type="text"
              value={content.headline}
              onChange={handleHeadlineChange}
              onBlur={() => setIsEditingHeadline(false)}
              className="w-full text-3xl font-bold text-secondary-900 bg-transparent border border-secondary-300 px-2 py-1 mb-6 focus:outline-none focus:border-primary-500"
              style={{ color: settings.colors.text }}
              autoFocus
            />
          ) : (
            <h2 
              className="text-3xl font-bold text-secondary-900 mb-6" 
              style={{ 
                fontFamily: settings.fonts.heading,
                color: settings.colors.text 
              }}
              onClick={isEditing ? () => setIsEditingHeadline(true) : undefined}
            >
              {content.headline}
            </h2>
          )
        )}
        
        {/* Content */}
        {isEditing && isEditingContent ? (
          <textarea
            value={content.content}
            onChange={handleContentChange}
            onBlur={() => setIsEditingContent(false)}
            className="w-full min-h-[200px] text-secondary-700 bg-transparent border border-secondary-300 px-3 py-2 focus:outline-none focus:border-primary-500"
            style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
            autoFocus
          />
        ) : (
          <div 
            className="prose prose-lg mx-auto text-secondary-700"
            style={{ 
              fontFamily: settings.fonts.body,
              color: settings.colors.text,
              maxWidth: '100%',
            }}
            onClick={isEditing ? () => setIsEditingContent(true) : undefined}
            dangerouslySetInnerHTML={renderContent()}
          />
        )}
      </div>
    </div>
  );
}
