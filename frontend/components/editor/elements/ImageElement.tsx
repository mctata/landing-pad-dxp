'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageContent {
  image: string;
  caption?: string;
  altText?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
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

interface ImageElementProps {
  content: ImageContent;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<ImageContent>) => void;
}

export function ImageElement({ content, settings, isEditing = false, onUpdate }: ImageElementProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [isEditingAltText, setIsEditingAltText] = useState(false);
  
  // Get alignment class
  const getAlignmentClass = () => {
    switch (content.alignment) {
      case 'left':
        return 'mx-0';
      case 'right':
        return 'ml-auto';
      case 'center':
      default:
        return 'mx-auto';
    }
  };
  
  // Get size style
  const getSizeStyle = () => {
    switch (content.size) {
      case 'small':
        return 'max-w-md';
      case 'medium':
        return 'max-w-2xl';
      case 'large':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-2xl';
    }
  };
  
  // Handle inline editing
  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ caption: e.target.value });
    }
  };
  
  const handleAltTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ altText: e.target.value });
    }
  };
  
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: settings.colors.background }}>
      <figure className={`${getSizeStyle()} ${getAlignmentClass()}`}>
        {/* Image */}
        <div className="relative">
          <img
            src={content.image}
            alt={content.altText || ''}
            className="w-full h-auto"
            style={{ 
              borderRadius: settings.globalStyles?.borderRadius || '0.375rem',
            }}
          />
          
          {/* Edit overlay for image when in editing mode */}
          {isEditing && (
            <button
              className="absolute bottom-4 right-4 bg-white/90 text-secondary-700 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium hover:bg-white"
              onClick={() => {
                // This would open an image selector in a real implementation
                if (onUpdate) {
                  onUpdate({ image: '/images/placeholders/new-image.jpg' });
                }
              }}
            >
              Change Image
            </button>
          )}
        </div>
        
        {/* Caption */}
        {(content.caption || isEditing) && (
          <figcaption className="mt-3 text-center">
            {isEditing && isEditingCaption ? (
              <input
                type="text"
                value={content.caption || ''}
                onChange={handleCaptionChange}
                onBlur={() => setIsEditingCaption(false)}
                placeholder="Add a caption"
                className="w-full text-sm text-secondary-500 bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500 text-center"
                style={{ color: settings.colors.text + '99' }}
                autoFocus
              />
            ) : (
              <p 
                className="text-sm text-secondary-500" 
                style={{ 
                  fontFamily: settings.fonts.body,
                  color: settings.colors.text + '99'
                }}
                onClick={isEditing ? () => setIsEditingCaption(true) : undefined}
              >
                {content.caption || (isEditing ? 'Add a caption (click to edit)' : '')}
              </p>
            )}
          </figcaption>
        )}
        
        {/* Alt Text Editor (only visible in editing mode) */}
        {isEditing && (
          <div className="mt-2">
            <div className="text-xs text-secondary-500 mb-1">Alt Text (for accessibility):</div>
            {isEditingAltText ? (
              <input
                type="text"
                value={content.altText || ''}
                onChange={handleAltTextChange}
                onBlur={() => setIsEditingAltText(false)}
                placeholder="Describe the image for screen readers"
                className="w-full text-sm text-secondary-700 bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                style={{ color: settings.colors.text }}
                autoFocus
              />
            ) : (
              <div 
                className="text-sm text-secondary-700 bg-secondary-50 px-2 py-1 rounded cursor-pointer hover:bg-secondary-100"
                style={{ color: settings.colors.text }}
                onClick={() => setIsEditingAltText(true)}
              >
                {content.altText || 'No alt text set (click to add)'}
              </div>
            )}
          </div>
        )}
        
        {/* Size and Alignment Controls (only visible in editing mode) */}
        {isEditing && (
          <div className="mt-4 flex flex-wrap gap-4">
            {/* Size selector */}
            <div>
              <div className="text-xs text-secondary-500 mb-1">Image Size:</div>
              <div className="flex border border-secondary-300 rounded-md overflow-hidden">
                <button
                  className={`px-2 py-1 text-xs ${content.size === 'small' ? 'bg-primary-100 text-primary-700' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
                  onClick={() => onUpdate?.({ size: 'small' })}
                >
                  Small
                </button>
                <button
                  className={`px-2 py-1 text-xs ${content.size === 'medium' || !content.size ? 'bg-primary-100 text-primary-700' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
                  onClick={() => onUpdate?.({ size: 'medium' })}
                >
                  Medium
                </button>
                <button
                  className={`px-2 py-1 text-xs ${content.size === 'large' ? 'bg-primary-100 text-primary-700' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
                  onClick={() => onUpdate?.({ size: 'large' })}
                >
                  Large
                </button>
                <button
                  className={`px-2 py-1 text-xs ${content.size === 'full' ? 'bg-primary-100 text-primary-700' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
                  onClick={() => onUpdate?.({ size: 'full' })}
                >
                  Full Width
                </button>
              </div>
            </div>
            
            {/* Alignment selector */}
            <div>
              <div className="text-xs text-secondary-500 mb-1">Alignment:</div>
              <div className="flex border border-secondary-300 rounded-md overflow-hidden">
                <button
                  className={`px-2 py-1 text-xs ${content.alignment === 'left' ? 'bg-primary-100 text-primary-700' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
                  onClick={() => onUpdate?.({ alignment: 'left' })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
                  </svg>
                </button>
                <button
                  className={`px-2 py-1 text-xs ${content.alignment === 'center' || !content.alignment ? 'bg-primary-100 text-primary-700' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
                  onClick={() => onUpdate?.({ alignment: 'center' })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M9 12h6M11 18h2" />
                  </svg>
                </button>
                <button
                  className={`px-2 py-1 text-xs ${content.alignment === 'right' ? 'bg-primary-100 text-primary-700' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
                  onClick={() => onUpdate?.({ alignment: 'right' })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M14 12h6M17 18h3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </figure>
    </div>
  );
}
