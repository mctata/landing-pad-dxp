import { api } from '../api';
import { Image } from '../store/useImageStore';

/**
 * Interface for Unsplash API responses
 */
interface UnsplashImage {
  id: string;
  created_at: string;
  updated_at: string;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
    portfolio_url: string | null;
    bio: string | null;
    location: string | null;
    links: {
      self: string;
      html: string;
      photos: string;
      likes: string;
      portfolio: string;
    };
  };
  tags?: Array<{ title: string }>;
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

/**
 * Convert Unsplash image to our internal Image format
 */
const mapUnsplashToImage = (unsplashImage: UnsplashImage): Image => {
  return {
    id: unsplashImage.id,
    url: unsplashImage.urls.regular,
    thumbnailUrl: unsplashImage.urls.thumb,
    name: unsplashImage.description || 'Unsplash Image',
    description: unsplashImage.alt_description || undefined,
    width: unsplashImage.width,
    height: unsplashImage.height,
    source: 'unsplash',
    createdAt: unsplashImage.created_at,
    alt: unsplashImage.alt_description || undefined,
    tags: unsplashImage.tags?.map(tag => tag.title) || [],
    // Additional Unsplash-specific metadata
    unsplashData: {
      user: {
        name: unsplashImage.user.name,
        username: unsplashImage.user.username,
        portfolioUrl: unsplashImage.user.portfolio_url,
      },
      downloadLink: unsplashImage.links.download,
      color: unsplashImage.color,
    },
  };
};

/**
 * Service for Unsplash API integration
 */
export const unsplashService = {
  /**
   * Search for images on Unsplash
   */
  searchImages: async (
    query: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<{
    results: Image[];
    total: number;
    total_pages: number;
  }> => {
    try {
      // Make request to our backend proxy to avoid exposing API keys
      const response = await api.get('/api/unsplash/search', {
        params: { query, page, per_page: perPage },
      });

      const data = response.data as UnsplashSearchResponse;

      return {
        results: data.results.map(mapUnsplashToImage),
        total: data.total,
        total_pages: data.total_pages,
      };
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      throw error;
    }
  },

  /**
   * Get a random image from Unsplash
   */
  getRandomImage: async (
    options: {
      query?: string;
      collections?: string;
      topics?: string;
      orientation?: 'landscape' | 'portrait' | 'squarish';
    } = {}
  ): Promise<Image> => {
    try {
      const response = await api.get('/api/unsplash/random', {
        params: options,
      });

      const data = response.data as UnsplashImage;
      return mapUnsplashToImage(data);
    } catch (error) {
      console.error('Error getting random Unsplash image:', error);
      throw error;
    }
  },

  /**
   * Get a specific image from Unsplash by ID
   */
  getImage: async (id: string): Promise<Image> => {
    try {
      const response = await api.get(`/api/unsplash/photos/${id}`);
      const data = response.data as UnsplashImage;
      return mapUnsplashToImage(data);
    } catch (error) {
      console.error(`Error getting Unsplash image (${id}):`, error);
      throw error;
    }
  },

  /**
   * Track an Unsplash download (required by their API terms)
   * This should be called whenever a user uses an Unsplash image
   */
  trackDownload: async (downloadLocation: string): Promise<void> => {
    try {
      await api.get('/api/unsplash/download', {
        params: { downloadLocation },
      });
    } catch (error) {
      console.error('Error tracking Unsplash download:', error);
      // Non-critical error, so we don't rethrow
    }
  },

  /**
   * Get popular collections from Unsplash
   */
  getCollections: async (
    page: number = 1,
    perPage: number = 10
  ): Promise<any[]> => {
    try {
      const response = await api.get('/api/unsplash/collections', {
        params: { page, per_page: perPage },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting Unsplash collections:', error);
      throw error;
    }
  },

  /**
   * Get images from a specific Unsplash collection
   */
  getCollectionPhotos: async (
    collectionId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<Image[]> => {
    try {
      const response = await api.get(`/api/unsplash/collections/${collectionId}/photos`, {
        params: { page, per_page: perPage },
      });
      return response.data.map(mapUnsplashToImage);
    } catch (error) {
      console.error(`Error getting photos from collection (${collectionId}):`, error);
      throw error;
    }
  },
};

export default unsplashService;
