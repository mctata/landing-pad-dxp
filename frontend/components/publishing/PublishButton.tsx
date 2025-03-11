'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import PublishModal from './PublishModal';

interface PublishButtonProps {
  websiteId: string;
  isDirty?: boolean;
  lastPublishedAt?: string | null;
}

export function PublishButton({ 
  websiteId, 
  isDirty = false,
  lastPublishedAt = null 
}: PublishButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Format the last published date for display
  const formattedLastPublishedAt = lastPublishedAt 
    ? new Date(lastPublishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="default"
          onClick={() => setIsModalOpen(true)}
          className={isDirty ? 'animate-pulse' : ''}
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
              strokeWidth={2} 
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" 
            />
          </svg>
          Publish
        </Button>
        
        {formattedLastPublishedAt && (
          <span className="ml-3 text-xs text-secondary-500">
            Last published: {formattedLastPublishedAt}
          </span>
        )}
      </div>

      <PublishModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        websiteId={websiteId}
        isDirty={isDirty}
      />
    </>
  );
}

export default PublishButton;