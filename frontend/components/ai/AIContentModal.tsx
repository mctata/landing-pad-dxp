'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import AIContentGenerationForm from './AIContentGenerationForm';
import { useAI } from '@/lib/ai/ai-context';

interface AIContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  elementType: string;
  onApplyContent: (content: any) => void;
  /**
   * Optional websiteId for tracking
   */
  websiteId?: string;
  /**
   * Optional pageId for tracking
   */
  pageId?: string;
}

export default function AIContentModal({
  isOpen,
  onClose,
  elementType,
  onApplyContent,
  websiteId = 'default',
  pageId = 'default',
}: AIContentModalProps) {
  const { 
    generateContent, 
    isGeneratingContent, 
    latestContentResult, 
    clearResults,
    error,
    clearError,
    retryLastOperation 
  } = useAI();
  
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const titleId = useRef(`ai-content-modal-${Math.random().toString(36).substring(2, 9)}`);
  const descriptionId = useRef(`ai-content-desc-${Math.random().toString(36).substring(2, 9)}`);
  
  // Focus management and accessibility keyboard handling
  useEffect(() => {
    if (!isOpen) return;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      
      const focusableElements = 
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const elements = modalRef.current.querySelectorAll(focusableElements);
      const firstElement = elements[0] as HTMLElement;
      const lastElement = elements[elements.length - 1] as HTMLElement;
      
      // Trap focus in modal
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);
    
    // Focus first focusable element when modal opens
    if (initialFocusRef.current) {
      initialFocusRef.current.focus();
    }
    
    // Store the element that had focus before the modal opened
    const previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Return focus to the element that had it before the modal was opened
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
      
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      clearResults();
      clearError();
    }
  }, [isOpen, clearResults, clearError]);
  
  // Move to preview step when content is generated
  useEffect(() => {
    if (latestContentResult) {
      setStep('preview');
    }
  }, [latestContentResult]);
  
  const handleGenerateContent = async (formData: any) => {
    try {
      await generateContent({
        websiteId,
        pageId,
        elementType,
        ...formData
      });
    } catch (error) {
      console.error('Error generating content:', error);
      // Error state is already handled by the AI context
    }
  };
  
  const handleApplyContent = () => {
    if (latestContentResult) {
      onApplyContent(latestContentResult);
      onClose();
    }
  };
  
  const handleBack = () => {
    setStep('form');
  };
  
  const handleRetry = async () => {
    await retryLastOperation();
  };
  
  const renderPreview = () => {
    if (!latestContentResult) return null;
    
    return (
      <div className="space-y-4">
        <div 
          className="bg-secondary-50 p-4 rounded-md border border-secondary-200"
          aria-label="Generated content preview"
        >
          {elementType === 'text' && (
            <>
              {latestContentResult.heading && (
                <h3 className="text-lg font-bold text-secondary-900 mb-2">{latestContentResult.heading}</h3>
              )}
              {latestContentResult.subheading && (
                <h4 className="text-base font-medium text-secondary-700 mb-3">{latestContentResult.subheading}</h4>
              )}
              {latestContentResult.body && (
                <p className="text-secondary-600">{latestContentResult.body}</p>
              )}
            </>
          )}
          
          {elementType === 'hero' && (
            <>
              {latestContentResult.headline && (
                <h3 className="text-xl font-bold text-secondary-900 mb-2">{latestContentResult.headline}</h3>
              )}
              {latestContentResult.subheadline && (
                <h4 className="text-lg font-medium text-secondary-700 mb-3">{latestContentResult.subheadline}</h4>
              )}
              {latestContentResult.ctaText && (
                <div className="mt-4">
                  <span className="inline-block px-4 py-2 bg-primary-600 text-white font-medium rounded-md">
                    {latestContentResult.ctaText}
                  </span>
                </div>
              )}
            </>
          )}
          
          {!['text', 'hero'].includes(elementType) && (
            <pre className="text-secondary-700 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(latestContentResult, null, 2)}
            </pre>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            className="flex-1"
            onClick={handleApplyContent}
            aria-label="Apply generated content"
          >
            Apply Content
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleBack}
            aria-label="Go back to content generation form"
          >
            Edit Prompt
          </Button>
        </div>
      </div>
    );
  };
  
  const renderError = () => {
    if (!error.isError) return null;
    
    return (
      <div className="rounded-md bg-red-50 p-4 my-4 border border-red-200" role="alert">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Content Generation Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error.message}</p>
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                variant="danger"
                onClick={handleRetry}
                disabled={error.retrying}
                className="mr-2"
                aria-label="Retry content generation"
              >
                {error.retrying ? 'Retrying...' : 'Retry'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={clearError}
                aria-label="Dismiss error message"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId.current}
      aria-describedby={descriptionId.current}
      onClick={(e) => {
        // Close when clicking the backdrop but not the modal itself
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-secondary-200 flex justify-between items-center">
          <h2 id={titleId.current} className="text-lg font-medium text-secondary-900">
            {step === 'form' ? 'Generate AI Content' : 'Preview Generated Content'}
          </h2>
          <button
            ref={initialFocusRef}
            type="button"
            className="h-8 w-8 rounded-md text-secondary-500 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div id={descriptionId.current} className="sr-only">
          Use this dialog to generate AI content for your {elementType} element. 
          {step === 'form' 
            ? 'Fill in the form to describe what kind of content you want to generate.' 
            : 'Preview the generated content and apply it if you are satisfied.'}
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {renderError()}
          
          {step === 'form' ? (
            <AIContentGenerationForm
              onGenerate={handleGenerateContent}
              isLoading={isGeneratingContent}
              elementType={elementType}
            />
          ) : (
            renderPreview()
          )}
        </div>
      </div>
    </div>
  );
}
