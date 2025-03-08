'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/auth-context';

interface EditorLayoutProps {
  children: React.ReactNode;
  websiteName: string;
  isSaving: boolean;
  onSave: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onExit: () => void;
}

export function EditorLayout({
  children,
  websiteName,
  isSaving,
  onSave,
  onPreview,
  onPublish,
  onExit,
}: EditorLayoutProps) {
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-secondary-200 bg-white z-10">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center">
              <div className="relative w-8 h-8 mr-2">
                <Image 
                  src="/images/logo.svg" 
                  alt="Landing Pad Digital" 
                  fill 
                  className="object-contain"
                />
              </div>
            </Link>
            
            <div className="h-6 border-l border-secondary-300"></div>
            
            <div className="text-lg font-semibold text-secondary-800 truncate max-w-xs">
              {websiteName}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onExit}
            >
              Exit
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={onPreview}
            >
              Preview
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={onSave}
              isLoading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            
            <Button
              size="sm"
              onClick={onPublish}
            >
              Publish
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      
      {/* Exit confirmation dialog */}
      {isExitDialogOpen && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              Exit Editor
            </h3>
            <p className="text-secondary-600 mb-6">
              Are you sure you want to exit? Any unsaved changes will be lost.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setIsExitDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onExit}
              >
                Exit without saving
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}