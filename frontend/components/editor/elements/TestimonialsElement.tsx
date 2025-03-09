'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

interface TestimonialsContent {
  title?: string;
  subtitle?: string;
  testimonials: Testimonial[];
  layout: 'grid' | 'slider' | 'cards';
  showRatings?: boolean;
  showAvatars?: boolean;
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

interface TestimonialsElementProps {
  content: TestimonialsContent;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<TestimonialsContent>) => void;
}

export function TestimonialsElement({ content, settings, isEditing = false, onUpdate }: TestimonialsElementProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  
  // Default values
  const testimonials = content.testimonials || [];
  const layout = content.layout || 'grid';
  const showRatings = content.showRatings ?? true;
  const showAvatars = content.showAvatars ?? true;
  
  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ title: e.target.value });
    }
  };
  
  // Handle subtitle change
  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ subtitle: e.target.value });
    }
  };
  
  // Handle testimonial text change
  const handleTestimonialChange = (id: string, field: keyof Testimonial, value: string | number) => {
    if (onUpdate) {
      const updatedTestimonials = testimonials.map(testimonial => 
        testimonial.id === id ? { ...testimonial, [field]: value } : testimonial
      );
      onUpdate({ testimonials: updatedTestimonials });
    }
  };
  
  // Handle adding a new testimonial
  const handleAddTestimonial = () => {
    if (onUpdate) {
      const newTestimonial: Testimonial = {
        id: `testimonial-${Date.now()}`,
        quote: 'This product has completely transformed how we work. Highly recommended!',
        author: 'Jane Doe',
        role: 'CEO',
        company: 'Example Inc.',
        rating: 5
      };
      onUpdate({ testimonials: [...testimonials, newTestimonial] });
    }
  };
  
  // Handle removing a testimonial
  const handleRemoveTestimonial = (id: string) => {
    if (onUpdate) {
      const updatedTestimonials = testimonials.filter(testimonial => testimonial.id !== id);
      onUpdate({ testimonials: updatedTestimonials });
    }
  };
  
  // Render star rating
  const renderRating = (rating: number = 5) => {
    return (
      <div className="flex space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${i <= rating ? 'text-yellow-400' : 'text-secondary-300'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };
  
  // Get layout classes
  const getLayoutClass = () => {
    switch (layout) {
      case 'slider':
        return 'flex overflow-x-auto gap-6 snap-x pb-6';
      case 'cards':
        return 'grid grid-cols-1 gap-8 md:grid-cols-3';
      case 'grid':
      default:
        return 'grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3';
    }
  };
  
  // Get testimonial item class
  const getTestimonialItemClass = () => {
    switch (layout) {
      case 'slider':
        return 'flex-shrink-0 w-full md:w-96 snap-center';
      case 'cards':
      case 'grid':
      default:
        return '';
    }
  };
  
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          {/* Title */}
          {content.title && (
            isEditing && isEditingTitle ? (
              <input
                type="text"
                value={content.title}
                onChange={handleTitleChange}
                onBlur={() => setIsEditingTitle(false)}
                className="w-full max-w-3xl mx-auto text-3xl font-bold text-center bg-transparent border border-secondary-200 px-2 py-1 focus:outline-none focus:border-primary-500"
                style={{ fontFamily: settings.fonts.heading }}
                autoFocus
              />
            ) : (
              <h2 
                className="text-3xl font-bold mb-4" 
                style={{ 
                  fontFamily: settings.fonts.heading,
                  color: settings.colors.text
                }}
                onClick={isEditing ? () => setIsEditingTitle(true) : undefined}
              >
                {content.title}
              </h2>
            )
          )}
          
          {/* Subtitle */}
          {content.subtitle && (
            isEditing && isEditingSubtitle ? (
              <input
                type="text"
                value={content.subtitle}
                onChange={handleSubtitleChange}
                onBlur={() => setIsEditingSubtitle(false)}
                className="w-full max-w-2xl mx-auto text-lg text-center bg-transparent border border-secondary-200 px-2 py-1 focus:outline-none focus:border-primary-500"
                style={{ fontFamily: settings.fonts.body }}
                autoFocus
              />
            ) : (
              <p 
                className="max-w-2xl mx-auto text-lg text-secondary-600" 
                style={{ 
                  fontFamily: settings.fonts.body,
                  color: `${settings.colors.text}cc`
                }}
                onClick={isEditing ? () => setIsEditingSubtitle(true) : undefined}
              >
                {content.subtitle}
              </p>
            )
          )}
        </div>
        
        {/* Testimonials */}
        <div className={getLayoutClass()}>
          {testimonials.map(testimonial => (
            <div 
              key={testimonial.id} 
              className={`${getTestimonialItemClass()} relative p-6 bg-white rounded-lg border border-secondary-200 shadow-sm hover:shadow-md transition-shadow`}
              style={{ borderRadius: settings.globalStyles?.borderRadius }}
            >
              {/* Rating */}
              {showRatings && testimonial.rating && (
                <div className="mb-4">
                  {renderRating(testimonial.rating)}
                </div>
              )}
              
              {/* Quote */}
              {isEditing && editingTestimonialId === testimonial.id ? (
                <textarea
                  value={testimonial.quote}
                  onChange={(e) => handleTestimonialChange(testimonial.id, 'quote', e.target.value)}
                  onBlur={() => setEditingTestimonialId(null)}
                  className="w-full min-h-[100px] text-lg italic bg-transparent border border-secondary-200 px-2 py-1 focus:outline-none focus:border-primary-500 mb-4"
                  style={{ fontFamily: settings.fonts.body }}
                  autoFocus
                />
              ) : (
                <p 
                  className="text-lg italic mb-4" 
                  style={{ 
                    fontFamily: settings.fonts.body,
                    color: settings.colors.text
                  }}
                  onClick={isEditing ? () => setEditingTestimonialId(testimonial.id) : undefined}
                >
                  "{testimonial.quote}"
                </p>
              )}
              
              <div className="flex items-center mt-4">
                {/* Avatar */}
                {showAvatars && (
                  <div className="flex-shrink-0 mr-4">
                    {testimonial.avatar ? (
                      <div className="h-12 w-12 rounded-full overflow-hidden relative">
                        <Image 
                          src={testimonial.avatar} 
                          alt={testimonial.author} 
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div 
                        className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-medium"
                        style={{ backgroundColor: settings.colors.primary }}
                      >
                        {testimonial.author.charAt(0)}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Author info */}
                <div>
                  {isEditing && editingTestimonialId === `${testimonial.id}-author` ? (
                    <input
                      type="text"
                      value={testimonial.author}
                      onChange={(e) => handleTestimonialChange(testimonial.id, 'author', e.target.value)}
                      onBlur={() => setEditingTestimonialId(null)}
                      className="w-full font-medium bg-transparent border border-secondary-200 px-2 py-1 focus:outline-none focus:border-primary-500"
                      style={{ fontFamily: settings.fonts.body }}
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="font-medium" 
                      style={{ 
                        fontFamily: settings.fonts.body,
                        color: settings.colors.text
                      }}
                      onClick={isEditing ? () => setEditingTestimonialId(`${testimonial.id}-author`) : undefined}
                    >
                      {testimonial.author}
                    </p>
                  )}
                  
                  {(testimonial.role || testimonial.company) && (
                    isEditing && editingTestimonialId === `${testimonial.id}-role` ? (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={testimonial.role || ''}
                          placeholder="Role"
                          onChange={(e) => handleTestimonialChange(testimonial.id, 'role', e.target.value)}
                          className="w-1/2 text-sm text-secondary-600 bg-transparent border border-secondary-200 px-2 py-1 focus:outline-none focus:border-primary-500"
                          style={{ fontFamily: settings.fonts.body }}
                        />
                        <input
                          type="text"
                          value={testimonial.company || ''}
                          placeholder="Company"
                          onChange={(e) => handleTestimonialChange(testimonial.id, 'company', e.target.value)}
                          className="w-1/2 text-sm text-secondary-600 bg-transparent border border-secondary-200 px-2 py-1 focus:outline-none focus:border-primary-500"
                          style={{ fontFamily: settings.fonts.body }}
                          onBlur={() => setEditingTestimonialId(null)}
                        />
                      </div>
                    ) : (
                      <p 
                        className="text-sm text-secondary-600" 
                        style={{ 
                          fontFamily: settings.fonts.body,
                          color: `${settings.colors.text}99`
                        }}
                        onClick={isEditing ? () => setEditingTestimonialId(`${testimonial.id}-role`) : undefined}
                      >
                        {testimonial.role}
                        {testimonial.role && testimonial.company && ', '}
                        {testimonial.company}
                      </p>
                    )
                  )}
                </div>
                
                {/* Edit/Remove buttons */}
                {isEditing && (
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center hover:bg-secondary-200"
                      onClick={() => setEditingTestimonialId(testimonial.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full bg-secondary-100 text-error-600 flex items-center justify-center hover:bg-error-50"
                      onClick={() => handleRemoveTestimonial(testimonial.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Add testimonial button (when editing) */}
          {isEditing && (
            <div className={`${getTestimonialItemClass()} p-6 rounded-lg border-2 border-dashed border-secondary-300`}>
              <button
                type="button"
                className="w-full h-full min-h-[150px] flex flex-col items-center justify-center text-secondary-400 hover:text-secondary-600"
                onClick={handleAddTestimonial}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="mt-2 text-sm font-medium">Add Testimonial</span>
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
                onChange={(e) => onUpdate?.({ layout: e.target.value as 'grid' | 'slider' | 'cards' })}
                className="border border-secondary-300 rounded px-2 py-1 text-sm"
              >
                <option value="grid">Grid</option>
                <option value="slider">Slider</option>
                <option value="cards">Cards</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-secondary-700">Show Ratings:</span>
              <input
                type="checkbox"
                checked={showRatings}
                onChange={(e) => onUpdate?.({ showRatings: e.target.checked })}
                className="h-4 w-4 text-primary-600"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-secondary-700">Show Avatars:</span>
              <input
                type="checkbox"
                checked={showAvatars}
                onChange={(e) => onUpdate?.({ showAvatars: e.target.checked })}
                className="h-4 w-4 text-primary-600"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}