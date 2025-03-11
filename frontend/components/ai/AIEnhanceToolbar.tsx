'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAI } from '@/lib/ai/ai-context';

interface AIEnhanceToolbarProps {
  content: string;
  onUpdate: (updatedContent: string) => void;
  className?: string;
}

/**
 * A quick-access toolbar for common AI enhancement functions
 */
export default function AIEnhanceToolbar({
  content,
  onUpdate,
  className = '',
}: AIEnhanceToolbarProps) {
  const { modifyContent } = useAI();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const enhance = async (action: string) => {
    if (isEnhancing) return;
    
    setIsEnhancing(true);
    setCurrentAction(action);
    
    try {
      const result = await modifyContent(content, action);
      onUpdate(result);
    } catch (error) {
      console.error(`Error enhancing content (${action}):`, error);
    } finally {
      setIsEnhancing(false);
      setCurrentAction(null);
    }
  };

  const enhanceOptions = [
    { id: 'improve', label: 'Improve', tooltip: 'Enhance writing quality' },
    { id: 'shorten', label: 'Shorten', tooltip: 'Make text more concise' },
    { id: 'expand', label: 'Expand', tooltip: 'Add more detail' },
    { id: 'proofread', label: 'Proofread', tooltip: 'Fix grammar and spelling' },
    { id: 'professional', label: 'Professional', tooltip: 'Use formal tone' },
    { id: 'casual', label: 'Casual', tooltip: 'Make more conversational' },
  ];

  return (
    <div 
      className={`inline-flex flex-wrap gap-1 ${className}`}
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
        >
          {isEnhancing && currentAction === option.id ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {option.label}
            </span>
          ) : (
            option.label
          )}
        </button>
      ))}
    </div>
  );
}