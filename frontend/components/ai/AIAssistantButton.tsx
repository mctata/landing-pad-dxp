'use client';

import React from 'react';
import { AIAssistantButtonProps } from './types';

/**
 * Button component for accessing AI assistance features
 */
export function AIAssistantButton({
  onClick,
  tooltipText = 'AI Assistant',
  isActive = false,
  size = 'md',
}: AIAssistantButtonProps) {
  // Define classes based on size
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        className={`
          ${sizeClasses[size]}
          ${isActive ? 'bg-primary-600 text-white' : 'bg-white text-primary-600 hover:bg-primary-50'}
          flex items-center justify-center rounded-full
          border border-primary-300 shadow-sm
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        `}
        aria-label="AI Assistant"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'}`}
        >
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 16v-5H7l6-7v5h4l-6 7z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {tooltipText && (
        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
          {tooltipText}
          <div className="absolute left-1/2 top-full -ml-1 h-2 w-2 -translate-x-1/2 transform rotate-45 bg-gray-800"></div>
        </div>
      )}
    </div>
  );
}
