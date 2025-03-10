import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { generatePlaceholderImage } from '@/lib/utils/imageUtils';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: string;
  background?: string;
  loadingStrategy?: 'lazy' | 'eager';
  placeholderSize?: number;
  fadeIn?: boolean;
  fallbackSrc?: string;
}

/**
 * A responsive image component with placeholder and lazy loading
 */
export default function ResponsiveImage({
  src,
  alt,
  sizes = '100vw',
  className,
  objectFit = 'cover',
  aspectRatio,
  background = 'bg-gray-100',
  loadingStrategy = 'lazy',
  placeholderSize = 20,
  fadeIn = true,
  fallbackSrc = '/images/placeholder.svg',
  ...props
}: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [placeholder, setPlaceholder] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Generate a tiny placeholder image
  useEffect(() => {
    if (src && fadeIn) {
      generatePlaceholderImage(src, placeholderSize)
        .then(dataUrl => {
          setPlaceholder(dataUrl);
        })
        .catch(err => {
          console.error('Failed to generate placeholder:', err);
          // Continue without placeholder
        });
    }
  }, [src, placeholderSize, fadeIn]);

  // Reset state when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  // Helper to determine what src to display
  const displaySrc = error ? fallbackSrc : src;

  return (
    <div
      className={cn(
        'overflow-hidden relative',
        aspectRatio && `aspect-[${aspectRatio}]`,
        background,
        className
      )}
      role="img"
      aria-label={alt}
    >
      {/* Screen reader text for loading state */}
      {!loaded && !error && (
        <span className="sr-only">Loading image: {alt}</span>
      )}
      
      {/* Error message for screen readers */}
      {error && (
        <span className="sr-only">Image failed to load: {alt}</span>
      )}
      
      {/* Show placeholder while loading */}
      {placeholder && !loaded && (
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-cover blur-sm scale-105"
          style={{ backgroundImage: `url(${placeholder})` }}
          aria-hidden="true"
        />
      )}
      
      {/* Actual image */}
      <img
        src={displaySrc}
        alt={alt || "Image"} // Always require alt text
        loading={loadingStrategy}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'w-full h-full',
          {
            'object-cover': objectFit === 'cover',
            'object-contain': objectFit === 'contain',
            'object-fill': objectFit === 'fill',
            'object-none': objectFit === 'none',
            'object-scale-down': objectFit === 'scale-down',
            'opacity-0 transition-opacity duration-500': fadeIn && !loaded,
            'opacity-100': !fadeIn || loaded,
          }
        )}
        sizes={sizes}
        {...props}
      />
      
      {/* Error state visual indicator */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
          <div className="bg-white p-2 rounded-md shadow-sm text-sm text-gray-500 max-w-[80%] text-center">
            Unable to load image
          </div>
        </div>
      )}
    </div>
  );
}
