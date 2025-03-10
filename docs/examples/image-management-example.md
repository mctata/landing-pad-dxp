# Image Management Implementation Examples

This document provides practical examples of how to implement and use the image management system in different scenarios.

## Basic Image Selection in a Form

This example shows how to integrate the `ImageSelector` component into a form:

```jsx
import { useState } from 'react';
import { ImageSelector } from '@/components/editor';
import { Button } from '@/components/ui/button';

export default function ImageSelectionForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (url) => {
    setFormData((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Submit form data to API
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <ImageSelector
        value={formData.imageUrl}
        onChange={handleImageChange}
        label="Cover Image"
        description="Select a cover image for your article"
        placeholder="No cover image selected yet"
        buttonText="Select Cover Image"
      />

      <Button type="submit" className="w-full">
        Submit Form
      </Button>
    </form>
  );
}
```

## Using the Standalone Image Uploader

This example demonstrates using the `ImageUploader` component on its own:

```jsx
import { useState } from 'react';
import { ImageUploader } from '@/components/editor';
import { toast } from 'react-hot-toast';

export default function UploadExample() {
  const [uploadedUrl, setUploadedUrl] = useState('');
  
  const handleUploadSuccess = (url) => {
    setUploadedUrl(url);
    toast.success('Image uploaded successfully!');
  };
  
  const handleUploadError = (error) => {
    toast.error(`Upload failed: ${error.message}`);
  };
  
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Upload Profile Picture</h2>
      
      <ImageUploader
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        maxFileSizeMB={2}
        maxWidth={800}
        maxHeight={800}
        quality={0.9}
      />
      
      {uploadedUrl && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Uploaded Image:</h3>
          <img 
            src={uploadedUrl} 
            alt="Uploaded preview" 
            className="rounded-md border border-gray-200"
          />
          <p className="mt-2 text-sm text-gray-500">
            Image URL: {uploadedUrl}
          </p>
        </div>
      )}
    </div>
  );
}
```

## Creating a Gallery Page

This example shows how to create a dedicated gallery page for browsing and managing images:

```jsx
import { useState, useEffect } from 'react';
import { useImageStore } from '@/lib/store/useImageStore';
import { ResponsiveImage } from '@/components/ui';
import { ImageUploader } from '@/components/editor';
import { Button } from '@/components/ui/button';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function GalleryPage() {
  const { images, fetchImages, deleteImage, isLoading, error } = useImageStore(
    (state) => ({
      images: state.images,
      fetchImages: state.fetchImages,
      deleteImage: state.deleteImage,
      isLoading: state.isLoading,
      error: state.error,
    })
  );

  const [selectedImages, setSelectedImages] = useState(new Set());
  const [isUploadMode, setIsUploadMode] = useState(false);

  // Fetch images on component mount
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Toggle image selection
  const toggleImageSelection = (imageId) => {
    setSelectedImages((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId);
      } else {
        newSelection.add(imageId);
      }
      return newSelection;
    });
  };

  // Delete selected images
  const deleteSelectedImages = async () => {
    if (window.confirm(`Delete ${selectedImages.size} selected images?`)) {
      try {
        for (const imageId of selectedImages) {
          await deleteImage(imageId);
        }
        setSelectedImages(new Set());
      } catch (error) {
        console.error('Failed to delete images:', error);
      }
    }
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    setIsUploadMode(false);
    fetchImages();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Image Gallery</h1>
        <div className="flex space-x-4">
          {selectedImages.size > 0 ? (
            <Button 
              variant="destructive" 
              onClick={deleteSelectedImages}
              className="flex items-center"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete ({selectedImages.size})
            </Button>
          ) : (
            <Button
              onClick={() => setIsUploadMode(!isUploadMode)}
              variant={isUploadMode ? "outline" : "default"}
            >
              {isUploadMode ? 'Cancel Upload' : 'Upload Images'}
            </Button>
          )}
        </div>
      </div>

      {isUploadMode ? (
        <div className="max-w-lg mx-auto">
          <ImageUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={(error) => console.error(error)}
          />
        </div>
      ) : (
        <>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No images found</p>
              <Button onClick={() => setIsUploadMode(true)}>
                Upload your first image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border ${
                    selectedImages.has(image.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <ResponsiveImage
                    src={image.url}
                    alt={image.alt || image.name}
                    aspectRatio="1/1"
                    className="transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2 text-white">
                    <p className="text-sm font-medium truncate">{image.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

## Using ResponsiveImage with Next.js Image

This example shows how to use the `ResponsiveImage` component alongside Next.js Image optimization:

```jsx
import Image from 'next/image';
import { useState } from 'react';
import { generatePlaceholderImage } from '@/lib/utils/imageUtils';

