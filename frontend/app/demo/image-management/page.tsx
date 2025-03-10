'use client';

import React, { useState } from 'react';
import { ImageSelector } from '@/components/editor';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

export default function ImageManagementDemo() {
  const [selectedImage, setSelectedImage] = useState<string>('');

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <header>
        <h1 className="text-3xl font-bold mb-4 text-center">Image Management Demo</h1>
        <p className="text-gray-600 mb-8 text-center max-w-3xl mx-auto">
          This demo showcases the accessible image management system, allowing users to upload, search, and select images from multiple sources.
        </p>
      </header>

      <main>
        <section className="mb-12" aria-labelledby="section-image-selector">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 id="section-image-selector" className="text-xl font-semibold mb-4">Image Selector Component</h2>
            <p className="text-gray-600 mb-6">
              This component allows users to select images from multiple sources: upload, Unsplash, or their existing gallery.
              All components are fully accessible with keyboard navigation and screen reader support.
            </p>

            <div className="max-w-xl mx-auto">
              <ImageSelector
                value={selectedImage}
                onChange={setSelectedImage}
                label="Demo Image"
                description="Select an image using the image management system"
                buttonText="Choose an Image"
                placeholder="Click to select an image"
                required
              />
            </div>
          </div>
        </section>

        {selectedImage && (
          <section className="mb-12" aria-labelledby="section-selected-image">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 id="section-selected-image" className="text-xl font-semibold mb-4">Selected Image</h2>
              <p className="text-gray-600 mb-6">
                The image below demonstrates the ResponsiveImage component with lazy loading, placeholders, 
                and accessibility features like appropriate ARIA roles and error states.
              </p>

              <div className="max-w-xl mx-auto overflow-hidden rounded-lg">
                <ResponsiveImage
                  src={selectedImage}
                  alt="Selected demo image"
                  aspectRatio="16/9"
                  fadeIn={true}
                  placeholderSize={20}
                />
              </div>

              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-2">Image URL:</h3>
                <code className="text-xs bg-gray-100 p-2 block rounded overflow-x-auto">
                  {selectedImage}
                </code>
              </div>
            </div>
          </section>
        )}

        <section className="bg-white rounded-lg shadow-md p-6" aria-labelledby="section-features">
          <h2 id="section-features" className="text-xl font-semibold mb-4">Accessibility Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-2">Keyboard Navigation</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Tab through interactive elements</li>
                <li>Enter or Space to select items</li>
                <li>Escape to close dialogs</li>
                <li>Arrow keys to navigate between options</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-2">Screen Reader Support</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>ARIA labels for all interactive elements</li>
                <li>Status announcements for loading states</li>
                <li>Error messages are properly conveyed</li>
                <li>Descriptive alt text for images</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-2">Visual Enhancements</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Focus indicators for keyboard navigation</li>
                <li>Loading states with visual feedback</li>
                <li>Error states that are clearly visible</li>
                <li>Progressive loading with placeholders</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-2">User Experience</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Confirmation dialogs for destructive actions</li>
                <li>Helpful empty states with suggestions</li>
                <li>Form fields with properly associated labels</li>
                <li>Touch-friendly targets (minimum 44×44px)</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Images from Unsplash are subject to the <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Unsplash License</a>.
            Please provide proper attribution when using Unsplash images in production.
          </p>
        </div>
      </main>
    </div>
  );
}
