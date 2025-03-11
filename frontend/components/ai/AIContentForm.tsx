'use client';

import React, { useState, useEffect } from 'react';
import { AIContentFormProps, AIContentPrompt, AIContentType } from './types';
import { AIPromptInput } from './AIPromptInput';

/**
 * Form component for generating AI content
 */
export function AIContentForm({
  onSubmit,
  isLoading,
  elementType,
  defaultContextData,
}: AIContentFormProps) {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<AIContentType>('paragraph');
  const [promptSuggestion, setPromptSuggestion] = useState('');

  // Update prompt suggestion when element type changes
  useEffect(() => {
    if (elementType) {
      setPromptSuggestion(getPromptSuggestion(elementType));
      setContentType(getContentTypeFromElement(elementType));
    }
  }, [elementType]);

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) return;

    const promptData: AIContentPrompt = {
      prompt: prompt.trim(),
      type: contentType,
      context: defaultContextData,
    };

    onSubmit(promptData).then(() => {
      // Clear form after successful submission
      setPrompt('');
    });
  };

  const handleSuggestionClick = () => {
    setPrompt(promptSuggestion);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Content Type</label>
        </div>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value as AIContentType)}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
        >
          <option value="headline">Headline</option>
          <option value="paragraph">Paragraph</option>
          <option value="tagline">Tagline / Slogan</option>
          <option value="cta">Call to Action</option>
          <option value="features">Feature List</option>
          <option value="testimonial">Testimonial</option>
          <option value="product">Product Description</option>
          <option value="service">Service Description</option>
          <option value="bio">Biography / About</option>
          <option value="faq">FAQ</option>
          <option value="seo-title">SEO Title</option>
          <option value="seo-description">SEO Description</option>
          <option value="seo-keywords">SEO Keywords</option>
        </select>
      </div>

      {promptSuggestion && (
        <div className="rounded-md bg-primary-50 p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-primary-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-primary-700">
                Try: &quot;{promptSuggestion}&quot;
                <button
                  onClick={handleSuggestionClick}
                  className="ml-2 font-medium text-primary-700 underline"
                >
                  Use this
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <AIPromptInput
        value={prompt}
        onChange={setPrompt}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder={`Enter your prompt for ${contentType.replace('-', ' ')}...`}
      />
    </div>
  );
}

// Helper function to get prompt suggestion based on element type
function getPromptSuggestion(elementType: string): string {
  switch (elementType) {
    case 'hero':
      return 'Write a compelling headline and subheading for a website builder platform';
    case 'text':
      return 'Write a paragraph about how AI can boost productivity';
    case 'features':
      return 'Create a list of 3 key features for a website builder';
    case 'cta':
      return 'Create a persuasive call to action for a free trial';
    case 'testimonials':
      return 'Generate a realistic customer testimonial for a web design platform';
    case 'pricing':
      return 'Write compelling descriptions for Basic, Pro, and Enterprise plans';
    case 'contact':
      return 'Create a friendly welcome message for a contact form';
    default:
      return 'Describe what you want the AI to generate...';
  }
}

// Helper function to map element type to content type
function getContentTypeFromElement(elementType: string): AIContentType {
  switch (elementType) {
    case 'hero':
      return 'headline';
    case 'text':
      return 'paragraph';
    case 'features':
      return 'features';
    case 'cta':
      return 'cta';
    case 'testimonials':
      return 'testimonial';
    case 'pricing':
      return 'product';
    case 'contact':
      return 'paragraph';
    default:
      return 'paragraph';
  }
}