export default function OptimizedImageComponent({ src, alt, width, height }) {
  const [isLoading, setIsLoading] = useState(true);
  const [placeholder, setPlaceholder] = useState('');

  // Generate a placeholder
  useState(() => {
    generatePlaceholderImage(src, 10)
      .then(setPlaceholder)
      .catch(() => {});
  }, [src]);

  return (
    <div className="relative overflow-hidden bg-gray-100 rounded-lg">
      {placeholder && isLoading && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-lg scale-110"
          style={{ backgroundImage: `url(${placeholder})` }}
        />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoadingComplete={() => setIsLoading(false)}
        className={`
          transition-opacity duration-500 rounded-lg
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
      />
    </div>
  );
}
```

## Integrating Unsplash with AI Content Generation

This example shows how to integrate Unsplash image selection with AI-generated content:

```jsx
import { useState } from 'react';
import { UnsplashBrowser } from '@/components/editor';
import { ResponsiveImage } from '@/components/ui';
import { Button } from '@/components/ui/button';

export default function AIContentGenerator() {
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Mock function to generate content with AI
  const generateContent = async () => {
    setIsGenerating(true);
    
    // In a real app, this would call your AI service
    setTimeout(() => {
      setGeneratedContent(
        `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
        Nullam convallis libero in ligula convallis, a efficitur eros malesuada. 
        Donec vitae nisl eu justo blandit tempor vel in est.`
      );
      setIsGenerating(false);
      
      // Automatically show Unsplash browser after generating content
      setShowUnsplash(true);
    }, 1500);
  };

  // Handle image selection from Unsplash
  const handleSelectImage = (image) => {
    setSelectedImage(image);
    setShowUnsplash(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">AI Content Generator</h1>
      
      <div className="mb-6">
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
          Enter a topic
        </label>
        <input
          type="text"
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="e.g., Sustainable gardening tips"
        />
      </div>
      
      <Button
        onClick={generateContent}
        disabled={!topic || isGenerating}
        className="w-full mb-6"
      >
        {isGenerating ? 'Generating...' : 'Generate Content'}
      </Button>
      
      {generatedContent && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Generated Content</h2>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <p>{generatedContent}</p>
          </div>
        </div>
      )}
      
      {selectedImage && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Selected Image</h2>
          <ResponsiveImage
            src={selectedImage.url}
            alt={selectedImage.alt || selectedImage.name}
            aspectRatio="16/9"
            className="rounded-md overflow-hidden"
          />
          <div className="mt-2 text-xs text-gray-500">
            Photo by{' '}
            <a 
              href={`https://unsplash.com/@${selectedImage.unsplashData.user.username}?utm_source=landing_pad&utm_medium=referral`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {selectedImage.unsplashData.user.name}
            </a>{' '}
            on{' '}
            <a
              href="https://unsplash.com/?utm_source=landing_pad&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Unsplash
            </a>
          </div>
        </div>
      )}
      
      {showUnsplash && !selectedImage && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Select an Image</h2>
            <button
              onClick={() => setShowUnsplash(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip
            </button>
          </div>
          <div className="border border-gray-200 rounded-md h-96">
            <UnsplashBrowser onSelect={handleSelectImage} />
          </div>
        </div>
      )}
      
      {(generatedContent || selectedImage) && (
        <Button className="w-full">
          Save and Publish
        </Button>
      )}
    </div>
  );
}
```

These examples demonstrate various ways to implement the image management components in different parts of your application. They can be customized further to fit your specific design requirements and functionality needs.
