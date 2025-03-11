'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface PageData {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
}

interface EditorToolbarProps {
  websiteId: string;
  pages: PageData[];
  currentPageId: string;
  onPageChange: (pageId: string) => void;
  onAddPage: () => void;
  openPanel: string | null;
  setOpenPanel: (panel: string | null) => void;
}

export function EditorToolbar({
  websiteId,
  pages,
  currentPageId,
  onPageChange,
  onAddPage,
  openPanel,
  setOpenPanel,
}: EditorToolbarProps) {
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const [isPageEditMode, setIsPageEditMode] = useState(false);
  const [pageNameEdit, setPageNameEdit] = useState('');
  
  // Get current page
  const currentPage = pages.find(page => page.id === currentPageId);
  
  // Toggle element panel
  const toggleElementsPanel = () => {
    if (openPanel === 'elements') {
      setOpenPanel(null);
    } else {
      setOpenPanel('elements');
    }
  };
  
  // Toggle settings panel
  const toggleSettingsPanel = () => {
    if (openPanel === 'website-settings') {
      setOpenPanel(null);
    } else {
      setOpenPanel('website-settings');
    }
  };
  
  // Toggle AI assistant panel
  const toggleAIPanel = () => {
    if (openPanel === 'ai-assistant') {
      setOpenPanel(null);
    } else {
      setOpenPanel('ai-assistant');
    }
  };
  
  // Start editing page name
  const startEditPageName = () => {
    if (currentPage) {
      setPageNameEdit(currentPage.name);
      setIsPageEditMode(true);
    }
  };
  
  // Save page name
  const savePageName = () => {
    // TODO: Implement saving page name
    setIsPageEditMode(false);
  };
  
  return (
    <div className="h-12 border-b border-secondary-200 flex items-center bg-white px-4">
      {/* Page selector */}
      <div className="relative mr-4">
        <button
          type="button"
          className="flex items-center space-x-2 h-8 px-3 rounded-md border border-secondary-300 bg-white hover:bg-secondary-50 text-sm font-medium text-secondary-700"
          onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
        >
          <span>Page:</span>
          {isPageEditMode ? (
            <input
              type="text"
              value={pageNameEdit}
              onChange={(e) => setPageNameEdit(e.target.value)}
              onBlur={savePageName}
              onKeyDown={(e) => e.key === 'Enter' && savePageName()}
              className="px-1 py-0.5 border border-primary-300 rounded w-32"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="font-semibold max-w-xs truncate">
                {currentPage?.name || 'Select Page'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
        
        {isPageDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 rounded-md shadow-lg bg-white z-10 py-1 border border-secondary-200">
            <div className="px-3 py-2 border-b border-secondary-200 text-xs font-medium text-secondary-500 uppercase">
              Pages
            </div>
            <div className="max-h-60 overflow-y-auto">
              {pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  className={`w-full text-left px-4 py-2 text-sm ${
                    page.id === currentPageId
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-secondary-700 hover:bg-secondary-50'
                  }`}
                  onClick={() => {
                    onPageChange(page.id);
                    setIsPageDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{page.name}</span>
                    {page.isHome && (
                      <span className="text-xs bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded">
                        Home
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-secondary-200">
              <button
                type="button"
                className="w-full flex items-center text-sm text-primary-600 hover:text-primary-800"
                onClick={() => {
                  onAddPage();
                  setIsPageDropdownOpen(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add new page
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick page actions */}
      {currentPage && !isPageEditMode && (
        <div className="flex items-center space-x-2 mr-4">
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded-md text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700"
            onClick={startEditPageName}
            title="Rename Page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          
          {!currentPage.isHome && (
            <button
              type="button"
              className="h-8 w-8 flex items-center justify-center rounded-md text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700"
              title="Set as Homepage"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </button>
          )}
          
          {!currentPage.isHome && pages.length > 1 && (
            <button
              type="button"
              className="h-8 w-8 flex items-center justify-center rounded-md text-secondary-500 hover:bg-secondary-100 hover:text-error-600"
              title="Delete Page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      {/* Divider */}
      <div className="h-6 border-l border-secondary-300 mx-2"></div>
      
      {/* Editing tools */}
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant={openPanel === 'elements' ? 'default' : 'secondary'}
          onClick={toggleElementsPanel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Elements
        </Button>
        
        <Button
          size="sm"
          variant={openPanel === 'website-settings' ? 'default' : 'secondary'}
          onClick={toggleSettingsPanel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Settings
        </Button>
        
        <Button
          size="sm"
          variant={openPanel === 'ai-assistant' ? 'default' : 'secondary'}
          onClick={toggleAIPanel}
          className="relative"
        >
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          AI Assistant
        </Button>
      </div>
      
      {/* Spacer */}
      <div className="flex-1"></div>
      
      {/* Undo/Redo */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          className="h-8 w-8 flex items-center justify-center rounded-md text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
          title="Undo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          type="button"
          className="h-8 w-8 flex items-center justify-center rounded-md text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
          title="Redo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}