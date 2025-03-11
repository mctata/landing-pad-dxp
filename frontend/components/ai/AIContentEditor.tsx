'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAI } from '@/lib/ai/ai-context';
import { AIContentEditorProps as AlternativeEditorProps } from './types';

// Combined interface from both implementations
interface AIContentEditorProps {
  // Legacy props
  content: string;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  
  // New props from the merged branch
  onChange?: (content: string) => void;
  alternativeContents?: string[];
  onRequestAlternatives?: () => void;
  isGeneratingAlternatives?: boolean;
  contentType?: string;
  
  // Flag to determine which mode to use
  useAlternativesMode?: boolean;
}

/**
 * Editor component for modifying AI-generated content with either 
 * direct editing or alternative suggestions
 */
export default function AIContentEditor({
  content,
  onSave,
  onCancel,
  onChange,
  alternativeContents,
  onRequestAlternatives,
  isGeneratingAlternatives,
  contentType = 'text',
  useAlternativesMode = false,
}: AIContentEditorProps) {
  
  // If alternative mode is enabled, render that component
  if (useAlternativesMode && onChange) {
    return <AlternativeEditor 
      content={content}
      onChange={onChange}
      alternativeContents={alternativeContents || []}
      onRequestAlternatives={onRequestAlternatives}
      isGeneratingAlternatives={isGeneratingAlternatives || false}
      contentType={contentType}
    />;
  }
  
  // Otherwise, render the original editor
  const { modifyContent } = useAI();
  const [editedContent, setEditedContent] = useState(content);
  const [isModifying, setIsModifying] = useState(false);
  const [aiAction, setAiAction] = useState('');
  const [aiActionInput, setAiActionInput] = useState('');
  
  useEffect(() => {
    setEditedContent(content);
  }, [content]);
  
  const handleAIAssist = async () => {
    if (!modifyContent) return;
    
    setIsModifying(true);
    
    try {
      // Call the API via context
      let parameters = {};
      
      if (aiAction === 'changeStyle') {
        parameters = { style: aiActionInput };
      } else if (aiAction === 'custom') {
        parameters = { instruction: aiActionInput };
      }
      
      const modifiedContent = await modifyContent(editedContent, aiAction, parameters);
      
      setEditedContent(modifiedContent);
      setIsModifying(false);
      setAiAction('');
      setAiActionInput('');
    } catch (error) {
      console.error('Error modifying content with AI:', error);
      setIsModifying(false);
    }
  };
  
  // Handle changes if using onChange mode
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditedContent(newContent);
    if (onChange) onChange(newContent);
  };
  
  return (
    <div className="space-y-4" role="application" aria-label="AI content editor">
      <div>
        <label htmlFor="content-editor" className="block text-sm font-medium text-secondary-700 mb-1">
          Edit Content
        </label>
        <textarea
          id="content-editor"
          rows={8}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          value={editedContent}
          onChange={handleContentChange}
          aria-label="Edit content text"
        />
      </div>
      
      <div 
        className="bg-secondary-50 rounded-md p-3 border border-secondary-200"
        role="region"
        aria-labelledby="ai-assistance-title"
      >
        <h4 id="ai-assistance-title" className="text-sm font-medium text-secondary-900 mb-2">AI Assistance</h4>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              aiAction === 'shorten'
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
            onClick={() => setAiAction(aiAction === 'shorten' ? '' : 'shorten')}
          >
            Shorten
          </button>
          
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-md ${
              aiAction === 'expand'
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
            onClick={() => setAiAction(aiAction === 'expand' ? '' : 'expand')}
          >
            Expand
          </button>
          
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-md ${
              aiAction === 'changeStyle'
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
            onClick={() => setAiAction(aiAction === 'changeStyle' ? '' : 'changeStyle')}
          >
            Change Style
          </button>
          
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-md ${
              aiAction === 'custom'
                ? 'bg-primary-100 text-primary-800 border border-primary-200'
                : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
            onClick={() => setAiAction(aiAction === 'custom' ? '' : 'custom')}
          >
            Custom
          </button>
        </div>
        
        {aiAction === 'changeStyle' && (
          <div className="mb-3">
            <select
              className="w-full text-xs px-3 py-1.5 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={aiActionInput}
              onChange={(e) => setAiActionInput(e.target.value)}
              aria-label="Select writing style"
            >
              <option value="">Select style...</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="enthusiastic">Enthusiastic</option>
              <option value="formal">Formal</option>
              <option value="friendly">Friendly</option>
            </select>
          </div>
        )}
        
        {aiAction === 'custom' && (
          <div className="mb-3">
            <input
              type="text"
              className="w-full text-xs px-3 py-1.5 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe what you want to do with the text..."
              value={aiActionInput}
              onChange={(e) => setAiActionInput(e.target.value)}
              aria-label="Custom AI modification instruction"
            />
          </div>
        )}
        
        {aiAction && (
          <Button
            size="sm"
            className="w-full"
            onClick={handleAIAssist}
            isLoading={isModifying}
            disabled={isModifying || (aiAction === 'changeStyle' && !aiActionInput) || (aiAction === 'custom' && !aiActionInput)}
            aria-live="polite"
          >
            {isModifying ? 'Applying...' : 'Apply AI Modification'}
          </Button>
        )}
      </div>
      
      {onSave && onCancel && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="primary"
            className="flex-1"
            onClick={() => onSave(editedContent)}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Alternative editor component from the merged branch
 */
function AlternativeEditor({
  content,
  onChange,
  alternativeContents,
  onRequestAlternatives,
  isGeneratingAlternatives,
  contentType,
}: AlternativeEditorProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  const handleAlternativeSelect = (alternative: string) => {
    onChange(alternative);
    setShowAlternatives(false);
  };

  const handleImprove = (direction: string) => {
    // This would call an API to improve the content in the specified direction
    // For now, we'll just append the direction to simulate the change
    onChange(`${content} (${direction})`); // This would be replaced with actual API call
  };

  // Determine if content input should be multiline
  const isMultiline = ['paragraph', 'product', 'service', 'bio', 'testimonial'].includes(contentType);

  return (
    <div className="space-y-4">
      {/* Content Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {contentType.charAt(0).toUpperCase() + contentType.slice(1).replace('-', ' ')}
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <svg
                className="-ml-0.5 mr-1 h-4 w-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
              </svg>
              Alternatives
            </button>
          </div>
        </div>

        {isMultiline ? (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        ) : (
          <input
            type="text"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        )}
      </div>

      {/* Quick Improve Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleImprove('shorter')}
          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Make it shorter
        </button>
        <button
          type="button"
          onClick={() => handleImprove('longer')}
          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Make it longer
        </button>
        <button
          type="button"
          onClick={() => handleImprove('more professional')}
          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          More professional
        </button>
        <button
          type="button"
          onClick={() => handleImprove('more casual')}
          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          More casual
        </button>
      </div>

      {/* Alternatives Section */}
      {showAlternatives && (
        <div className="mt-4 space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Alternative Versions</h3>
            {onRequestAlternatives && (
              <button
                type="button"
                onClick={onRequestAlternatives}
                disabled={isGeneratingAlternatives}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingAlternatives ? (
                  <>
                    <svg
                      className="-ml-0.5 mr-1 h-4 w-4 animate-spin text-gray-400"
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
                    Generating...
                  </>
                ) : (
                  'Generate New Alternatives'
                )}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {alternativeContents && alternativeContents.length > 0 ? (
              alternativeContents.map((alternative, index) => (
                <div
                  key={index}
                  className="cursor-pointer rounded-md border border-gray-200 bg-white p-3 text-sm shadow-sm hover:border-primary-300"
                  onClick={() => handleAlternativeSelect(alternative)}
                >
                  {alternative}
                </div>
              ))
            ) : (
              <div className="rounded-md bg-gray-100 p-3 text-sm text-gray-600">
                {isGeneratingAlternatives ? (
                  'Generating alternative content...'
                ) : (
                  'No alternative content available. Click the button above to generate alternatives.'
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
