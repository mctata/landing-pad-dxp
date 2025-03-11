'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export interface PublishedSiteViewerProps {
  websiteId: string;
  domain?: string;
  defaultDomain: string;
  lastPublished?: string;
}

export function PublishedSiteViewer({
  websiteId,
  domain,
  defaultDomain,
  lastPublished,
}: PublishedSiteViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Get the active domain (custom domain if set, otherwise default)
  const activeDomain = domain || defaultDomain;
  
  // Format URL for embedding/viewing
  const siteUrl = `https://${activeDomain}`;
  
  // Handle opening in new tab
  const handleOpenInNewTab = () => {
    window.open(siteUrl, '_blank');
  };
  
  // Format last published date
  const formattedDate = lastPublished 
    ? new Date(lastPublished).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not published yet';

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'space-y-4'}`}>
      {/* Viewer header */}
      <div className="flex items-center justify-between bg-secondary-100 p-3 rounded-t-md">
        <div className="flex items-center">
          <span className="text-sm font-medium text-secondary-700 mr-2">
            Published Site
          </span>
          {lastPublished && (
            <span className="text-xs text-secondary-500">
              Last published: {formattedDate}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInNewTab}
            title="Open in new tab"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a2 2 0 012-2h2a1 1 0 000-2H7a4 4 0 00-4 4v2a1 1 0 002 0zm10-1V6a1 1 0 10-2 0v2a1 1 0 002 0zM5 11a1 1 0 100 2h2a1 1 0 100-2H5zm7 0a1 1 0 100 2h2a1 1 0 100-2h-2zm-7 4a1 1 0 100 2h2a1 1 0 100-2H5zm7 0a1 1 0 100 2h2a1 1 0 100-2h-2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </Button>
        </div>
      </div>
      
      {/* Address bar */}
      <div className="flex items-center bg-secondary-50 p-2 border border-secondary-200 rounded-md mx-3">
        <div className="flex items-center bg-white rounded px-3 py-1.5 flex-grow border border-secondary-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-secondary-800 font-mono truncate">
            {siteUrl}
          </span>
        </div>
      </div>
      
      {/* Embedded website */}
      {lastPublished ? (
        <div className={`border border-secondary-200 rounded-b-md ${isFullscreen ? 'h-full pt-2' : 'h-[600px]'}`}>
          <iframe
            src={siteUrl}
            className="w-full h-full"
            title="Published website"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center border border-secondary-200 rounded-b-md bg-secondary-50 h-[600px]">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-secondary-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <h3 className="text-lg font-medium text-secondary-900 mb-1">Website not published yet</h3>
            <p className="text-sm text-secondary-600 max-w-sm">
              Publish your website to see it live. Once published, you can view it here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
