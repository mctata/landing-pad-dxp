'use client';

import React, { useState } from 'react';
import { AIContentEditorProps } from './types';

/**
 * Editor component for modifying AI-generated content with alternatives
 */
export function AIContentEditor({
  content,
  onChange,
  alternativeContents,
  onRequestAlternatives,
  isGeneratingAlternatives,
  contentType,
}: AIContentEditorProps) {
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
