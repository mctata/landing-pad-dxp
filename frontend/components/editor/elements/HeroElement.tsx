'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface HeroContent {
  headline: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  image?: string;
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

interface HeroElementProps {
  content: HeroContent;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<HeroContent>) => void;
}

export function HeroElement({ content, settings, isEditing = false, onUpdate }: HeroElementProps) {
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [isEditingSubheadline, setIsEditingSubheadline] = useState(false);
  const [isEditingCtaText, setIsEditingCtaText] = useState(false);
  
  // Get alignment class
  const getAlignmentClass = () => {
    switch (content.alignment) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      case 'center':
      default:
        return 'text-center';
    }
  };
  
  // Get placeholder image if none provided
  const imageUrl = content.image || '/images/placeholders/hero-image.jpg';
  
  // Handle inline editing
  const handleHeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ headline: e.target.value });
    }
  };
  
  const handleSubheadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ subheadline: e.target.value });
    }
  };
  
  const handleCtaTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ ctaText: e.target.value });
    }
  };
  
  return (
    <div 
      className="relative py-20 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
      style={{ 
        backgroundColor: settings.colors.background,
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${imageUrl})`,
      }}
    >
      <div className="relative max-w-7xl mx-auto">
        <div className={`max-w-3xl mx-auto ${getAlignmentClass()}`}>
          {/* Headline */}
          {isEditing && isEditingHeadline ? (
            <input
              type="text"
              value={content.headline}
              onChange={handleHeadlineChange}
              onBlur={() => setIsEditingHeadline(false)}
              className="w-full text-4xl sm:text-5xl font-bold text-white bg-transparent border border-white/20 px-2 py-1 focus:outline-none focus:border-white"
              autoFocus
            />
          ) : (
            <h1 
              className="text-4xl sm:text-5xl font-bold text-white" 
              style={{ fontFamily: settings.fonts.heading }}
              onClick={isEditing ? () => setIsEditingHeadline(true) : undefined}
            >
              {content.headline}
            </h1>
          )}
          
          {/* Subheadline */}
          {content.subheadline && (
            isEditing && isEditingSubheadline ? (
              <input
                type="text"
                value={content.subheadline}
                onChange={handleSubheadlineChange}
                onBlur={() => setIsEditingSubheadline(false)}
                className="w-full mt-4 text-xl text-white/90 bg-transparent border border-white/20 px-2 py-1 focus:outline-none focus:border-white"
                autoFocus
              />
            ) : (
              <p 
                className="mt-4 text-xl text-white/90" 
                style={{ fontFamily: settings.fonts.body }}
                onClick={isEditing ? () => setIsEditingSubheadline(true) : undefined}
              >
                {content.subheadline}
              </p>
            )
          )}
          
          {/* CTA Button */}
          {content.ctaText && (
            <div className="mt-8">
              {isEditing && isEditingCtaText ? (
                <input
                  type="text"
                  value={content.ctaText}
                  onChange={handleCtaTextChange}
                  onBlur={() => setIsEditingCtaText(false)}
                  className="px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-transparent border-white/20 focus:outline-none focus:border-white"
                  autoFocus
                />
              ) : (
                <a
                  href={isEditing ? "#" : content.ctaLink}
                  className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  style={{ 
                    backgroundColor: settings.colors.primary,
                    borderRadius: settings.globalStyles?.borderRadius,
                    fontFamily: settings.fonts.body,
                  }}
                  onClick={isEditing ? (e) => {
                    e.preventDefault();
                    setIsEditingCtaText(true);
                  } : undefined}
                >
                  {content.ctaText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Edit overlay for image when in editing mode */}
      {isEditing && (
        <button
          className="absolute bottom-4 right-4 bg-white/90 text-secondary-700 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium hover:bg-white"
          onClick={() => {
            // This would open an image selector in a real implementation
            if (onUpdate) {
              onUpdate({ image: '/images/placeholders/new-hero-image.jpg' });
            }
          }}
        >
          Change Background
        </button>
      )}
    </div>
  );
}
