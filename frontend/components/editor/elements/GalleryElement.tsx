'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

interface GalleryContent {
  title?: string;
  description?: string;
  images: GalleryImage[];
  layout: 'grid' | 'carousel' | 'masonry';
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

interface GalleryElementProps {
  content: GalleryContent;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<GalleryContent>) => void;
}

export function GalleryElement({ content, settings, isEditing = false, onUpdate }: GalleryElementProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  // Default values if properties are missing
  const images = content.images || [];
  const layout = content.layout || 'grid';
  const columns = content.columns || 3;
  
  // Handle inline editing for title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ title: e.target.value });
    }
  };
  
  // Handle inline editing for description
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdate) {
      onUpdate({ description: e.target.value });
    }
  };
  
  // Handle image removal
  const handleRemoveImage = (index: number) => {
    if (onUpdate) {
      const updatedImages = [...images];
      updatedImages.splice(index, 1);
      onUpdate({ images: updatedImages });
    }
  };
  
  // Handle adding a new image
  const handleAddImage = () => {
    if (onUpdate) {
      const newImage: GalleryImage = {
        id: `img-${Date.now()}`,
        src: '/images/placeholders/gallery-image.jpg',
        alt: 'New gallery image',
      };
      onUpdate({ images: [...images, newImage] });
    }
  };
  
  // Get layout class based on the selected layout
  const getLayoutClass = () => {
    switch (layout) {
      case 'carousel':
        return 'flex overflow-x-auto snap-x';
      case 'masonry':
        return 'columns-1 sm:columns-2 lg:columns-3';
      case 'grid':
      default:
        return `grid grid-cols-1 sm:grid-cols-2 ${
          columns === 2 ? 'lg:grid-cols-2' : columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
        } gap-4`;
    }
  };
  
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        {content.title && (
          <div className="text-center mb-6">
            {isEditing && isEditingTitle ? (
              <input
                type="text"
                value={content.title}
                onChange={handleTitleChange}
                onBlur={() => setIsEditingTitle(false)}
                className="w-full text-3xl font-bold text-center bg-transparent border border-secondary-200 px-2 py-1 focus:outline-none focus:border-primary-500"
                style={{ fontFamily: settings.fonts.heading }}
                autoFocus
              />
            ) : (
              <h2 
                className="text-3xl font-bold" 
                style={{ 
                  fontFamily: settings.fonts.heading,
                  color: settings.colors.text
                }}
                onClick={isEditing ? () => setIsEditingTitle(true) : undefined}
              >
                {content.title}
              </h2>
            )}
          </div>
        )}
        
        {/* Description */}
        {content.description && (
          <div className="text-center mb-8">
            {isEditing && isEditingDescription ? (
              <textarea
                value={content.description}
                onChange={handleDescriptionChange}
                onBlur={() => setIsEditingDescription(false)}
                className="w-full max-w-2xl mx-auto text-lg text-secondary-600 bg-transparent border border-secondary-200 px-2 py-1 focus:outline-none focus:border-primary-500"
                style={{ fontFamily: settings.fonts.body }}
                rows={3}
                autoFocus
              />
            ) : (
              <p 
                className="max-w-2xl mx-auto text-lg text-secondary-600" 
                style={{ 
                  fontFamily: settings.fonts.body,
                  color: `${settings.colors.text}cc`
                }}
                onClick={isEditing ? () => setIsEditingDescription(true) : undefined}
              >
                {content.description}
              </p>
            )}
          </div>
        )}
        
        {/* Gallery */}
        <div className={getLayoutClass()}>
          {images.map((image, index) => (
            <div 
              key={image.id} 
              className={`
                relative group
                ${layout === 'carousel' ? 'w-80 flex-shrink-0 snap-center mx-2' : ''}
                ${layout === 'masonry' ? 'mb-4 break-inside-avoid' : ''}
              `}
            >
              <div className="relative overflow-hidden rounded shadow-md" style={{ borderRadius: settings.globalStyles?.borderRadius }}>
                <div className="aspect-w-4 aspect-h-3">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {image.caption && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm"
                    style={{ fontFamily: settings.fonts.body }}
                  >
                    {image.caption}
                  </div>
                )}
                
                {/* Edit overlay */}
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="space-x-2">
                      <button
                        type="button"
                        className="bg-white text-secondary-800 rounded-full h-10 w-10 flex items-center justify-center hover:bg-secondary-100"
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="bg-white text-error-600 rounded-full h-10 w-10 flex items-center justify-center hover:bg-error-50"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Add image button (when editing) */}
          {isEditing && (
            <div className={layout === 'grid' ? 'flex items-center justify-center' : ''}>
              <button
                type="button"
                className="h-full min-h-[12rem] w-full border-2 border-dashed border-secondary-300 rounded flex items-center justify-center text-secondary-400 hover:text-secondary-500 hover:border-secondary-400 transition-colors"
                onClick={handleAddImage}
              >
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="mt-2 block text-sm font-medium">Add Image</span>
                </div>
              </button>
            </div>
          )}
        </div>
        
        {/* Layout controls (when editing) */}
        {isEditing && (
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-secondary-700">Layout:</span>
              <select
                value={layout}
                onChange={(e) => onUpdate?.({ layout: e.target.value as 'grid' | 'carousel' | 'masonry' })}
                className="border border-secondary-300 rounded px-2 py-1 text-sm"
              >
                <option value="grid">Grid</option>
                <option value="carousel">Carousel</option>
                <option value="masonry">Masonry</option>
              </select>
            </div>
            
            {layout === 'grid' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-secondary-700">Columns:</span>
                <select
                  value={columns}
                  onChange={(e) => onUpdate?.({ columns: Number(e.target.value) as 2 | 3 | 4 })}
                  className="border border-secondary-300 rounded px-2 py-1 text-sm"
                >
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
