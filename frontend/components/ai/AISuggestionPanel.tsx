'use client';

import React from 'react';
import { AISuggestionPanelProps, AISuggestion } from './types';

/**
 * Panel component for displaying AI content suggestions
 */
export function AISuggestionPanel({
  isOpen,
  onClose,
  suggestions,
  isLoading,
  onSelectSuggestion,
}: AISuggestionPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-80 flex-col bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-medium text-gray-900">AI Suggestions</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <span className="sr-only">Close panel</span>
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary-600"></div>
              <p className="text-sm text-gray-500">Generating suggestions...</p>
            </div>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onSelect={onSelectSuggestion}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <svg
              className="h-12 w-12 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suggestions available</h3>
            <p className="mt-1 text-sm text-gray-500">Try selecting different content to get AI suggestions.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="rounded-md bg-gray-50 p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-primary-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">
                These suggestions are AI-generated based on your current content. Click on a suggestion to apply it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onSelect,
}: {
  suggestion: AISuggestion;
  onSelect: (suggestion: AISuggestion) => void;
}) {
  return (
    <div
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow"
      onClick={() => onSelect(suggestion)}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
          {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
        </span>
        {suggestion.context && (
          <span className="text-xs text-gray-500">{suggestion.context}</span>
        )}
      </div>
      <p className="text-sm text-gray-700">{suggestion.content}</p>
      <div className="mt-3 flex items-center justify-end space-x-2">
        <button
          className="text-xs text-primary-600 hover:text-primary-700 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(suggestion);
          }}
        >
          Use suggestion
        </button>
      </div>
    </div>
  );
}
