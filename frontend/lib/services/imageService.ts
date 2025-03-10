import { apiHelpers } from '../api';
import { Image, ImageSource } from '../store/useImageStore';

/**
 * Service for handling image-related API operations
 */
export const imageService = {
  /**
   * Get all images for the current user/project
   */
  getAllImages: async (): Promise<Image[]> => {
    return apiHelpers.get('/images');
  },

  /**
   * Upload an image to the server
   */
  uploadImage: async (file: File, metadata?: Partial<Image>): Promise<Image> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }

    return response.json();
  },

  /**
   * Delete an image from the server
   */
  deleteImage: async (id: string): Promise<void> => {
    await apiHelpers.delete(`/images/${id}`);
  },

  /**
   * Update image metadata
   */
  updateImage: async (id: string, updates: Partial<Image>): Promise<Image> => {
    return apiHelpers.put(`/images/${id}`, updates);
  },

  /**
   * Get a single image by ID
   */
  getImage: async (id: string): Promise<Image> => {
    return apiHelpers.get(`/images/${id}`);
  },

  /**
   * Optimize an image (resize, compress, etc.)
   */
  optimizeImage: async (
    id: string, 
    options: { 
      width?: number; 
      height?: number; 
      quality?: number; 
      format?: 'jpeg' | 'png' | 'webp'; 
    }
  ): Promise<Image> => {
    return apiHelpers.post(`/images/${id}/optimize`, options);
  },

  /**
   * Generate different image sizes for responsive design
   */
  generateResponsiveImages: async (
    id: string,
    sizes: number[]
  ): Promise<{ [size: string]: string }> => {
    return apiHelpers.post(`/images/${id}/responsive`, { sizes });
  },
};

/**
 * Service for handling Unsplash API operations
 */
export const unsplashService = {
  /**
   * Search for images on Unsplash
   */
  searchImages: async (query: string, page: number = 1, perPage: number = 20): Promise<{
    results: Image[];
    total: number;
    total_pages: number;
  }> => {
    const response = await apiHelpers.get('/images/unsplash/search', { 
      query, 
      page, 
      per_page: perPage 
    });
    
    // Map Unsplash response to our Image type
    return {
      results: response.results.map((item: any) => ({
        id: item.id,
        url: item.urls.regular,
        thumbnailUrl: item.urls.thumb,
        name: item.description || 'Unsplash Image',
        description: item.alt_description,
        width: item.width,
        height: item.height,
        source: 'unsplash' as ImageSource,
        createdAt: item.created_at,
        alt: item.alt_description,
        tags: item.tags?.map((tag: any) => tag.title) || [],
      })),
      total: response.total,
      total_pages: response.total_pages,
    };
  },

  /**
   * Get a random image from Unsplash
   */
  getRandomImage: async (query?: string): Promise<Image> => {
    const params: Record<string, any> = {};
    if (query) params.query = query;
    
    const item = await apiHelpers.get('/images/unsplash/random', params);
    
    return {
      id: item.id,
      url: item.urls.regular,
      thumbnailUrl: item.urls.thumb,
      name: item.description || 'Unsplash Image',
      description: item.alt_description,
      width: item.width,
      height: item.height,
      source: 'unsplash' as ImageSource,
      createdAt: item.created_at,
      alt: item.alt_description,
      tags: item.tags?.map((tag: any) => tag.title) || [],
    };
  },

  /**
   * Get a specific image from Unsplash
   */
  getImage: async (id: string): Promise<Image> => {
    const item = await apiHelpers.get(`/images/unsplash/${id}`);
    
    return {
      id: item.id,
      url: item.urls.regular,
      thumbnailUrl: item.urls.thumb,
      name: item.description || 'Unsplash Image',
      description: item.alt_description,
      width: item.width,
      height: item.height,
      source: 'unsplash' as ImageSource,
      createdAt: item.created_at,
      alt: item.alt_description,
      tags: item.tags?.map((tag: any) => tag.title) || [],
    };
  },
};
