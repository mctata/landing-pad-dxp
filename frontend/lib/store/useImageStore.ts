import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, apiHelpers } from '../api';

export type ImageSource = 'upload' | 'unsplash' | 'gallery';

export interface Image {
  id: string;
  url: string;
  thumbnailUrl?: string;
  name: string;
  description?: string;
  width?: number;
  height?: number;
  source: ImageSource;
  createdAt: string;
  alt?: string;
  tags?: string[];
}

interface ImageState {
  images: Image[];
  selectedImage: Image | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchImages: () => Promise<void>;
  uploadImage: (file: File, metadata?: Partial<Image>) => Promise<Image>;
  deleteImage: (id: string) => Promise<void>;
  updateImage: (id: string, updates: Partial<Image>) => Promise<void>;
  selectImage: (image: Image | null) => void;
  searchUnsplash: (query: string) => Promise<Image[]>;
  fetchUnsplashImage: (id: string) => Promise<Image>;
}

export const useImageStore = create<ImageState>()(
  persist(
    (set, get) => ({
      images: [],
      selectedImage: null,
      isLoading: false,
      error: null,

      fetchImages: async () => {
        set({ isLoading: true, error: null });
        try {
          const images = await apiHelpers.get('/images');
          set({ images, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch images', 
            isLoading: false 
          });
        }
      },

      uploadImage: async (file: File, metadata?: Partial<Image>) => {
        set({ isLoading: true, error: null });
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          if (metadata) {
            Object.entries(metadata).forEach(([key, value]) => {
              if (value !== undefined) {
                formData.append(key, String(value));
              }
            });
          }

          const response = await api.post('/images/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          const newImage = response.data;
          set(state => ({ 
            images: [...state.images, newImage],
            isLoading: false 
          }));
          
          return newImage;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to upload image', 
            isLoading: false 
          });
          throw error;
        }
      },

      deleteImage: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiHelpers.delete(`/images/${id}`);
          set(state => ({ 
            images: state.images.filter(image => image.id !== id),
            selectedImage: state.selectedImage?.id === id ? null : state.selectedImage,
            isLoading: false 
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete image', 
            isLoading: false 
          });
          throw error;
        }
      },

      updateImage: async (id: string, updates: Partial<Image>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedImage = await apiHelpers.put(`/images/${id}`, updates);
          set(state => ({ 
            images: state.images.map(img => img.id === id ? { ...img, ...updatedImage } : img),
            selectedImage: state.selectedImage?.id === id ? { ...state.selectedImage, ...updatedImage } : state.selectedImage,
            isLoading: false 
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update image', 
            isLoading: false 
          });
          throw error;
        }
      },

      selectImage: (image: Image | null) => {
        set({ selectedImage: image });
      },
      
      searchUnsplash: async (query: string) => {
        set({ isLoading: true, error: null });
        try {
          const results = await apiHelpers.get('/images/unsplash/search', { query });
          set({ isLoading: false });
          return results.map((item: any) => ({
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
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to search Unsplash', 
            isLoading: false 
          });
          return [];
        }
      },
      
      fetchUnsplashImage: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const item = await apiHelpers.get(`/images/unsplash/${id}`);
          set({ isLoading: false });
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
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch Unsplash image', 
            isLoading: false 
          });
          throw error;
        }
      },
    }),
    {
      name: 'landing-pad-images',
      partialize: (state) => ({ images: state.images }),
    }
  )
);
