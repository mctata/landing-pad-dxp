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
}

export default function AIContentModal({
  isOpen,
  onClose,
  elementType,
  onApplyContent,
}: AIContentModalProps) {
  const { generateContent, isGeneratingContent, latestContentResult, clearResults } = useAI();
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  
  // Focus trap management
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
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Return focus to the element that had it before the modal was opened
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [isOpen, onClose]);
  
  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      clearResults();
    }
  }, [isOpen, clearResults]);
  
  // Move to preview step when content is generated
  useEffect(() => {
    if (latestContentResult) {
      setStep('preview');
    }
  }, [latestContentResult]);
  
  const handleGenerateContent = async (formData: any) => {
    try {
      await generateContent({
        elementType,
        ...formData
      });
    } catch (error) {
      console.error('Error generating content:', error);
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
  
  const renderPreview = () => {
    if (!latestContentResult) return null;
    
    return (
      <div className="space-y-4">
        <div className="bg-secondary-50 p-4 rounded-md border border-secondary-200">
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
            <pre className="text-secondary-700 whitespace-pre-wrap">
              {JSON.stringify(latestContentResult, null, 2)}
            </pre>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button
            className="flex-1"
            onClick={handleApplyContent}
          >
            Apply Content
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleBack}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
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
          <h3 id="modal-title" className="text-lg font-medium text-secondary-900">
            Generate AI Content
          </h3>
          <button
            ref={initialFocusRef}
            type="button"
            className="h-8 w-8 rounded-md text-secondary-500 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
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