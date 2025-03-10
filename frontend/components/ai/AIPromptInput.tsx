'use client';

import React, { useState, KeyboardEvent } from 'react';
import { AIPromptInputProps } from './types';

/**
 * Input component for AI prompts with submit button
 */
export function AIPromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Enter a prompt for AI content generation...',
  isLoading = false,
  disabled = false,
}: AIPromptInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex items-start space-x-2">
        <div className="relative flex-grow">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={3}
            className="block w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
              disabled:cursor-not-allowed disabled:opacity-75 disabled:bg-gray-50"
            disabled={isLoading || disabled}
          />
          <div className="absolute bottom-2 left-2 text-xs text-gray-500">
            <div className="flex items-center space-x-1 text-primary-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 16v-5H7l6-7v5h4l-6 7z"
                  clipRule="evenodd"
                />
              </svg>
              <span>AI Powered</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || isLoading || disabled}
          className="mt-1 inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm
            hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-75"
        >
          {isLoading ? (
            <>
              <svg
                className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
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
            'Generate'
          )}
        </button>
      </div>
    </div>
  );
}
