'use client';

import React, { useState, useEffect } from 'react';
import { AIPromptInput, AIContentEditor } from '@/components/ai';
import { aiService } from '@/lib/ai-service';
import { AIContentPrompt, AIContentResult, AIContentType } from '@/components/ai/types';
import { toast } from 'react-toastify';

interface AIContentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  elementId: string | null;
  elementType: string | null;
  currentContent: any;
  onApplyContent: (elementId: string, updates: any) => void;
}

export function AIContentSidebar({
  isOpen,
  onClose,
  elementId,
  elementType,
  currentContent,
  onApplyContent,
}: AIContentSidebarProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<AIContentResult | null>(null);
  const [contentType, setContentType] = useState<AIContentType>('headline');
  const [selectedContent, setSelectedContent] = useState<string>('');

  // Reset state when element changes
  useEffect(() => {
    if (elementId) {
      setPrompt('');
      setGeneratedResult(null);
      setSelectedContent('');
      
      // Set appropriate content type based on element type
      if (elementType) {
        switch (elementType) {
          case 'hero':
            setContentType('headline');
            break;
          case 'text':
            setContentType('paragraph');
            break;
          case 'features':
            setContentType('features');
            break;
          case 'testimonials':
            setContentType('testimonial');
            break;
          case 'cta':
            setContentType('cta');
            break;
          default:
            setContentType('paragraph');
        }
      }
    }
  }, [elementId, elementType]);

  // Generate content with AI
  const handleGenerateContent = async () => {
    if (!prompt || !elementId || !elementType) return;
    
    setIsGenerating(true);
    
    try {
      const result = await aiService.generateContent({
        prompt,
        type: contentType,
        context: {
          elementType,
          ...currentContent
        }
      });
      
      setGeneratedResult(result);
      setSelectedContent(result.content);
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply the selected content to the element
  const handleApplyContent = () => {
    if (!elementId || !selectedContent) return;
    
    const contentUpdate = mapContentToElement(selectedContent, elementType, contentType);
    onApplyContent(elementId, contentUpdate);
    toast.success('AI content applied successfully');
  };

  // Map the generated content to the element's content structure
  const mapContentToElement = (content: string, elementType: string | null, contentType: AIContentType): any => {
    if (!elementType) return {};
    
    switch (elementType) {
      case 'hero':
        return contentType === 'headline' 
          ? { headline: content } 
          : { subheadline: content };
        
      case 'text':
        return contentType === 'headline'
          ? { headline: content }
          : { content: `<p>${content}</p>` };
        
      case 'features':
        if (contentType === 'headline') return { headline: content };
        if (contentType === 'features') {
          // Parse features from the content
          const features = content.split(',').map(feature => ({
            title: feature.trim(),
            description: `Description for ${feature.trim()}`,
            icon: 'star'
          }));
          return { features };
        }
        return { subheadline: content };
        
      case 'testimonials':
        if (contentType === 'testimonial') {
          return { 
            testimonials: [
              {
                quote: content,
                author: 'Happy Customer',
                role: 'Customer'
              }
            ]
          };
        }
        return { headline: content };
        
      case 'cta':
        return contentType === 'cta' 
          ? { ctaText: content } 
          : { headline: content };
        
      default:
        return { content };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 border-l border-secondary-200 h-full bg-white overflow-auto">
      <div className="p-4 border-b border-secondary-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-secondary-900">AI Content Assistant</h3>
          <button
            type="button"
            className="h-8 w-8 rounded-md text-secondary-500 hover:bg-secondary-100 flex items-center justify-center"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as AIContentType)}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="headline">Headline</option>
            <option value="paragraph">Paragraph</option>
            <option value="tagline">Tagline</option>
            <option value="cta">Call to Action</option>
            <option value="features">Features List</option>
            <option value="testimonial">Testimonial</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Tell the AI what to generate
          </label>
          <div className="mb-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              placeholder={`What would you like to generate for this ${elementType || 'element'}?`}
            />
          </div>
          <button
            onClick={handleGenerateContent}
            disabled={isGenerating || !prompt}
            className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
        
        {generatedResult && (
          <div className="border border-secondary-200 rounded-md p-4 mt-6">
            <h4 className="text-sm font-semibold text-secondary-900 mb-2">Generated Content</h4>
            <div className="mb-4">
              <div
                className="p-3 bg-secondary-50 rounded-md text-secondary-900 mb-4"
              >
                {generatedResult.content}
              </div>
              
              {generatedResult.alternativeContents && generatedResult.alternativeContents.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-secondary-700 mb-2">Alternatives</h5>
                  <div className="space-y-2">
                    {generatedResult.alternativeContents.map((alt, index) => (
                      <div 
                        key={index}
                        className="p-2 border border-secondary-200 rounded-md cursor-pointer hover:bg-secondary-50"
                        onClick={() => setSelectedContent(alt)}
                      >
                        {alt}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleApplyContent}
              className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Apply to Element
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
