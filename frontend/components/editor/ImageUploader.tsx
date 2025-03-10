import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useImageStore } from '@/lib/store/useImageStore';
import { resizeImageFile, isValidImage, formatImageFileSize } from '@/lib/utils/imageUtils';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  maxFileSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  onUploadSuccess?: (imageUrl: string) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
}

export default function ImageUploader({
  maxFileSizeMB = 10,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8,
  onUploadSuccess,
  onUploadError,
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get uploadImage function from image store
  const uploadImage = useImageStore(state => state.uploadImage);
  
  // Reset state
  const resetState = () => {
    setPreview(null);
    setUploadProgress(0);
    setError(null);
    setIsUploading(false);
  };
  
  // Handle file upload
  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      
      // Validate file type
      if (!isValidImage(file)) {
        throw new Error('Invalid file type. Only JPG, PNG, GIF, WebP, and SVG are supported.');
      }
      
      // Validate file size
      const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(`File size exceeds the ${maxFileSizeMB}MB limit`);
      }
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Simulate progress (in a real app, this would come from an upload event)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
          }
          return newProgress < 90 ? newProgress : 90;
        });
      }, 200);
      
      // Resize image if it's not an SVG
      let optimizedFile = file;
      if (!file.type.includes('svg')) {
        optimizedFile = await resizeImageFile(file, maxWidth, maxHeight, quality);
      }
      
      // Upload to server
      const image = await uploadImage(optimizedFile, {
        name: file.name,
        alt: file.name, // Default alt text
      });
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Call success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(image.url);
      }
      
      // Reset after a short delay
      setTimeout(() => {
        // Clean up the preview URL
        if (preview) URL.revokeObjectURL(preview);
        resetState();
      }, 1500);
      
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      
      // Call error callback if provided
      if (onUploadError && err instanceof Error) {
        onUploadError(err);
      }
    }
  };
  
  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': [],
      'image/svg+xml': [],
    },
    maxFiles: 1,
    noKeyboard: false, // Enable keyboard navigation
  });
  
  // Handle click on upload button
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Cancel upload
  const handleCancel = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    resetState();
  };
  
  return (
    <div className={cn('w-full', className)}>
      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {isUploading && `Upload in progress: ${uploadProgress}%`}
        {error && `Error: ${error}`}
      </div>
      
      {!isUploading && !preview ? (
        <div
          {...getRootProps()}
          className={cn(
            'image-uploader-dropzone',
            isDragActive || isDragging
              ? 'image-uploader-dropzone-active'
              : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50',
          )}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
          role="button"
          tabIndex={0}
          aria-label="Drop zone for image upload"
        >
          <input {...getInputProps({ ref: fileInputRef })} aria-label="File input" />
          <div className="flex flex-col items-center justify-center space-y-3">
            <ArrowUpTrayIcon className="h-10 w-10 text-gray-400" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">Drag and drop an image, or</p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP or SVG (max. {maxFileSizeMB}MB)</p>
            </div>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleBrowseClick}
              aria-label="Browse for files to upload"
            >
              Browse Files
            </button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-4" role="region" aria-label="Image upload preview">
          {preview && (
            <div className="relative rounded-md overflow-hidden">
              <img
                src={preview}
                alt="Upload preview"
                className="w-full h-auto max-h-48 object-contain bg-gray-100"
              />
              {!isUploading && (
                <button
                  onClick={handleCancel}
                  className="absolute top-2 right-2 rounded-full bg-gray-800/70 p-1 text-white hover:bg-gray-900/90"
                  aria-label="Cancel upload"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md" role="alert">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
