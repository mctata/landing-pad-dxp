'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import AIContentModal from './AIContentModal';

interface AIAssistButtonProps {
  elementType: string;
  onContentGenerated: (content: any) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

/**
 * AIAssistButton component that triggers an AI content generation modal when clicked
 * 
 * @param elementType - The type of element to generate content for (e.g., 'text', 'hero', 'features')
 * @param onContentGenerated - Callback function when content is applied
 * @param variant - Button style variant
 * @param size - Button size 
 * @param className - Additional CSS classes
 */
export default function AIAssistButton({
  elementType,
  onContentGenerated,
  variant = 'outline',
  size = 'sm',
  className = '',
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
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`flex items-center ${className}`}
        onClick={handleOpenModal}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M13 10V3L4 14h7v7l9-11h-7z" 
          />
        </svg>
        AI Assist
      </Button>
      
      <AIContentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        elementType={elementType}
        onApplyContent={handleApplyContent}
      />
    </>
  );
}