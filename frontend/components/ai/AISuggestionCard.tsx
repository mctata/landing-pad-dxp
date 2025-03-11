'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAI } from '@/lib/ai/ai-context';

interface AISuggestionCardProps {
  /**
   * The suggestion data to display
   */
  suggestion: {
    id: string;
    type: 'text' | 'layout' | 'style';
    title: string;
    content: any;
  };
  /**
   * Callback when the suggestion is applied
   */
  onApply: () => void;
  /**
   * Optional websiteId for tracking
   */
  websiteId?: string;
  /**
   * Optional pageId for tracking
   */
  pageId?: string;
}

/**
 * Card component for displaying an individual AI suggestion with apply and regenerate options
 */
export default function AISuggestionCard({ 
  suggestion, 
  onApply, 
  websiteId,
  pageId
}: AISuggestionCardProps) {
  const { generateSuggestions, markSuggestionAccepted, markSuggestionRejected } = useAI();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleApply = () => {
    // Track acceptance in analytics
    markSuggestionAccepted(suggestion.id, suggestion.type, websiteId, pageId);
    onApply();
  };
  
  const handleRegenerate = async () => {
    // Track rejection in analytics
    markSuggestionRejected(suggestion.id, suggestion.type, websiteId, pageId);
    
    setIsRegenerating(true);
    try {
      // In a real app, you would pass the original parameters
      // This should be handled in a more sophisticated way in production
      await generateSuggestions(
        websiteId || 'default', 
        pageId || 'default', 
        suggestion.type, 
        'Regenerate alternative to ' + suggestion.title
      );
      setIsRegenerating(false);
    } catch (error) {
      console.error('Error regenerating suggestion:', error);
      setIsRegenerating(false);
    }
  };
  
  const renderPreview = () => {
    switch (suggestion.type) {
      case 'text':
        return (
          <div className="mt-2 text-sm">
            {suggestion.content.heading && (
              <h4 className="font-bold text-secondary-900">{suggestion.content.heading}</h4>
            )}
            {suggestion.content.subheading && (
              <p className="text-secondary-600 mt-1">{suggestion.content.subheading}</p>
            )}
            {suggestion.content.body && (
              <p className={`text-secondary-600 mt-2 ${isExpanded ? '' : 'line-clamp-3'}`}>
                {suggestion.content.body}
              </p>
            )}
            {suggestion.content.body && suggestion.content.body.length > 150 && (
              <button
                type="button"
                className="text-xs text-primary-600 hover:text-primary-800 mt-1 focus:outline-none focus:underline"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-controls={`suggestion-content-${suggestion.id}`}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        );
        
      case 'layout':
        return (
          <div className="mt-2 text-sm">
            <p className="text-secondary-600">Structure: {suggestion.content.structure}</p>
            <div className="mt-1 flex flex-wrap gap-1" role="list" aria-label="Layout elements">
              {suggestion.content.elements.map((element: string, i: number) => (
                <span 
                  key={i} 
                  className="inline-block px-2 py-1 rounded-md bg-secondary-100 text-secondary-700 text-xs"
                  role="listitem"
                >
                  {element}
                </span>
              ))}
            </div>
          </div>
        );
        
      case 'style':
        return (
          <div className="mt-2">
            <div 
              className="flex space-x-2 mt-1" 
              role="list" 
              aria-label="Color palette"
            >
              {Object.entries(suggestion.content.colors).map(([name, color]: [string, any]) => (
                <div 
                  key={name} 
                  className="flex flex-col items-center"
                  role="listitem"
                >
                  <div
                    className="h-6 w-6 rounded-full border border-secondary-200"
                    style={{ backgroundColor: color }}
                    aria-label={`${name} color: ${color}`}
                  />
                  <span className="text-xs text-secondary-500 mt-1">{name.substring(0, 3)}</span>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 mt-2">
              <span className="text-xs text-secondary-700">Typography: </span>
              <span className="text-xs text-secondary-700 font-semibold">
                {suggestion.content.typography.heading} / {suggestion.content.typography.body}
              </span>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="mt-2 text-sm text-secondary-600">
            <p>Preview not available for this suggestion type.</p>
          </div>
        );
    }
  };

  return (
    <div 
      className="border border-secondary-200 rounded-lg p-3 hover:border-primary-300 hover:shadow-sm transition-all duration-150 focus-within:ring-2 focus-within:ring-primary-500"
      role="region"
      aria-labelledby={`suggestion-title-${suggestion.id}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span 
            className="inline-block px-2 py-0.5 rounded-full text-xs uppercase tracking-wider font-medium bg-primary-100 text-primary-800"
            role="note"
          >
            {suggestion.type}
          </span>
          <h3 
            id={`suggestion-title-${suggestion.id}`}
            className="text-sm font-medium text-secondary-900 mt-1"
          >
            {suggestion.title}
          </h3>
        </div>
        <Button 
          size="sm" 
          onClick={handleApply}
          aria-label={`Apply ${suggestion.title} suggestion`}
        >
          Apply
        </Button>
      </div>
      
      <div id={`suggestion-content-${suggestion.id}`}>
        {renderPreview()}
      </div>
      
      <div className="flex justify-end mt-2">
        <button
          type="button"
          className="text-xs text-secondary-500 hover:text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded px-2 py-1 flex items-center"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          aria-label={`Regenerate alternative for ${suggestion.title}`}
          aria-busy={isRegenerating}
        >
          {isRegenerating ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-2 h-3 w-3 text-secondary-500" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Regenerating...
            </>
          ) : (
            <>
              <svg 
                className="mr-1 h-3 w-3" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Regenerate
            </>
          )}
        </button>
      </div>
    </div>
  );
}
