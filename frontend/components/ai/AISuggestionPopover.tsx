'use client';

import React, { useState, useEffect } from 'react';
import { Popover } from '@headlessui/react';
import { AIContentPrompt, AISuggestion, AIContentType } from './types';
import { AIPromptInput } from './AIPromptInput';
import { AIContentForm } from './AIContentForm';
import { AIAssistantButton } from './AIAssistantButton';
import { aiService } from '@/lib/ai-service';

interface AISuggestionPopoverProps {
  elementType: string;
  onApplySuggestion: (content: string, field: string) => void;
  contextData?: Record<string, any>;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Popover component for AI content suggestions
 */
export function AISuggestionPopover({
  elementType,
  onApplySuggestion,
  contextData = {},
  position = 'top',
}: AISuggestionPopoverProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Fetch quick suggestions when element type changes
  useEffect(() => {
    if (elementType) {
      loadQuickSuggestions();
    }
  }, [elementType]);

  const loadQuickSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const suggestions = await aiService.getSuggestions(elementType, contextData);
      setQuickSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setQuickSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleGenerateContent = async (promptData: AIContentPrompt) => {
    setIsGenerating(true);
    try {
      const result = await aiService.generateContent(promptData);
      // Determine which field to update based on content type
      const field = getFieldFromContentType(promptData.type);
      onApplySuggestion(result.content, field);
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AISuggestion) => {
    const field = getFieldFromContentType(suggestion.type);
    onApplySuggestion(suggestion.content, field);
  };

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button as="div">
            <AIAssistantButton
              isActive={open}
              tooltipText="AI Content Assistant"
              onClick={() => {}} // This is handled by Popover
            />
          </Popover.Button>

          <Popover.Panel
            className={`absolute z-10 w-96 rounded-md bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 ${
              position === 'top' ? 'bottom-full mb-2' : 
              position === 'right' ? 'left-full ml-2' :
              position === 'bottom' ? 'top-full mt-2' : 'right-full mr-2'
            }`}
          >
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900">AI Content Assistant</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get AI-generated content suggestions for your {elementType} section.
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Quick Suggestions</h4>
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center py-4">
                    <svg
                      className="h-5 w-5 animate-spin text-primary-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : quickSuggestions.length > 0 ? (
                  <div className="space-y-2">
                    {quickSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="cursor-pointer rounded-md border border-gray-200 p-3 text-sm hover:border-primary-300 hover:bg-primary-50"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            {suggestion.context || suggestion.type}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-700">{suggestion.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-500">
                    No suggestions available. Try generating custom content below.
                  </div>
                )}

                <button
                  type="button"
                  onClick={loadQuickSuggestions}
                  disabled={isLoadingSuggestions}
                  className="mt-1 inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700 focus:outline-none disabled:opacity-50"
                >
                  <svg
                    className="mr-1 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Refresh suggestions
                </button>
              </div>

              {/* Custom generation form */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Custom Generation</h4>
                <AIContentForm
                  onSubmit={handleGenerateContent}
                  isLoading={isGenerating}
                  elementType={elementType}
                  defaultContextData={contextData}
                />
              </div>
            </div>
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
}

// Helper function to determine which field to update based on content type
function getFieldFromContentType(contentType: AIContentType): string {
  switch (contentType) {
    case 'headline':
      return 'title';
    case 'paragraph':
      return 'content';
    case 'tagline':
      return 'subtitle';
    case 'cta':
      return 'buttonText';
    case 'features':
      return 'features';
    case 'testimonial':
      return 'quote';
    case 'product':
      return 'description';
    case 'service':
      return 'description';
    case 'bio':
      return 'content';
    case 'faq':
      return 'content';
    case 'seo-title':
      return 'seoTitle';
    case 'seo-description':
      return 'seoDescription';
    case 'seo-keywords':
      return 'seoKeywords';
    default:
      return 'content';
  }
}
