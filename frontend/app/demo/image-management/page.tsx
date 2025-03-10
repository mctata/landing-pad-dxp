'use client';

import React, { useState } from 'react';
import { ImageSelector } from '@/components/editor';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

export default function ImageManagementDemo() {
  const [selectedImage, setSelectedImage] = useState<string>('');

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Image Management Demo</h1>

      <div className="mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Image Selector Component</h2>
          <p className="text-gray-600 mb-6">
            This component allows users to select images from multiple sources: upload, Unsplash, or their existing gallery.
          </p>

          <div className="max-w-xl mx-auto">
            <ImageSelector
              value={selectedImage}
              onChange={setSelectedImage}
              label="Demo Image"
              description="Select an image using the image management system"
              buttonText="Choose an Image"
              placeholder="Click to select an image"
            />
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Selected Image</h2>
            <p className="text-gray-600 mb-6">
              The image below demonstrates the ResponsiveImage component with lazy loading and placeholder generation.
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
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Features Overview</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Upload images from your device</li>
          <li>Browse and search millions of high-quality images from Unsplash</li>
          <li>Manage your previously uploaded images</li>
          <li>Automatic image optimization</li>
          <li>Responsive loading with placeholders for better user experience</li>
          <li>Edit image metadata (alt text, descriptions, tags)</li>
        </ul>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          Images from Unsplash are subject to the <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Unsplash License</a>.
          Please provide proper attribution when using Unsplash images in production.
        </p>
      </div>
    </div>
  );
}
