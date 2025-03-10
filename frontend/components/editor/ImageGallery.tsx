import React, { useState, useEffect, useRef } from 'react';
import { useImageStore, Image } from '@/lib/store/useImageStore';
import { 
  TrashIcon, 
  PencilIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  } = useImageStore(
    (state) => ({
      images: state.images,
      fetchImages: state.fetchImages,
      deleteImage: state.deleteImage,
      updateImage: state.updateImage,
      isLoading: state.isLoading,
      error: state.error,
    })
  );
  
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedImageRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Focus name input when editing
  useEffect(() => {
    if (editingImage && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editingImage]);

  // Scroll selected image into view
  useEffect(() => {
    if (selectedImage && selectedImageRef.current) {
      selectedImageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedImage]);
  
  // Handle image selection
  const handleImageClick = (image: Image) => {
    setSelectedImage(image.id === selectedImage?.id ? null : image);
  };
  
  // Handle image keyboard navigation
  const handleImageKeyDown = (e: React.KeyboardEvent, image: Image) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedImage(image.id === selectedImage?.id ? null : image);
    }
  };
  
  // Confirm image selection
  const handleSelectImage = () => {
    if (selectedImage) {
      onSelect(selectedImage);
    }
  };
  
  // Handle image deletion confirmation
  const handleDeleteImage = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageToDelete(imageId);
    setShowDeleteConfirm(true);
  };
  
  // Actually perform the deletion
  const confirmDeleteImage = async () => {
    if (imageToDelete) {
      try {
        await deleteImage(imageToDelete);
        if (selectedImage?.id === imageToDelete) {
          setSelectedImage(null);
        }
        setShowDeleteConfirm(false);
        setImageToDelete(null);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
  };
  
  // Cancel deletion
  const cancelDeleteImage = () => {
    setShowDeleteConfirm(false);
    setImageToDelete(null);
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

  // Handle form submission with Enter key
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {isLoading && 'Loading your images, please wait...'}
        {error && `Error: ${error}`}
        {selectedImage && `Selected image: ${selectedImage.alt || selectedImage.name}`}
      </div>

      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              className="w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg"
              placeholder="Search your images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              ref={searchInputRef}
              aria-label="Search your images"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Refresh"
            aria-label="Refresh image gallery"
          >
            <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto"
        role="region" 
        aria-label="Image gallery"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
              role="status"
              aria-label="Loading images"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500" role="alert">
            {error}
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <p className="mb-2">No images found</p>
            {searchQuery ? (
              <p className="text-sm">Try a different search term</p>
            ) : (
              <div className="text-center">
                <p className="text-sm mb-4">Upload some images to get started</p>
                <Button 
                  onClick={() => {
                    // This would navigate to upload tab or show upload dialog
                    // For now, just refreshing in case images exist but failed to load
                    handleRefresh();
                  }}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Upload Your First Image
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4"
            role="grid"
            aria-label="Your images"
          >
            {filteredImages.map((image) => (
              <div
                key={image.id}
                ref={selectedImage?.id === image.id ? selectedImageRef : null}
                className={cn(
                  'cursor-pointer rounded-lg overflow-hidden relative group border image-gallery-item',
                  selectedImage?.id === image.id ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-gray-300'
                )}
                onClick={() => handleImageClick(image)}
                onKeyDown={(e) => handleImageKeyDown(e, image)}
                role="gridcell"
                tabIndex={0}
                aria-selected={selectedImage?.id === image.id}
                aria-label={image.alt || image.name}
              >
                {editingImage?.id === image.id ? (
                  <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <label htmlFor={`image-name-${image.id}`} className="block text-xs font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        id={`image-name-${image.id}`}
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        className="mt-1 w-full text-sm border border-gray-300 rounded-md p-1"
                        ref={nameInputRef}
                        onKeyDown={handleFormKeyDown}
                      />
                    </div>
                    <div>
                      <label htmlFor={`image-alt-${image.id}`} className="block text-xs font-medium text-gray-700">Alt Text</label>
                      <input
                        type="text"
                        id={`image-alt-${image.id}`}
                        name="alt"
                        value={editForm.alt}
                        onChange={handleEditFormChange}
                        className="mt-1 w-full text-sm border border-gray-300 rounded-md p-1"
                        aria-describedby={`alt-desc-${image.id}`}
                        onKeyDown={handleFormKeyDown}
                      />
                      <p id={`alt-desc-${image.id}`} className="text-xs text-gray-500 mt-1">
                        Describe the image for screen readers
                      </p>
                    </div>
                    <div>
                      <label htmlFor={`image-desc-${image.id}`} className="block text-xs font-medium text-gray-700">Description</label>
                      <textarea
                        id={`image-desc-${image.id}`}
                        name="description"
                        value={editForm.description}
                        onChange={handleEditFormChange}
                        className="mt-1 w-full text-sm border border-gray-300 rounded-md p-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label htmlFor={`image-tags-${image.id}`} className="block text-xs font-medium text-gray-700">Tags (comma separated)</label>
                      <input
                        type="text"
                        id={`image-tags-${image.id}`}
                        name="tags"
                        value={editForm.tags}
                        onChange={handleEditFormChange}
                        className="mt-1 w-full text-sm border border-gray-300 rounded-md p-1"
                        onKeyDown={handleFormKeyDown}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label="Cancel editing"
                      >
                        <XMarkIcon className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 text-white bg-primary hover:bg-primary/90 rounded min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label="Save changes"
                      >
                        <CheckIcon className="w-4 h-4" aria-hidden="true" />
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
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity" aria-hidden="true" />
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditImage(image, e)}
                        className="p-2 bg-white rounded-md text-gray-700 hover:text-gray-900 shadow-sm min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Edit Image"
                        aria-label={`Edit ${image.name}`}
                      >
                        <PencilIcon className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteImage(image.id, e)}
                        className="p-2 bg-white rounded-md text-red-500 hover:text-red-700 shadow-sm min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Delete Image"
                        aria-label={`Delete ${image.name}`}
                      >
                        <TrashIcon className="w-4 h-4" aria-hidden="true" />
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
            'w-full px-4 py-2 text-sm font-medium rounded-md min-h-[44px]',
            !selectedImage
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90'
          )}
          aria-disabled={!selectedImage}
        >
          {selectedImage ? 'Use Selected Image' : 'Select an Image'}
        </button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this image? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={cancelDeleteImage}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteImage}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
