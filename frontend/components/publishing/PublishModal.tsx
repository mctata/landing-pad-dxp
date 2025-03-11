'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteId: string;
  isDirty: boolean;
}

export function PublishModal({ 
  isOpen, 
  onClose, 
  websiteId,
  isDirty 
}: PublishModalProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishStep, setPublishStep] = useState<'confirmation' | 'publishing' | 'success'>('confirmation');
  const router = useRouter();
  
  // Function to handle publish action
  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);
    setPublishStep('publishing');
    
    try {
      // Call the publish API
      await api.post(`/websites/${websiteId}/publish`);
      
      // Set success state
      setPublishStep('success');
      
      // Refresh the page data
      router.refresh();
      
      // Show success toast
      toast.success('Website published successfully!');
      
      // Auto close after success
      setTimeout(() => {
        onClose();
        setPublishStep('confirmation');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish website. Please try again.');
      setPublishStep('confirmation');
    } finally {
      setIsPublishing(false);
    }
  };
  
  // If modal is not open, return null
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">
            {publishStep === 'confirmation' && 'Publish Website'}
            {publishStep === 'publishing' && 'Publishing...'}
            {publishStep === 'success' && 'Website Published!'}
          </h2>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          {publishStep === 'confirmation' && (
            <>
              <p className="text-secondary-700 mb-4">
                {isDirty 
                  ? 'You have unsaved changes. Publishing will make your latest saved version available to the public.'
                  : 'Publishing will make your website available to the public.'}
              </p>
              
              {isDirty && (
                <div className="p-3 mb-4 bg-warning-50 text-warning-800 rounded border border-warning-200 text-sm">
                  <div className="flex items-start">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    <span>
                      You have unsaved changes. Please save your changes before publishing to include them in your published site.
                    </span>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="p-3 mb-4 bg-error-50 text-error-800 rounded border border-error-200 text-sm">
                  <div className="flex items-start">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </>
          )}
          
          {publishStep === 'publishing' && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-16 w-16 animate-spin mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 text-primary-500" 
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
              </div>
              <p className="text-secondary-700 text-center">
                Publishing your website. This may take a few moments...
              </p>
            </div>
          )}
          
          {publishStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-16 w-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-success-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              <p className="text-secondary-700 text-center">
                Your website has been published successfully!
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-secondary-200 flex justify-end space-x-3">
          {publishStep === 'confirmation' && (
            <>
              <Button 
                variant="secondary" 
                onClick={onClose}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePublish}
                isLoading={isPublishing}
                disabled={isPublishing}
              >
                Publish
              </Button>
            </>
          )}
          
          {publishStep === 'publishing' && (
            <Button 
              variant="secondary" 
              onClick={onClose}
              disabled={true}
            >
              Cancel
            </Button>
          )}
          
          {publishStep === 'success' && (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublishModal;