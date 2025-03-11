'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAI } from '@/lib/ai/ai-context';

interface AISuggestionCardProps {
  suggestion: {
    id: string;
    type: 'text' | 'layout' | 'style';
    title: string;
    content: any;
  };
  onApply: () => void;
}

export default function AISuggestionCard({ suggestion, onApply }: AISuggestionCardProps) {
  const { generateSuggestions } = useAI();
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      // In a real app, you would pass the original parameters
      // This should be handled in a more sophisticated way in production
      await generateSuggestions('default', 'default', suggestion.type, 'Regenerate alternative to ' + suggestion.title);
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
              <p className="text-secondary-600 mt-2 line-clamp-3">{suggestion.content.body}</p>
            )}
          </div>
        );
        
      case 'layout':
        return (
          <div className="mt-2 text-sm">
            <p className="text-secondary-600">Structure: {suggestion.content.structure}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {suggestion.content.elements.map((element: string, i: number) => (
                <span key={i} className="inline-block px-2 py-1 rounded-md bg-secondary-100 text-secondary-700 text-xs">
                  {element}
                </span>
              ))}
            </div>
          </div>
        );
        
      case 'style':
        return (
          <div className="mt-2">
            <div className="flex space-x-2 mt-1">
              {Object.entries(suggestion.content.colors).map(([name, color]: [string, any]) => (
                <div key={name} className="flex flex-col items-center">
                  <div
                    className="h-6 w-6 rounded-full border border-secondary-200"
                    style={{ backgroundColor: color }}
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
        return null;
    }
  };

  return (
    <div className="border border-secondary-200 rounded-lg p-3 hover:border-primary-300 hover:shadow-sm transition-all duration-150">
      <div className="flex justify-between items-start">
        <div>
          <span className="inline-block px-2 py-0.5 rounded-full text-xs uppercase tracking-wider font-medium bg-primary-100 text-primary-800">
            {suggestion.type}
          </span>
          <h3 className="text-sm font-medium text-secondary-900 mt-1">{suggestion.title}</h3>
        </div>
        <Button size="sm" onClick={onApply}>Apply</Button>
      </div>
      
      {renderPreview()}
      
      <div className="flex justify-end mt-2">
        <button
          type="button"
          className="text-xs text-secondary-500 hover:text-secondary-700 flex items-center"
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-secondary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Regenerating...
            </>
          ) : (
            'Regenerate'
          )}
        </button>
      </div>
    </div>
  );
}