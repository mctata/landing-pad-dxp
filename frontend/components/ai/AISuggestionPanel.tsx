'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import AISuggestionCard from './AISuggestionCard';
import { useAI } from '@/lib/ai/ai-context';

interface AISuggestionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  websiteId: string;
  pageId: string;
  onApplySuggestion: (content: any) => void;
}

export default function AISuggestionPanel({
  isOpen,
  onClose,
  websiteId,
  pageId,
  onApplySuggestion,
}: AISuggestionPanelProps) {
  const [prompt, setPrompt] = useState('');
  const { generateSuggestions, isGeneratingSuggestions, latestSuggestions } = useAI();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'layout' | 'style'>('text');

  // Sample suggestion types 
  const suggestionTypes = [
    { id: 'text', label: 'Text Content', description: 'Generate headings, paragraphs, and CTAs' },
    { id: 'layout', label: 'Layout Ideas', description: 'Get suggestions for page structure' },
    { id: 'style', label: 'Style Ideas', description: 'Color schemes and typography suggestions' }
  ];
  
  // Sample predefined prompts
  const predefinedPrompts = {
    text: [
      'Write a compelling headline for my homepage',
      'Create a product description for a tech product',
      'Generate a call-to-action for newsletter signups',
      'Write a professional about us section'
    ],
    layout: [
      'Suggest a layout for a SaaS landing page',
      'How should I structure my pricing page?',
      'Design a user testimonials section',
      'Create a feature comparison layout'
    ],
    style: [
      'Suggest a modern color scheme for a tech website',
      'Recommend typography for a professional service site',
      'Create a minimalist style guide',
      'Suggest button and UI element styles'
    ]
  };

  // Update suggestions when latestSuggestions changes
  React.useEffect(() => {
    if (latestSuggestions.length > 0) {
      setSuggestions(latestSuggestions);
    }
  }, [latestSuggestions]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      const results = await generateSuggestions(websiteId, pageId, activeTab, prompt);
      setSuggestions(results);
    } catch (error) {
      console.error('Error generating AI content:', error);
    }
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 border-l border-secondary-200 bg-white h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-secondary-200 flex justify-between items-center">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <h3 className="text-lg font-medium text-secondary-900">AI Content Assistant</h3>
        </div>
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
      
      {/* Tabs */}
      <div className="flex border-b border-secondary-200">
        {['text', 'layout', 'style'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === tab 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
            }`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab === 'text' ? 'Text' : tab === 'layout' ? 'Layout' : 'Style'}
          </button>
        ))}
      </div>
      
      <div className="p-4 border-b border-secondary-200">
        <div className="mb-3">
          <label htmlFor="ai-prompt" className="block text-sm font-medium text-secondary-700 mb-1">
            What would you like to generate?
          </label>
          <textarea
            id="ai-prompt"
            rows={3}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
            placeholder={`Describe what you want for your ${activeTab === 'text' ? 'content' : activeTab === 'layout' ? 'layout' : 'style'}...`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        
        <div className="mb-3">
          <p className="text-xs text-secondary-500 mb-2">Suggested prompts:</p>
          <div className="flex flex-wrap gap-2">
            {predefinedPrompts[activeTab as keyof typeof predefinedPrompts].slice(0, 3).map((predefinedPrompt, index) => (
              <button
                key={index}
                type="button"
                className="text-xs bg-secondary-100 hover:bg-secondary-200 text-secondary-800 px-2 py-1 rounded"
                onClick={() => handleSelectPrompt(predefinedPrompt)}
              >
                {predefinedPrompt}
              </button>
            ))}
          </div>
        </div>
        
        <Button 
          onClick={handleGenerate} 
          className="w-full"
          isLoading={isGeneratingSuggestions}
          disabled={!prompt.trim() || isGeneratingSuggestions}
        >
          Generate Suggestions
        </Button>
      </div>
      
      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto p-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-secondary-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="mt-2 text-sm font-medium">
              {isGeneratingSuggestions 
                ? 'Generating suggestions...' 
                : 'Enter a prompt and generate suggestions'}
            </p>
            <p className="text-xs mt-1">
              {isGeneratingSuggestions 
                ? 'This may take a few seconds' 
                : 'Be specific about what you need'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-secondary-900">Suggestions</h4>
            {suggestions.map((suggestion) => (
              <AISuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onApply={() => onApplySuggestion(suggestion.content)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}