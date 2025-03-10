import React, { useState, useEffect } from 'react';
import { useImageStore, Image } from '@/lib/store/useImageStore';
import { 
  TrashIcon, 
  PencilIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface ImageGalleryProps {
  onSelect: (image: Image) => void;
  className?: string;
}

export default function ImageGallery({ onSelect, className }: ImageGalleryProps) {
  const { 
    images, 
    isLoading, 
    error, 
    fetchImages, 
    deleteImage, 
    updateImage 
  } = useImageStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredImages, setFilteredImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    alt: '',
    description: '',
    tags: '',
  });
  
  // Fetch images on component mount
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);
  
  // Filter images based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredImages(images);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = images.filter(
      (image) =>
        image.name.toLowerCase().includes(query) ||
        (image.description && image.description.toLowerCase().includes(query)) ||
        (image.alt && image.alt.toLowerCase().includes(query)) ||
        (image.tags && image.tags.some((tag) => tag.toLowerCase().includes(query)))
    );
    
    setFilteredImages(filtered);
  }, [images, searchQuery]);
  
  // Handle image selection
  const handleImageClick = (image: Image) => {
    setSelectedImage(image.id === selectedImage?.id ? null : image);
  };
  
  // Confirm image selection
  const handleSelectImage = () => {
    if (selectedImage) {
      onSelect(selectedImage);
    }
  };
  
  // Handle image deletion
  const handleDeleteImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Confirm deletion
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await deleteImage(imageId);
        if (selectedImage?.id === imageId) {
          setSelectedImage(null);
        }
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
  };
  
  // Start editing image metadata
  const handleEditImage = (image: Image, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingImage(image);
    setEditForm({
      name: image.name,
      alt: image.alt || '',
      description: image.description || '',
      tags: image.tags ? image.tags.join(', ') : '',
    });
  };
  
  // Handle edit form changes
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  
  // Save edited image metadata
  const handleSaveEdit = async () => {
    if (!editingImage) return;
    
    try {
      const updates = {
        name: editForm.name,
        alt: editForm.alt,
        description: editForm.description,
        tags: editForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      };
      
      await updateImage(editingImage.id, updates);
      setEditingImage(null);
    } catch (error) {
      console.error('Failed to update image:', error);
    }
  };
  
  // Cancel edit
  const handleCancelEdit = () => {
    setEditingImage(null);
  };
  
  // Refresh gallery
  const handleRefresh = () => {
    fetchImages();
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="search"
              className="w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg"
              placeholder="Search your images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            title="Refresh"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <p className="mb-2">No images found</p>
            {searchQuery ? (
              <p className="text-sm">Try a different search term</p>
            ) : (
              <p className="text-sm">Upload some images to get started</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={cn(
                  'cursor-pointer rounded-lg overflow-hidden relative group border',
                  selectedImage?.id === image.id ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-gray-300'
                )}
                onClick={() => handleImageClick(image)}
              >
                {editingImage?.id === image.id ? (
                  <div className="p-3 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        className="mt-1 w-full text-sm border border-gray-300 rounded-md p-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Alt Text</label>
                      <input
                        type="text"
                        name="alt"
                        value={editForm.alt}
                        onChange={handleEditFormChange}
                        className="mt-1 w-full text-sm border border-gray-300 rounded-md p-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={handleEditFormChange}
                        className="mt-1 w-full text-sm border border-gray-300 rounded-md p-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Tags (comma separated)</label>
                      <input
                        type="text"
                        name="tags"
                        value={editForm.tags}
                        onChange={handleEditFormChange}
                        className="mt-1 w-full text-sm border border-gray-300 rounded-md p-1"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 text-white bg-primary hover:bg-primary/90 rounded"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="aspect-square">
                      <img
                        src={image.thumbnailUrl || image.url}
                        alt={image.alt || image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity" />
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditImage(image, e)}
                        className="p-1 bg-white rounded-md text-gray-700 hover:text-gray-900 shadow-sm"
                        title="Edit Image"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteImage(image.id, e)}
                        className="p-1 bg-white rounded-md text-red-500 hover:text-red-700 shadow-sm"
                        title="Delete Image"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    {selectedImage?.id === image.id && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-xs py-1 px-2">
                        Selected
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="truncate font-medium">{image.name}</div>
                      <div className="text-gray-300 text-xs">{formatDate(image.createdAt)}</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <button
          onClick={handleSelectImage}
          disabled={!selectedImage}
          className={cn(
            'w-full px-4 py-2 text-sm font-medium rounded-md',
            !selectedImage
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90'
          )}
        >
          {selectedImage ? 'Use Selected Image' : 'Select an Image'}
        </button>
      </div>
    </div>
  );
}
