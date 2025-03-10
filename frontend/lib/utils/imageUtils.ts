/**
 * Utilities for handling image operations client-side
 */

/**
 * Calculate image dimensions while maintaining aspect ratio
 */
export const calculateAspectRatioDimensions = (
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number
): { width: number; height: number } => {
  // If no target dimensions, return original
  if (!targetWidth && !targetHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  // If only width specified, calculate height
  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }

  // If only height specified, calculate width
  if (!targetWidth && targetHeight) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }

  // If both specified, determine which constraint to follow
  if (targetWidth && targetHeight) {
    const widthRatio = targetWidth / originalWidth;
    const heightRatio = targetHeight / originalHeight;

    // Use the smaller ratio to ensure the image fits within constraints
    if (widthRatio < heightRatio) {
      return {
        width: targetWidth,
        height: Math.round(targetWidth / aspectRatio),
      };
    } else {
      return {
        width: Math.round(targetHeight * aspectRatio),
        height: targetHeight,
      };
    }
  }

  // Fallback to original dimensions
  return { width: originalWidth, height: originalHeight };
};

/**
 * Generate a placeholder image for server-side rendered pages
 */
export const generatePlaceholderImage = async (
  imageUrl: string,
  width: number = 20
): Promise<string> => {
  // Use browser environment only
  if (typeof window === 'undefined') {
    return '';
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate height based on aspect ratio
      const aspectRatio = img.width / img.height;
      const height = Math.round(width / aspectRatio);

      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Get base64 data URL
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.3);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
};

/**
 * Resize an image file before upload
 */
export const resizeImageFile = async (
  file: File,
  maxWidth: number = 1600,
  maxHeight: number = 1600,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions
      const { width, height } = calculateAspectRatioDimensions(
        img.width,
        img.height,
        maxWidth,
        maxHeight
      );

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not convert canvas to blob'));
          }
        },
        file.type,
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Check if a file is a valid image
 */
export const isValidImage = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  return validTypes.includes(file.type);
};

/**
 * Get image dimensions asynchronously
 */
export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

/**
 * Create an object URL from a blob or file
 */
export const createObjectURL = (file: File | Blob): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke an object URL when no longer needed to free memory
 */
export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Format image file size for display
 */
export const formatImageFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extract EXIF data from an image file (JPG only)
 */
export const extractExifData = async (file: File): Promise<Record<string, any> | null> => {
  // Only JPEGs have EXIF data
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
    return null;
  }

  // This is a simplified version - in a real app you would use a library like exif-js
  // For demonstration purposes, this is just returning a mock object
  return {
    make: 'Example Camera',
    model: 'DSLR X100',
    created: new Date().toISOString(),
    exposureTime: '1/100',
    fNumber: 'f/2.8',
    iso: '400',
    focalLength: '50mm',
  };
};
