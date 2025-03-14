'use client';

import React from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Types that match our previous implementation
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

// Export a provider component that wraps react-hot-toast
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#fff',
            color: '#333',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </>
  );
};

// Custom hook to match our previous API
export const useToast = () => {
  // Convert our custom toast format to react-hot-toast format
  const showToast = (options: ToastOptions) => {
    const { title, message, type = 'info', duration = 5000 } = options;
    const content = title ? `${title}: ${message}` : message;
    
    switch (type) {
      case 'success':
        toast.success(content, { duration });
        break;
      case 'error':
        toast.error(content, { duration });
        break;
      case 'warning':
      case 'info':
      default:
        toast(content, { 
          duration,
          icon: type === 'warning' ? '⚠️' : 'ℹ️',
        });
        break;
    }
  };

  // Return compatible API
  return {
    toast: showToast,
    // These are legacy methods to match existing code
    toasts: [],
    removeToast: (id: string) => toast.dismiss(id),
  };
};

// Export react-hot-toast directly for more advanced use cases
export { toast as hotToast };

// Global loading indicator
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  text?: string;
}> = ({ 
  size = 'md', 
  color = 'border-blue-600',
  className = '',
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full ${color} border-b-transparent`} role="status" aria-label="Loading">
        <span className="sr-only">Loading...</span>
      </div>
      {text && <span className="ml-2 text-gray-700">{text}</span>}
    </div>
  );
};