'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface CtaContent {
  headline: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right';
  style?: 'standard' | 'fullwidth' | 'boxed';
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

interface CtaElementProps {
  content: CtaContent;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<CtaContent>) => void;
}

export function CtaElement({ content, settings, isEditing = false, onUpdate }: CtaElementProps) {
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingPrimaryButton, setIsEditingPrimaryButton] = useState(false);
  const [isEditingSecondaryButton, setIsEditingSecondaryButton] = useState(false);
  
  // Default values
  const headline = content.headline || 'Take Action Now';
  const description = content.description;
  const primaryButtonText = content.primaryButtonText || 'Get Started';
  const primaryButtonLink = content.primaryButtonLink || '#';
  const secondaryButtonText = content.secondaryButtonText;
  const secondaryButtonLink = content.secondaryButtonLink || '#';
  const alignment = content.alignment || 'center';
  const style = content.style || 'standard';
  const backgroundColor = content.backgroundColor || settings.colors.accent;
  const backgroundImage = content.backgroundImage;
  
  // Handle text changes
  const handleHeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ headline: e.target.value });
    }
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdate) {
      onUpdate({ description: e.target.value });
    }
  };
  
  const handlePrimaryButtonTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ primaryButtonText: e.target.value });
    }
  };
  
  const handlePrimaryButtonLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ primaryButtonLink: e.target.value });
    }
  };
  
  const handleSecondaryButtonTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ secondaryButtonText: e.target.value });
    }
  };
  
  const handleSecondaryButtonLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ secondaryButtonLink: e.target.value });
    }
  };
  
  // Handle style changes
  const handleAlignmentChange = (newAlignment: 'left' | 'center' | 'right') => {
    if (onUpdate) {
      onUpdate({ alignment: newAlignment });
    }
  };
  
  const handleStyleChange = (newStyle: 'standard' | 'fullwidth' | 'boxed') => {
    if (onUpdate) {
      onUpdate({ style: newStyle });
    }
  };
  
  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ backgroundColor: e.target.value });
    }
  };
  
  const handleBackgroundImageChange = () => {
    // This would open an image selector in a real implementation
    if (onUpdate) {
      onUpdate({ backgroundImage: backgroundImage ? '' : '/images/placeholders/cta-background.jpg' });
    }
  };
  
  // Get alignment class
  const getAlignmentClass = () => {
    switch (alignment) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      case 'center':
      default:
        return 'text-center';
    }
  };
  
  // Get style classes
  const getStyleClasses = () => {
    switch (style) {
      case 'fullwidth':
        return 'py-16 px-4 sm:px-6 lg:px-8';
      case 'boxed':
        return 'py-10 px-6 sm:py-12 sm:px-8 max-w-4xl mx-auto rounded-lg shadow-lg';
      case 'standard':
      default:
        return 'py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto';
    }
  };
  
  // Background style
  const backgroundStyles: React.CSSProperties = {
    backgroundColor: backgroundColor || settings.colors.accent,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundBlendMode: backgroundImage ? 'overlay' : 'normal',
    color: '#ffffff', // Default text color for CTA
  };
  
  return (
    <div 
      className="relative"
      style={backgroundStyles}
    >
      {/* Overlay for darker background if image is present */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      )}
      
      <div className={`relative ${getStyleClasses()}`}>
        <div className={`${getAlignmentClass()}`}>
          {/* Headline */}
          {isEditing && isEditingHeadline ? (
            <input
              type="text"
              value={headline}
              onChange={handleHeadlineChange}
              onBlur={() => setIsEditingHeadline(false)}
              className="w-full text-3xl md:text-4xl font-bold text-center bg-transparent border border-white/20 px-2 py-1 focus:outline-none focus:border-white text-white"
              style={{ fontFamily: settings.fonts.heading }}
              autoFocus
            />
          ) : (
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4" 
              style={{ fontFamily: settings.fonts.heading }}
              onClick={isEditing ? () => setIsEditingHeadline(true) : undefined}
            >
              {headline}
            </h2>
          )}
          
          {/* Description */}
          {(description || isEditing) && (
            isEditing && isEditingDescription ? (
              <textarea
                value={description || ''}
                onChange={handleDescriptionChange}
                onBlur={() => setIsEditingDescription(false)}
                className="w-full max-w-2xl mx-auto text-lg bg-transparent border border-white/20 px-2 py-1 focus:outline-none focus:border-white text-white"
                style={{ fontFamily: settings.fonts.body }}
                rows={3}
                placeholder="Add a description"
                autoFocus
              />
            ) : (
              <p 
                className="max-w-2xl mx-auto text-lg mb-8 text-white/90" 
                style={{ fontFamily: settings.fonts.body }}
                onClick={isEditing ? () => setIsEditingDescription(true) : undefined}
              >
                {description || (isEditing ? 'Click to add a description' : '')}
              </p>
            )
          )}
          
          {/* Buttons */}
          <div className={`mt-8 flex ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'} flex-col sm:flex-row gap-4`}>
            {/* Primary Button */}
            {(primaryButtonText || isEditing) && (
              isEditing && isEditingPrimaryButton ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={primaryButtonText || ''}
                    onChange={handlePrimaryButtonTextChange}
                    className="px-4 py-2 bg-transparent border border-white/20 text-center focus:outline-none focus:border-white text-white"
                    placeholder="Button Text"
                    style={{ fontFamily: settings.fonts.body }}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={primaryButtonLink || ''}
                    onChange={handlePrimaryButtonLinkChange}
                    onBlur={() => setIsEditingPrimaryButton(false)}
                    className="px-4 py-2 bg-transparent border border-white/20 text-center focus:outline-none focus:border-white text-white text-sm"
                    placeholder="https://example.com"
                  />
                </div>
              ) : (
                <a
                  href={isEditing ? "#" : primaryButtonLink}
                  className="inline-flex justify-center py-3 px-6 border border-transparent text-base font-medium rounded-md text-white shadow-sm"
                  style={{ 
                    backgroundColor: settings.colors.primary,
                    borderRadius: settings.globalStyles?.borderRadius,
                    fontFamily: settings.fonts.body,
                  }}
                  onClick={isEditing ? (e) => {
                    e.preventDefault();
                    setIsEditingPrimaryButton(true);
                  } : undefined}
                >
                  {primaryButtonText || (isEditing ? 'Primary Button' : '')}
                </a>
              )
            )}
            
            {/* Secondary Button */}
            {(secondaryButtonText || isEditing) && (
              isEditing && isEditingSecondaryButton ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={secondaryButtonText || ''}
                    onChange={handleSecondaryButtonTextChange}
                    className="px-4 py-2 bg-transparent border border-white/20 text-center focus:outline-none focus:border-white text-white"
                    placeholder="Button Text"
                    style={{ fontFamily: settings.fonts.body }}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={secondaryButtonLink || ''}
                    onChange={handleSecondaryButtonLinkChange}
                    onBlur={() => setIsEditingSecondaryButton(false)}
                    className="px-4 py-2 bg-transparent border border-white/20 text-center focus:outline-none focus:border-white text-white text-sm"
                    placeholder="https://example.com"
                  />
                </div>
              ) : (
                <a
                  href={isEditing ? "#" : secondaryButtonLink}
                  className="inline-flex justify-center py-3 px-6 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:bg-opacity-10"
                  style={{ 
                    borderRadius: settings.globalStyles?.borderRadius,
                    fontFamily: settings.fonts.body,
                  }}
                  onClick={isEditing ? (e) => {
                    e.preventDefault();
                    setIsEditingSecondaryButton(true);
                  } : undefined}
                >
                  {secondaryButtonText || (isEditing ? 'Secondary Button' : '')}
                </a>
              )
            )}
            
            {/* Add Secondary Button */}
            {isEditing && !secondaryButtonText && (
              <button
                type="button"
                className="inline-flex justify-center py-3 px-6 border border-dashed border-white/50 text-base font-medium rounded-md text-white/70 hover:text-white hover:border-white"
                onClick={() => onUpdate?.({ secondaryButtonText: 'Learn More' })}
              >
                + Add Secondary Button
              </button>
            )}
          </div>
        </div>
        
        {/* Edit controls */}
        {isEditing && (
          <div className="absolute right-4 top-4 flex flex-col gap-2">
            <div className="flex gap-1 bg-white/10 backdrop-blur-sm p-1 rounded">
              <button
                type="button"
                className={`h-8 w-8 rounded flex items-center justify-center ${alignment === 'left' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                onClick={() => handleAlignmentChange('left')}
                title="Align Left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
                </svg>
              </button>
              <button
                type="button"
                className={`h-8 w-8 rounded flex items-center justify-center ${alignment === 'center' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                onClick={() => handleAlignmentChange('center')}
                title="Align Center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M9 12h6M11 18h2" />
                </svg>
              </button>
              <button
                type="button"
                className={`h-8 w-8 rounded flex items-center justify-center ${alignment === 'right' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                onClick={() => handleAlignmentChange('right')}
                title="Align Right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M14 12h6M17 18h3" />
                </svg>
              </button>
            </div>
            
            <div className="flex gap-1 bg-white/10 backdrop-blur-sm p-1 rounded">
              <button
                type="button"
                className={`h-8 w-8 rounded flex items-center justify-center ${style === 'standard' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                onClick={() => handleStyleChange('standard')}
                title="Standard Style"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                </svg>
              </button>
              <button
                type="button"
                className={`h-8 w-8 rounded flex items-center justify-center ${style === 'fullwidth' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                onClick={() => handleStyleChange('fullwidth')}
                title="Full Width"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                type="button"
                className={`h-8 w-8 rounded flex items-center justify-center ${style === 'boxed' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                onClick={() => handleStyleChange('boxed')}
                title="Boxed Style"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </button>
            </div>
            
            <div className="flex gap-1 bg-white/10 backdrop-blur-sm p-1 rounded">
              <input
                type="color"
                value={backgroundColor || settings.colors.accent}
                onChange={handleBackgroundColorChange}
                className="h-8 w-8 rounded cursor-pointer"
                title="Background Color"
              />
              <button
                type="button"
                className={`h-8 w-8 rounded flex items-center justify-center ${backgroundImage ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
                onClick={handleBackgroundImageChange}
                title={backgroundImage ? "Remove Background Image" : "Add Background Image"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
