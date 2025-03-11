'use client';

import React, { useState } from 'react';

interface CustomHtmlContent {
  title?: string;
  html: string;
  css?: string;
  wrapWithContainer?: boolean;
  scriptEnabled?: boolean;
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

interface CustomHtmlElementProps {
  content: CustomHtmlContent;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<CustomHtmlContent>) => void;
}

export function CustomHtmlElement({ 
  content, 
  settings, 
  isEditing = false, 
  onUpdate 
}: CustomHtmlElementProps) {
  const [isEditingHtml, setIsEditingHtml] = useState(false);
  const [isEditingCss, setIsEditingCss] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  
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
        return '';
    }
  };
  
  // Handle text changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ title: e.target.value });
    }
  };
  
  // Handle HTML changes
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdate) {
      onUpdate({ html: e.target.value });
    }
  };
  
  // Handle CSS changes
  const handleCssChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdate) {
      onUpdate({ css: e.target.value });
    }
  };
  
  // Toggle wrap with container
  const handleWrapToggle = () => {
    if (onUpdate) {
      onUpdate({ wrapWithContainer: !content.wrapWithContainer });
    }
  };
  
  // Toggle script enabled
  const handleScriptToggle = () => {
    if (onUpdate) {
      onUpdate({ scriptEnabled: !content.scriptEnabled });
    }
  };
  
  // Handle alignment change
  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    if (onUpdate) {
      onUpdate({ alignment });
    }
  };
  
  // Render HTML content
  const renderHtml = () => {
    let htmlContent = content.html;
    
    // Add CSS if provided
    if (content.css) {
      htmlContent = `<style>${content.css}</style>${htmlContent}`;
    }
    
    return { __html: htmlContent };
  };
  
  return (
    <div className={content.wrapWithContainer ? "py-12 px-4 sm:px-6 lg:px-8" : ""} style={content.wrapWithContainer ? { backgroundColor: settings.colors.background } : {}}>
      <div className={content.wrapWithContainer ? `max-w-7xl mx-auto ${getAlignmentClass()}` : getAlignmentClass()}>
        {/* Title (only when editing or when a title is provided) */}
        {(isEditing || content.title) && (
          <div className="mb-6">
            {isEditing && editingField === 'title' ? (
              <input
                type="text"
                value={content.title || ''}
                onChange={handleTitleChange}
                onBlur={() => setEditingField(null)}
                className="w-full text-xl font-bold text-secondary-900 bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                style={{ 
                  color: settings.colors.text,
                  fontFamily: settings.fonts.heading
                }}
                autoFocus
                placeholder="Custom HTML Element Title (optional)"
              />
            ) : (
              <h3 
                className="text-xl font-bold text-secondary-900" 
                onClick={isEditing ? () => setEditingField('title') : undefined}
                style={{ 
                  color: settings.colors.text,
                  fontFamily: settings.fonts.heading
                }}
              >
                {content.title || (isEditing ? 'Custom HTML Element' : '')}
              </h3>
            )}
          </div>
        )}
        
        {/* HTML Editor (only in editing mode) */}
        {isEditing && isEditingHtml ? (
          <div className="border border-secondary-300 rounded-md overflow-hidden mb-4">
            <div className="bg-secondary-100 px-4 py-2 flex justify-between items-center">
              <span className="font-medium text-secondary-700">Edit HTML</span>
              <button 
                type="button"
                className="text-secondary-600 hover:text-secondary-900"
                onClick={() => setIsEditingHtml(false)}
              >
                Done
              </button>
            </div>
            <textarea
              value={content.html}
              onChange={handleHtmlChange}
              className="w-full min-h-[300px] p-4 font-mono text-sm border-0 focus:outline-none focus:ring-0"
              spellCheck={false}
              placeholder="Enter your custom HTML here..."
            />
          </div>
        ) : isEditing && isEditingCss ? (
          <div className="border border-secondary-300 rounded-md overflow-hidden mb-4">
            <div className="bg-secondary-100 px-4 py-2 flex justify-between items-center">
              <span className="font-medium text-secondary-700">Edit CSS</span>
              <button 
                type="button"
                className="text-secondary-600 hover:text-secondary-900"
                onClick={() => setIsEditingCss(false)}
              >
                Done
              </button>
            </div>
            <textarea
              value={content.css || ''}
              onChange={handleCssChange}
              className="w-full min-h-[300px] p-4 font-mono text-sm border-0 focus:outline-none focus:ring-0"
              spellCheck={false}
              placeholder="Enter your custom CSS here..."
            />
          </div>
        ) : (
          <>
            {/* Controls (only in editing mode) */}
            {isEditing && (
              <div className="mb-4 space-y-3 p-4 border border-secondary-300 rounded-md bg-secondary-50">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white"
                    style={{ backgroundColor: settings.colors.primary }}
                    onClick={() => setIsEditingHtml(true)}
                  >
                    Edit HTML
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white"
                    style={{ backgroundColor: settings.colors.primary }}
                    onClick={() => setIsEditingCss(true)}
                  >
                    Edit CSS
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      checked={content.wrapWithContainer || false}
                      onChange={handleWrapToggle}
                    />
                    <span className="ml-2">Wrap with container</span>
                  </label>
                  
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      checked={content.scriptEnabled || false}
                      onChange={handleScriptToggle}
                    />
                    <span className="ml-2">Enable scripts (caution)</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Alignment:</span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      className={`p-1.5 rounded ${content.alignment === 'left' ? 'bg-primary-100 text-primary-700' : 'text-secondary-500 hover:bg-secondary-100'}`}
                      onClick={() => handleAlignmentChange('left')}
                      title="Align left"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 rounded ${content.alignment === 'center' ? 'bg-primary-100 text-primary-700' : 'text-secondary-500 hover:bg-secondary-100'}`}
                      onClick={() => handleAlignmentChange('center')}
                      title="Align center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8M4 18h16" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 rounded ${content.alignment === 'right' ? 'bg-primary-100 text-primary-700' : 'text-secondary-500 hover:bg-secondary-100'}`}
                      onClick={() => handleAlignmentChange('right')}
                      title="Align right"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-secondary-500 mt-2">
                  <p>Warning: Custom HTML can affect page layout and styling. Test thoroughly before publishing.</p>
                  {content.scriptEnabled && (
                    <p className="mt-1 text-amber-600">
                      <strong>Caution:</strong> Scripts are enabled. Only include trusted code to prevent security issues.
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Render the HTML content */}
            <div 
              dangerouslySetInnerHTML={renderHtml()} 
              className={isEditing ? 'border border-dashed border-secondary-300 p-4 rounded-md min-h-[100px]' : ''}
            />
          </>
        )}
      </div>
    </div>
  );
}