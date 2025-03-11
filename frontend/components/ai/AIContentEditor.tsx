'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAI } from '@/lib/ai/ai-context';

interface AIContentEditorProps {
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export default function AIContentEditor({
  content,
  onSave,
  onCancel,
}: AIContentEditorProps) {
  const { modifyContent } = useAI();
  const [editedContent, setEditedContent] = useState(content);
  const [isModifying, setIsModifying] = useState(false);
  const [aiAction, setAiAction] = useState('');
  const [aiActionInput, setAiActionInput] = useState('');
  
  useEffect(() => {
    setEditedContent(content);
  }, [content]);
  
  const handleAIAssist = async () => {
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
  
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="content-editor" className="block text-sm font-medium text-secondary-700 mb-1">
          Edit Content
        </label>
        <textarea
          id="content-editor"
          rows={8}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
        />
      </div>
      
      <div className="bg-secondary-50 rounded-md p-3 border border-secondary-200">
        <h4 className="text-sm font-medium text-secondary-900 mb-2">AI Assistance</h4>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-md ${
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
              className="w-full text-xs px-3 py-1.5 border border-secondary-300 rounded-md"
              value={aiActionInput}
              onChange={(e) => setAiActionInput(e.target.value)}
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
              className="w-full text-xs px-3 py-1.5 border border-secondary-300 rounded-md"
              placeholder="Describe what you want to do with the text..."
              value={aiActionInput}
              onChange={(e) => setAiActionInput(e.target.value)}
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
          >
            {isModifying ? 'Applying...' : 'Apply AI Modification'}
          </Button>
        )}
      </div>
      
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
    </div>
  );
}