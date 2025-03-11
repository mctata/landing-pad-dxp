'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAI } from '@/lib/ai/ai-context';

interface AIEnhanceToolbarProps {
  /**
   * The text content to enhance
   */
  content: string;
  /**
   * Callback function when content is updated
   */
  onUpdate: (updatedContent: string) => void;
  /**
   * Optional additional class name
   */
  className?: string;
  /**
   * Optional website ID for analytics
   */
  websiteId?: string;
  /**
   * Optional page ID for analytics
   */
  pageId?: string;
}

/**
 * A quick-access toolbar for common AI content enhancement functions
 */
export default function AIEnhanceToolbar({
  content,
  onUpdate,
  className = '',
  websiteId,
  pageId
}: AIEnhanceToolbarProps) {
  const { modifyContent } = useAI();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enhance = async (action: string) => {
    if (isEnhancing) return;
    
    setIsEnhancing(true);
    setCurrentAction(action);
    setError(null);
    
    try {
      const result = await modifyContent(content, action, {
        websiteId,
        pageId
      });
      onUpdate(result);
    } catch (error) {
      console.error(`Error enhancing content (${action}):`, error);
      setError('Failed to enhance content. Please try again.');
    } finally {
      setIsEnhancing(false);
      setCurrentAction(null);
    }
  };

  const enhanceOptions = [
    { id: 'improve', label: 'Improve', tooltip: 'Enhance writing quality and clarity' },
    { id: 'shorten', label: 'Shorten', tooltip: 'Make text more concise without losing meaning' },
    { id: 'expand', label: 'Expand', tooltip: 'Add more detail and examples' },
    { id: 'proofread', label: 'Proofread', tooltip: 'Fix grammar, spelling, and punctuation' },
    { id: 'professional', label: 'Professional', tooltip: 'Use formal, business-appropriate tone' },
    { id: 'casual', label: 'Casual', tooltip: 'Make more conversational and approachable' },
  ];

  return (
    <div className={className}>
      <div 
        className="inline-flex flex-wrap gap-1 mb-1"
        role="toolbar"
        aria-label="AI text enhancement options"
      >
        {enhanceOptions.map((option) => (
          <button
            key={option.id}
            className={`text-xs px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              isEnhancing && currentAction === option.id
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
            onClick={() => enhance(option.id)}
            disabled={isEnhancing}
            title={option.tooltip}
            aria-label={`${option.label} - ${option.tooltip}`}
            aria-pressed={currentAction === option.id}
            aria-busy={isEnhancing && currentAction === option.id}
          >
            {isEnhancing && currentAction === option.id ? (
              <span className="inline-flex items-center">
                <svg 
                  className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-primary-600" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span aria-hidden="true">{option.label}</span>
                <span className="sr-only">Enhancing with {option.label}...</span>
              </span>
            ) : (
              <>
                <span aria-hidden="true">{option.label}</span>
                <span className="sr-only">{option.tooltip}</span>
              </>
            )}
          </button>
        ))}
      </div>
      
      {error && (
        <div 
          className="text-xs text-red-600 mt-1" 
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
      
      <div className="text-xs text-secondary-500 mt-1">
        <span className="sr-only">How to use:</span>
        Select an option to enhance your text using AI
      </div>
    </div>
  );
}
