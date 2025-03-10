import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MagnifyingGlassIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { useImageStore, Image } from '@/lib/store/useImageStore';
import { unsplashService } from '@/lib/services/unsplashService';
import { cn } from '@/lib/utils';

interface UnsplashBrowserProps {
  onSelect: (image: Image) => void;
  className?: string;
}

export default function UnsplashBrowser({ onSelect, className }: UnsplashBrowserProps) {
  const [query, setQuery] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [showCollection, setShowCollection] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedImageRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const debouncedSearch = useCallback(
    (value: string) => {
      const handler = setTimeout(() => {
        setQuery(value);
        setPage(1);
      }, 500);

      return () => {
        clearTimeout(handler);
      };
    },
    [],
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  // Focus on search input when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Scroll selected image into view
  useEffect(() => {
    if (selectedImage && selectedImageRef.current) {
      selectedImageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedImage]);

  // Search Unsplash for images
  const searchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (selectedCollection) {
        // If a collection is selected, fetch images from that collection
        const collectionImages = await unsplashService.getCollectionPhotos(
          selectedCollection,
          page
        );
        setImages(collectionImages);
        // For collections, we don't get total pages in the same way
        setTotalPages(Math.max(5, page)); // Just show more pages as user navigates
      } else if (query) {
        // Search by query
        const searchResult = await unsplashService.searchImages(query, page);
        setImages(searchResult.results);
        setTotalPages(searchResult.total_pages);
      } else {
        // Get random images if no query provided
        const randomImages = await Promise.all(
          Array(12).fill(0).map(() => unsplashService.getRandomImage())
        );
        setImages(randomImages);
        setTotalPages(1);
      }
    } catch (err) {
      setError('Failed to fetch images from Unsplash');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query, page, selectedCollection]);

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedCollections = await unsplashService.getCollections();
      setCollections(fetchedCollections);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setLoading(false);
    }
  }, []);

  // Load images when query or page changes
  useEffect(() => {
    searchImages();
  }, [searchImages]);

  // Fetch collections on initial load
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Handle image selection
  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };

  // Handle image selection via keyboard
  const handleImageKeyDown = (e: React.KeyboardEvent, image: Image) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedImage(image);
    }
  };

  // Confirm image selection
  const handleSelectImage = () => {
    if (selectedImage) {
      onSelect(selectedImage);
    }
  };

  // Handle collection selection
  const handleCollectionClick = (id: string) => {
    setSelectedCollection(id === selectedCollection ? null : id);
    setPage(1);
  };

  // Toggle between search and collections
  const toggleCollectionView = () => {
    setShowCollection(!showCollection);
    if (!showCollection && collections.length === 0) {
      fetchCollections();
    }
  };

  // Handle pagination
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
      // Focus back to the top of the results
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      // Focus back to the top of the results
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {loading && 'Loading images, please wait...'}
        {error && `Error: ${error}`}
        {selectedImage && `Selected image: ${selectedImage.alt || selectedImage.name}`}
      </div>

      <div className="p-4 border-b">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              className="w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg"
              placeholder="Search Unsplash..."
              value={searchValue}
              onChange={handleSearchChange}
              ref={searchInputRef}
              aria-label="Search Unsplash images"
            />
          </div>
          <button
            onClick={toggleCollectionView}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md',
              showCollection
                ? 'bg-primary/10 text-primary'
                : 'text-gray-700 hover:bg-gray-100'
            )}
            aria-pressed={showCollection}
            aria-label={showCollection ? "Show search" : "Show collections"}
          >
            {showCollection ? 'Search' : 'Collections'}
          </button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto"
        role="region" 
        aria-label={showCollection ? "Unsplash collections" : "Unsplash images"}
      >
        {loading ? (
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
        ) : showCollection ? (
          <div 
            className="grid grid-cols-2 gap-4 p-4"
            role="grid"
            aria-label="Unsplash collections"
          >
            {collections.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                No collections found
              </div>
            ) : (
              collections.map((collection) => (
                <div
                  key={collection.id}
                  className={cn(
                    'cursor-pointer rounded-lg overflow-hidden relative group',
                    selectedCollection === collection.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => handleCollectionClick(collection.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCollectionClick(collection.id);
                    }
                  }}
                  role="gridcell"
                  tabIndex={0}
                  aria-selected={selectedCollection === collection.id}
                >
                  {collection.preview_photos?.[0] && (
                    <img
                      src={collection.preview_photos[0].urls.small}
                      alt={`${collection.title} collection preview`}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <h3 className="text-white font-medium text-sm px-2 text-center">
                      {collection.title}
                    </h3>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div 
            className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4"
            role="grid"
            aria-label="Unsplash images search results"
          >
            {images.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No images found. Try a different search term.
              </div>
            ) : (
              images.map((image) => (
                <div
                  key={image.id}
                  ref={selectedImage?.id === image.id ? selectedImageRef : null}
                  className={cn(
                    'cursor-pointer rounded-lg overflow-hidden relative group',
                    selectedImage?.id === image.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => handleImageClick(image)}
                  onKeyDown={(e) => handleImageKeyDown(e, image)}
                  role="gridcell"
                  tabIndex={0}
                  aria-selected={selectedImage?.id === image.id}
                  aria-label={image.alt || image.name}
                >
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.alt || image.name}
                    className="w-full h-40 object-cover"
                  />
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <ArrowsPointingOutIcon className="w-6 h-6 text-white" />
                  </div>
                  {selectedImage?.id === image.id && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-xs py-1 px-2">
                      Selected
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={page <= 1}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded min-w-[80px] min-h-[36px]',
                page <= 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
              aria-label="Previous page"
              aria-disabled={page <= 1}
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded min-w-[80px] min-h-[36px]',
                page >= totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
              aria-label="Next page"
              aria-disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
          <button
            onClick={handleSelectImage}
            disabled={!selectedImage}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md min-w-[150px] min-h-[36px]',
              !selectedImage
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            )}
            aria-disabled={!selectedImage}
          >
            Use Selected Image
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Photos provided by{' '}
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Unsplash
          </a>
          {selectedImage?.unsplashData?.user && (
            <span className="block mt-1">
              Photo by{' '}
              <a
                href={`https://unsplash.com/@${selectedImage.unsplashData.user.username}?utm_source=landing_pad&utm_medium=referral`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {selectedImage.unsplashData.user.name}
              </a>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
