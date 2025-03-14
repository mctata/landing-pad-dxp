'use client';

import React from 'react';

interface LoadingIndicatorProps {
  fullPage?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg'; 
  overlay?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  fullPage = false,
  message = 'Loading...',
  size = 'md',
  overlay = false
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-2',
    lg: 'h-16 w-16 border-4'
  };

  const containerClasses = fullPage
    ? 'fixed inset-0 z-50 flex items-center justify-center'
    : 'flex items-center justify-center py-8';

  return (
    <div 
      className={`${containerClasses} ${overlay ? 'bg-white/80' : ''}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center">
        <div className="inline-block" role="status">
          <div className={`${sizeClasses[size]} animate-spin rounded-full border-primary-500 border-b-transparent`}>
            <span className="sr-only">Loading</span>
          </div>
        </div>
        {message && (
          <p className="mt-3 text-gray-700 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

// Simplified version for small inline loading indicators
export const LoadingSpinner: React.FC<{
  className?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  className = '',
  color = 'border-primary-500',
  size = 'sm'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2'
  };

  return (
    <div className={`inline-block ${className}`} role="status" aria-label="Loading">
      <div className={`${sizeClasses[size]} animate-spin rounded-full ${color} border-b-transparent`}>
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
};

// Export the page transition loader
export const PageTransition: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="h-1 bg-primary-500 animate-pulse"></div>
    </div>
  );
};

export default LoadingIndicator;