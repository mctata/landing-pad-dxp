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