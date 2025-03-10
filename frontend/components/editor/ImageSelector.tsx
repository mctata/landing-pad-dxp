import React, { useState, useCallback, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { PhotoIcon, ArrowUpTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Image } from '@/lib/store/useImageStore';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

import ImageUploader from './ImageUploader';
import UnsplashBrowser from './UnsplashBrowser';
import ImageGallery from './ImageGallery';

interface ImageSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  className?: string;
  placeholder?: string;
  previewClassName?: string;
  buttonText?: string;
  required?: boolean;
}

export default function ImageSelector({
  value,
  onChange,
  label = 'Image',
  description,
  className,
  placeholder = 'No image selected',
  previewClassName,
  buttonText = 'Select Image',
  required = false,
}: ImageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [initialRender, setInitialRender] = useState(true);
  const dialogId = React.useId();

  // Focus first interactive element when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    
    // Give time for the dialog to render
    const timer = setTimeout(() => {
      const firstTab = document.querySelector('[role="tab"]') as HTMLElement;
      if (firstTab) {
        firstTab.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Reset initial render flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setInitialRender(true);
    } else if (initialRender) {
      // After first render, set flag to false
      setInitialRender(false);
    }
  }, [isOpen, initialRender]);

  // Callback for when an image is selected
  const handleImageSelect = useCallback(
    (image: Image) => {
      onChange(image.url);
      setIsOpen(false);
    },
    [onChange]
  );

  // Handle removing the selected image
  const handleRemoveImage = useCallback(() => {
    onChange('');
  }, [onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Close dialog on ESC key
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  // Tabs for the image selector dialog
  const tabs = [
    {
      name: 'Upload',
      icon: ArrowUpTrayIcon,
      content: (
        <ImageUploader
          onUploadSuccess={url => onChange(url)}
          onUploadError={() => {}}
          className="p-4"
        />
      ),
    },
    {
      name: 'Unsplash',
      icon: MagnifyingGlassIcon,
      content: <UnsplashBrowser onSelect={handleImageSelect} />,
    },
    {
      name: 'Gallery',
      icon: PhotoIcon,
      content: <ImageGallery onSelect={handleImageSelect} />,
    },
  ];

  // Generate unique IDs for form elements
  const labelId = `image-selector-label-${dialogId}`;
  const descriptionId = `image-selector-description-${dialogId}`;

  return (
    <div className={cn('space-y-2', className)} onKeyDown={handleKeyDown}>
      {/* Accessible label and description */}
      {label && (
        <div className="flex justify-between">
          <label 
            id={labelId} 
            className={cn(
              "block text-sm font-medium text-gray-700",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        </div>
      )}
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-500">
          {description}
        </p>
      )}
      
      <div className="space-y-2">
        {value ? (
          <div className="relative group">
            <ResponsiveImage
              src={value}
              alt={label || "Selected image"}
              className={cn(
                'rounded-md w-full object-cover',
                previewClassName
              )}
              aspectRatio="16/9"
              loadingStrategy="eager"
            />
            <div 
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
              aria-hidden="true"
            >
              <div className="flex space-x-2">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white hover:bg-gray-100 text-gray-800 border-gray-200 shadow-sm"
                      aria-label="Change image"
                      aria-haspopup="dialog"
                      aria-expanded={isOpen}
                      aria-controls={dialogId}
                    >
                      Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    id={dialogId}
                    className="sm:max-w-[800px] p-0"
                    aria-labelledby={`${dialogId}-title`}
                  >
                    <DialogHeader className="p-4 pb-0">
                      <DialogTitle id={`${dialogId}-title`}>Select an Image</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col h-[600px]">
                      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                        <Tab.List className="flex border-b">
                          {tabs.map((tab, idx) => (
                            <Tab
                              key={tab.name}
                              className={({ selected }) =>
                                cn(
                                  'flex items-center gap-2 px-4 py-2 text-sm font-medium min-w-[120px] min-h-[44px]',
                                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                                  selected
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                )
                              }
                            >
                              <tab.icon className="h-5 w-5" aria-hidden="true" />
                              {tab.name}
                            </Tab>
                          ))}
                        </Tab.List>
                        <Tab.Panels className="flex-1 overflow-hidden">
                          {tabs.map((tab, idx) => (
                            <Tab.Panel
                              key={idx}
                              className="h-full overflow-auto focus:outline-none"
                              tabIndex={0}
                            >
                              {tab.content}
                            </Tab.Panel>
                          ))}
                        </Tab.Panels>
                      </Tab.Group>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRemoveImage}
                  className="bg-white hover:bg-red-50 text-red-600 border-gray-200 shadow-sm hover:border-red-200"
                  aria-label="Remove image"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex justify-center items-center w-full border-2 border-dashed border-gray-300 rounded-md p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-labelledby={label ? labelId : undefined}
                aria-describedby={description ? descriptionId : undefined}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-required={required}
              >
                <div className="space-y-1 text-gray-500">
                  <PhotoIcon className="mx-auto h-12 w-12" aria-hidden="true" />
                  <div className="text-sm font-medium">{buttonText}</div>
                  <p className="text-xs">{placeholder}</p>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent 
              id={dialogId}
              className="sm:max-w-[800px] p-0"
              aria-labelledby={`${dialogId}-title`}
            >
              <DialogHeader className="p-4 pb-0">
                <DialogTitle id={`${dialogId}-title`}>Select an Image</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col h-[600px]">
                <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                  <Tab.List className="flex border-b">
                    {tabs.map((tab, idx) => (
                      <Tab
                        key={tab.name}
                        className={({ selected }) =>
                          cn(
                            'flex items-center gap-2 px-4 py-2 text-sm font-medium min-w-[120px] min-h-[44px]',
                            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                            selected
                              ? 'border-b-2 border-primary text-primary'
                              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          )
                        }
                      >
                        <tab.icon className="h-5 w-5" aria-hidden="true" />
                        {tab.name}
                      </Tab>
                    ))}
                  </Tab.List>
                  <Tab.Panels className="flex-1 overflow-hidden">
                    {tabs.map((tab, idx) => (
                      <Tab.Panel
                        key={idx}
                        className="h-full overflow-auto focus:outline-none"
                        tabIndex={0}
                      >
                        {tab.content}
                      </Tab.Panel>
                    ))}
                  </Tab.Panels>
                </Tab.Group>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Visually hidden but screen reader accessible status */}
      <div aria-live="polite" className="sr-only">
        {value 
          ? `Image selected: ${label || "Image"}`
          : `No ${label || "image"} selected`
        }
      </div>
    </div>
  );
}
