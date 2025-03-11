'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import AIContentModal from './AIContentModal';
import { useAI } from '@/lib/ai/ai-context';

interface AIAssistButtonProps {
  /**
   * Type of element to generate content for (text, hero, etc.)
   */
  elementType: string;
  /**
   * Callback function when content is generated
   */
  onContentGenerated: (content: any) => void;
  /**
   * Optional button label
   * @default "AI Generate"
   */
  label?: string;
  /**
   * Optional button variant
   * @default "primary"
   */
  variant?: 'primary' | 'secondary' | 'outline';
  /**
   * Optional button size
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Optional additional class name
   */
  className?: string;
  /**
   * Optional website ID for analytics
   */
  websiteId?: string;
  /**
   * Optional page ID for analytics
   */
  pageId?: string;
}

/**
 * Button that triggers AI assistance for specific element types
 */
export default function AIAssistButton({
  elementType,
  onContentGenerated,
  label = 'AI Generate',
  variant = 'primary',
  size = 'md',
  className = '',
  websiteId,
  pageId
}: AIAssistButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleApplyContent = (content: any) => {
    onContentGenerated(content);
    setIsModalOpen(false);
  };
  
  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant={variant}
        size={size}
        className={className}
        aria-haspopup="dialog"
        aria-label={`${label} for ${elementType}`}
      >
        <span className="mr-1">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M12 2a8 8 0 0 1 8 8v12l-4-4H4a4 4 0 0 1-4-4V10a8 8 0 0 1 8-8z" />
            <path d="M12 2c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2z" />
            <path d="M2 10c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2s-.9 2-2 2H4c-1.1 0-2-.9-2-2z" />
          </svg>
        </span>
        {label}
      </Button>
      
      <AIContentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        elementType={elementType}
        onApplyContent={handleApplyContent}
        websiteId={websiteId}
        pageId={pageId}
      />
    </>
  );
}
