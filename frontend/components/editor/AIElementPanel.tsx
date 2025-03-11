'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  AIContentGenerationForm,
  AIContentEditor,
  AISuggestionCard 
} from '@/components/ai';
import { useAI } from '@/lib/ai/ai-context';

interface ElementData {
  id: string;
  type: string;
  content: any;
  settings: any;
  position: number;
}

interface AIElementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement: ElementData | null;
  onUpdateElement: (elementId: string, updates: Partial<ElementData>) => void;
  websiteId: string;
  pageId: string;
}

/**
 * Panel for AI-assisted content generation and editing for website elements
 */
export default function AIElementPanel({
  isOpen,
  onClose,
  selectedElement,
  onUpdateElement,
  websiteId,
  pageId,
}: AIElementPanelProps) {
  const { generateSuggestions, isGeneratingSuggestions, latestSuggestions } = useAI();
  const [tab, setTab] = useState<'generate' | 'edit' | 'suggestions'>('generate');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  // Get human-readable element type for display
  const getElementTypeLabel = (type: string) => {
    switch (type) {
      case 'hero':
        return 'Hero Section';
      case 'text':
        return 'Text Block';
      case 'features':
        return 'Features Section';
      case 'cta':
        return 'Call to Action';
      case 'testimonials':
        return 'Testimonials';
      case 'pricing':
        return 'Pricing Section';
      case 'gallery':
        return 'Image Gallery';
      case 'contact':
        return 'Contact Form';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Update element with generated content
  const handleApplyContent = (content: any) => {
    if (!selectedElement) return;
    
    onUpdateElement(selectedElement.id, {
      content: {
        ...selectedElement.content,
        ...content
      }
    });
  };
  
  // Generate suggestions for the selected element
  const handleGenerateSuggestions = async (formData: any) => {
    if (!selectedElement) return;
    
    try {
      const results = await generateSuggestions(
        websiteId,
        pageId,
        selectedElement.type,
        formData.prompt
      );
      
      setSuggestions(results);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };
  
  // Save edited content
  const handleSaveContent = (editedContent: string) => {
    if (!selectedElement) return;
    
    // Handle different element types appropriately
    if (selectedElement.type === 'text') {
      onUpdateElement(selectedElement.id, {
        content: {
          ...selectedElement.content,
          text: editedContent
        }
      });
    } else if (selectedElement.type === 'hero') {
      onUpdateElement(selectedElement.id, {
        content: {
          ...selectedElement.content,
          headline: editedContent
        }
      });
    } else {
      // Generic handling for other element types
      onUpdateElement(selectedElement.id, {
        content: {
          ...selectedElement.content,
          text: editedContent
        }
      });
    }
  };
  
  // Get the appropriate content for editing based on element type
  const getEditableContent = (): string => {
    if (!selectedElement) return '';
    
    if (selectedElement.type === 'text') {
      return selectedElement.content.text || '';
    } else if (selectedElement.type === 'hero') {
      return selectedElement.content.headline || '';
    } else {
      // Generic handling for other element types
      return selectedElement.content.text || JSON.stringify(selectedElement.content, null, 2);
    }
  };
  
  if (!isOpen || !selectedElement) return null;
  
  return (
    <div 
      className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-secondary-200 z-40 overflow-hidden flex flex-col"
      role="complementary"
      aria-label="AI element editor panel"
    >
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-secondary-900">AI Assistant</h3>
            <p className="text-xs text-secondary-500">
              {getElementTypeLabel(selectedElement.type)}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="h-8 w-8 rounded-md text-secondary-500 hover:bg-secondary-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={onClose}
          aria-label="Close AI element panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="flex border-b border-secondary-200">
        <button
          type="button"
          className={`flex-1 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 ${
            tab === 'generate' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
          }`}
          onClick={() => setTab('generate')}
        >
          Generate
        </button>
        <button
          type="button"
          className={`flex-1 py-2.5 text-sm font-medium ${
            tab === 'edit' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
          }`}
          onClick={() => setTab('edit')}
        >
          Edit
        </button>
        <button
          type="button"
          className={`flex-1 py-2.5 text-sm font-medium ${
            tab === 'suggestions' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
          }`}
          onClick={() => setTab('suggestions')}
        >
          Suggestions
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'generate' && (
          <AIContentGenerationForm
            onGenerate={handleApplyContent}
            isLoading={isGeneratingSuggestions}
            elementType={selectedElement.type}
          />
        )}
        
        {tab === 'edit' && (
          <AIContentEditor
            content={getEditableContent()}
            onSave={handleSaveContent}
            onCancel={() => setTab('generate')}
          />
        )}
        
        {tab === 'suggestions' && (
          <div className="space-y-4">
            <AIContentGenerationForm
              onGenerate={handleGenerateSuggestions}
              isLoading={isGeneratingSuggestions}
              elementType={selectedElement.type}
            />
            
            {suggestions.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-medium text-secondary-700">Suggestions</h4>
                {suggestions.map((suggestion) => (
                  <AISuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onApply={() => handleApplyContent(suggestion.content)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
