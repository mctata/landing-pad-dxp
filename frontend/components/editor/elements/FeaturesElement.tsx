'use client';

import React, { useState } from 'react';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface FeaturesContent {
  headline: string;
  subheadline?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
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

interface FeaturesElementProps {
  content: FeaturesContent;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<FeaturesContent>) => void;
}

export function FeaturesElement({ content, settings, isEditing = false, onUpdate }: FeaturesElementProps) {
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [isEditingSubheadline, setIsEditingSubheadline] = useState(false);
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  
  // Get columns class
  const getColumnsClass = () => {
    switch (content.columns) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      case 3:
      default:
        return 'grid-cols-1 md:grid-cols-3';
    }
  };
  
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
  
  const handleFeatureTitleChange = (index: number, value: string) => {
    if (onUpdate) {
      const updatedFeatures = [...content.features];
      updatedFeatures[index] = { ...updatedFeatures[index], title: value };
      onUpdate({ features: updatedFeatures });
    }
  };
  
  const handleFeatureDescriptionChange = (index: number, value: string) => {
    if (onUpdate) {
      const updatedFeatures = [...content.features];
      updatedFeatures[index] = { ...updatedFeatures[index], description: value };
      onUpdate({ features: updatedFeatures });
    }
  };
  
  // Helper function to render icon
  const renderIcon = (iconName: string) => {
    // This is a simplified icon rendering - in a real application, you would have a comprehensive icon system
    switch (iconName) {
      case 'star':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'heart':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'bolt':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };
  
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: settings.colors.background }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          {/* Headline */}
          {isEditing && isEditingHeadline ? (
            <input
              type="text"
              value={content.headline}
              onChange={handleHeadlineChange}
              onBlur={() => setIsEditingHeadline(false)}
              className="w-full max-w-3xl mx-auto text-3xl sm:text-4xl font-bold text-secondary-900 bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
              style={{ color: settings.colors.text }}
              autoFocus
            />
          ) : (
            <h2 
              className="text-3xl sm:text-4xl font-bold text-secondary-900" 
              style={{ 
                fontFamily: settings.fonts.heading,
                color: settings.colors.text 
              }}
              onClick={isEditing ? () => setIsEditingHeadline(true) : undefined}
            >
              {content.headline}
            </h2>
          )}
          
          {/* Subheadline */}
          {content.subheadline && (
            isEditing && isEditingSubheadline ? (
              <input
                type="text"
                value={content.subheadline}
                onChange={handleSubheadlineChange}
                onBlur={() => setIsEditingSubheadline(false)}
                className="w-full max-w-3xl mx-auto mt-4 text-xl text-secondary-500 bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                style={{ color: settings.colors.text + '99' }}
                autoFocus
              />
            ) : (
              <p 
                className="mt-4 text-xl text-secondary-500" 
                style={{ 
                  fontFamily: settings.fonts.body,
                  color: settings.colors.text + '99' 
                }}
                onClick={isEditing ? () => setIsEditingSubheadline(true) : undefined}
              >
                {content.subheadline}
              </p>
            )
          )}
        </div>
        
        {/* Features Grid */}
        <div className={`grid ${getColumnsClass()} gap-8`}>
          {content.features.map((feature, index) => (
            <div 
              key={index} 
              className={`p-6 rounded-lg ${isEditing ? 'hover:shadow-md transition-shadow duration-200' : ''}`}
              onClick={isEditing ? () => setEditingFeatureIndex(index) : undefined}
            >
              {/* Icon */}
              <div 
                className="h-12 w-12 rounded-md flex items-center justify-center mb-4" 
                style={{ backgroundColor: settings.colors.primary + '20', color: settings.colors.primary }}
              >
                {renderIcon(feature.icon)}
              </div>
              
              {/* Feature Title */}
              {isEditing && editingFeatureIndex === index ? (
                <input
                  type="text"
                  value={feature.title}
                  onChange={(e) => handleFeatureTitleChange(index, e.target.value)}
                  onBlur={() => setEditingFeatureIndex(null)}
                  className="w-full text-xl font-medium text-secondary-900 bg-transparent border border-secondary-300 px-2 py-1 mb-2 focus:outline-none focus:border-primary-500"
                  style={{ color: settings.colors.text }}
                  autoFocus
                />
              ) : (
                <h3 
                  className="text-xl font-medium text-secondary-900 mb-2" 
                  style={{ 
                    fontFamily: settings.fonts.heading,
                    color: settings.colors.text 
                  }}
                >
                  {feature.title}
                </h3>
              )}
              
              {/* Feature Description */}
              {isEditing && editingFeatureIndex === index ? (
                <textarea
                  value={feature.description}
                  onChange={(e) => handleFeatureDescriptionChange(index, e.target.value)}
                  onBlur={() => setEditingFeatureIndex(null)}
                  className="w-full text-secondary-500 bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                  style={{ color: settings.colors.text + '99' }}
                  rows={3}
                />
              ) : (
                <p 
                  className="text-secondary-500" 
                  style={{ 
                    fontFamily: settings.fonts.body,
                    color: settings.colors.text + '99' 
                  }}
                >
                  {feature.description}
                </p>
              )}
            </div>
          ))}
        </div>
        
        {/* Add Feature button when editing */}
        {isEditing && (
          <div className="mt-8 text-center">
            <button
              type="button"
              className="px-4 py-2 border border-secondary-300 rounded-md text-secondary-700 bg-white hover:bg-secondary-50"
              onClick={() => {
                if (onUpdate) {
                  const newFeature: Feature = {
                    title: 'New Feature',
                    description: 'Description of the new feature',
                    icon: 'star',
                  };
                  
                  onUpdate({
                    features: [...content.features, newFeature],
                  });
                  
                  // Set to edit mode for the new feature
                  setTimeout(() => {
                    setEditingFeatureIndex(content.features.length);
                  }, 100);
                }
              }}
            >
              Add Feature
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
