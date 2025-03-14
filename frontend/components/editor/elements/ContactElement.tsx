'use client';

import React, { useState } from 'react';

interface ContactField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'tel' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select fields
}

interface ContactContent {
  headline?: string;
  subheadline?: string;
  fields: ContactField[];
  submitButtonText: string;
  successMessage?: string;
  showSocialLinks?: boolean;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
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

interface ContactElementProps {
  content: ContactContent;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<ContactContent>) => void;
  onUpdateField?: (fieldId: string, updates: Partial<ContactField>) => void;
}

export default function ContactElement(props: ContactElementProps) {
  const { content, settings, isEditing = false, onUpdate, onUpdateField } = props;
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  
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
  
  // Handle text changes
  const handleTextChange = (field: string, value: string) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  };
  
  // Handle field updates
  const handleFieldUpdate = (fieldId: string, property: string, value: any) => {
    if (onUpdateField) {
      onUpdateField(fieldId, { [property]: value });
    }
  };
  
  // Handle contact info changes
  const handleContactInfoChange = (property: string, value: string) => {
    if (onUpdate && content.contactInfo) {
      onUpdate({
        contactInfo: {
          ...content.contactInfo,
          [property]: value
        }
      });
    }
  };
  
  // Handle social link changes
  const handleSocialLinkChange = (platform: string, value: string) => {
    if (onUpdate && content.socialLinks) {
      onUpdate({
        socialLinks: {
          ...content.socialLinks,
          [platform]: value
        }
      });
    }
  };
  
  // Determine border radius from settings
  const borderRadius = settings.globalStyles?.borderRadius || '0.5rem';
  
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: settings.colors.background }}>
      <div className={`max-w-7xl mx-auto ${getAlignmentClass()}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form Column */}
          <div className="space-y-8">
            {/* Headline */}
            {isEditing && editingField === 'headline' ? (
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => handleTextChange('headline', e.target.value)}
                onBlur={() => setEditingField(null)}
                className="w-full text-3xl font-bold bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                style={{ color: settings.colors.text, fontFamily: settings.fonts.heading }}
                autoFocus
              />
            ) : (
              <h2 
                className="text-3xl font-bold" 
                onClick={isEditing ? () => setEditingField('headline') : undefined}
                style={{ color: settings.colors.text, fontFamily: settings.fonts.heading }}
              >
                {content.headline || 'Get in Touch'}
              </h2>
            )}
            
            {/* Subheadline */}
            {isEditing && editingField === 'subheadline' ? (
              <input
                type="text"
                value={content.subheadline || ''}
                onChange={(e) => handleTextChange('subheadline', e.target.value)}
                onBlur={() => setEditingField(null)}
                className="w-full text-lg bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                autoFocus
              />
            ) : (
              <p 
                className="text-lg"
                onClick={isEditing ? () => setEditingField('subheadline') : undefined}
                style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
              >
                {content.subheadline || 'We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.'}
              </p>
            )}
            
            {/* Contact Form */}
            <form className="space-y-6 mt-8">
              {content.fields.map((field) => (
                <div key={field.id} className="w-full">
                  {/* Field Label */}
                  {isEditing && editingFieldId === field.id && editingField === 'label' ? (
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleFieldUpdate(field.id, 'label', e.target.value)}
                      onBlur={() => {
                        setEditingFieldId(null);
                        setEditingField(null);
                      }}
                      className="w-full text-sm font-medium bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500 mb-1"
                      style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                      autoFocus
                    />
                  ) : (
                    <label 
                      className="block text-sm font-medium mb-1"
                      onClick={isEditing ? () => {
                        setEditingFieldId(field.id);
                        setEditingField('label');
                      } : undefined}
                      style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                    >
                      {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  
                  {/* Field Input */}
                  {field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      placeholder={isEditing && editingFieldId === field.id && editingField === 'placeholder' ? '' : field.placeholder}
                      required={field.required}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-md text-secondary-900 bg-white"
                      style={{ 
                        borderColor: settings.colors.secondary,
                        fontFamily: settings.fonts.body,
                        borderRadius
                      }}
                      onClick={isEditing ? () => {
                        setEditingFieldId(field.id);
                        setEditingField('placeholder');
                      } : undefined}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      name={field.name}
                      required={field.required}
                      className="w-full px-3 py-2 border rounded-md text-secondary-900 bg-white"
                      style={{ 
                        borderColor: settings.colors.secondary,
                        fontFamily: settings.fonts.body,
                        borderRadius
                      }}
                    >
                      <option value="">{field.placeholder || 'Select an option'}</option>
                      {field.options?.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      placeholder={isEditing && editingFieldId === field.id && editingField === 'placeholder' ? '' : field.placeholder}
                      required={field.required}
                      className="w-full px-3 py-2 border rounded-md text-secondary-900 bg-white"
                      style={{ 
                        borderColor: settings.colors.secondary,
                        fontFamily: settings.fonts.body,
                        borderRadius
                      }}
                      onClick={isEditing ? () => {
                        setEditingFieldId(field.id);
                        setEditingField('placeholder');
                      } : undefined}
                    />
                  )}
                  
                  {/* Placeholder Editor (shown only in editing mode) */}
                  {isEditing && editingFieldId === field.id && editingField === 'placeholder' && (
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => handleFieldUpdate(field.id, 'placeholder', e.target.value)}
                      onBlur={() => {
                        setEditingFieldId(null);
                        setEditingField(null);
                      }}
                      className="w-full mt-1 text-sm bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                      style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                      autoFocus
                      placeholder="Enter placeholder text"
                    />
                  )}
                </div>
              ))}
              
              {/* Submit Button */}
              {isEditing && editingField === 'submitButtonText' ? (
                <input
                  type="text"
                  value={content.submitButtonText}
                  onChange={(e) => handleTextChange('submitButtonText', e.target.value)}
                  onBlur={() => setEditingField(null)}
                  className="w-full text-sm font-medium bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                  style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                  autoFocus
                />
              ) : (
                <button 
                  type="button" // Changed from submit to prevent form submission in editing mode
                  className="px-6 py-3 font-medium rounded-md text-white"
                  style={{ 
                    backgroundColor: settings.colors.primary,
                    fontFamily: settings.fonts.body,
                    borderRadius
                  }}
                  onClick={isEditing ? () => setEditingField('submitButtonText') : undefined}
                >
                  {content.submitButtonText || 'Send Message'}
                </button>
              )}
            </form>
          </div>
          
          {/* Contact Information Column */}
          <div className="space-y-8">
            {/* Contact Info */}
            {content.contactInfo && (
              <div className="space-y-4">
                <h3 
                  className="text-xl font-semibold mb-4"
                  style={{ color: settings.colors.text, fontFamily: settings.fonts.heading }}
                >
                  Contact Information
                </h3>
                
                {content.contactInfo.email && (
                  <div className="flex items-start">
                    <svg className="h-6 w-6 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: settings.colors.primary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {isEditing && editingField === 'email' ? (
                      <input
                        type="text"
                        value={content.contactInfo.email}
                        onChange={(e) => handleContactInfoChange('email', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        className="ml-3 w-full bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                        style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="ml-3 text-base"
                        onClick={isEditing ? () => setEditingField('email') : undefined}
                        style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                      >
                        {content.contactInfo.email}
                      </span>
                    )}
                  </div>
                )}
                
                {content.contactInfo.phone && (
                  <div className="flex items-start">
                    <svg className="h-6 w-6 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: settings.colors.primary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {isEditing && editingField === 'phone' ? (
                      <input
                        type="text"
                        value={content.contactInfo.phone}
                        onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        className="ml-3 w-full bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                        style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="ml-3 text-base"
                        onClick={isEditing ? () => setEditingField('phone') : undefined}
                        style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                      >
                        {content.contactInfo.phone}
                      </span>
                    )}
                  </div>
                )}
                
                {content.contactInfo.address && (
                  <div className="flex items-start">
                    <svg className="h-6 w-6 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: settings.colors.primary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {isEditing && editingField === 'address' ? (
                      <textarea
                        value={content.contactInfo.address}
                        onChange={(e) => handleContactInfoChange('address', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        className="ml-3 w-full bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                        style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="ml-3 text-base whitespace-pre-line"
                        onClick={isEditing ? () => setEditingField('address') : undefined}
                        style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                      >
                        {content.contactInfo.address}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Social Links */}
            {content.showSocialLinks && content.socialLinks && (
              <div className="mt-8">
                <h3 
                  className="text-xl font-semibold mb-4"
                  style={{ color: settings.colors.text, fontFamily: settings.fonts.heading }}
                >
                  Follow Us
                </h3>
                <div className="flex space-x-4">
                  {content.socialLinks.twitter && (
                    <a 
                      href={content.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: settings.colors.primary, color: 'white' }}
                      onClick={isEditing ? (e) => {
                        e.preventDefault();
                        setEditingField('twitter');
                      } : undefined}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                  )}
                  
                  {content.socialLinks.facebook && (
                    <a 
                      href={content.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: settings.colors.primary, color: 'white' }}
                      onClick={isEditing ? (e) => {
                        e.preventDefault();
                        setEditingField('facebook');
                      } : undefined}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}