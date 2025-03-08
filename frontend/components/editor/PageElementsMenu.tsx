'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ElementCategory {
  name: string;
  elements: ElementType[];
}

interface ElementType {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface PageElementsMenuProps {
  onAddElement: (elementType: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PageElementsMenu({ onAddElement, isOpen, onClose }: PageElementsMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Define element categories
  const categories: ElementCategory[] = [
    {
      name: 'Layout',
      elements: [
        {
          type: 'hero',
          name: 'Hero Section',
          description: 'Large banner section typically used at the top of a page',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          type: 'features',
          name: 'Features Grid',
          description: 'Display product or service features in a grid layout',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
      ],
    },
    {
      name: 'Content',
      elements: [
        {
          type: 'text',
          name: 'Text Block',
          description: 'Simple text content with heading and body text',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          ),
        },
        {
          type: 'image',
          name: 'Image',
          description: 'Single image with optional caption',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          type: 'gallery',
          name: 'Gallery',
          description: 'Display multiple images in a grid or slider',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
      ],
    },
    {
      name: 'Commerce',
      elements: [
        {
          type: 'pricing',
          name: 'Pricing Table',
          description: 'Display product or service pricing options',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          type: 'cta',
          name: 'Call to Action',
          description: 'Prompt visitors to take a specific action',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          ),
        },
      ],
    },
    {
      name: 'Social Proof',
      elements: [
        {
          type: 'testimonials',
          name: 'Testimonials',
          description: 'Display customer reviews and feedback',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          ),
        },
      ],
    },
    {
      name: 'Contact',
      elements: [
        {
          type: 'contact',
          name: 'Contact Form',
          description: 'Allow visitors to get in touch with you',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      name: 'Advanced',
      elements: [
        {
          type: 'custom',
          name: 'Custom HTML',
          description: 'Add your own custom HTML code',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          ),
        },
      ],
    },
  ];
  
  // Get all elements for "All" category
  const allElements = categories.flatMap(category => category.elements);
  
  // Filter elements based on search query and selected category
  const getFilteredElements = () => {
    let elements = selectedCategory === 'all' 
      ? allElements 
      : categories.find(cat => cat.name.toLowerCase() === selectedCategory.toLowerCase())?.elements || [];
      
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      elements = elements.filter(
        element => 
          element.name.toLowerCase().includes(lowerQuery) || 
          element.description.toLowerCase().includes(lowerQuery)
      );
    }
    
    return elements;
  };
  
  const filteredElements = getFilteredElements();
  
  if (!isOpen) return null;
  
  return (
    <div className="w-80 border-r border-secondary-200 bg-white h-full flex flex-col">
      <div className="p-4 border-b border-secondary-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-secondary-900">Elements</h3>
          <button
            type="button"
            className="h-8 w-8 rounded-md text-secondary-500 hover:bg-secondary-100 flex items-center justify-center"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search elements..."
            className="input-field pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-secondary-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      
      {/* Categories tabs */}
      <div className="border-b border-secondary-200 overflow-x-auto">
        <div className="flex">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
            }`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                selectedCategory === category.name.toLowerCase()
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
              onClick={() => setSelectedCategory(category.name.toLowerCase())}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Elements list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredElements.length === 0 ? (
          <div className="text-center py-8 text-secondary-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-secondary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-sm font-medium">No elements found</p>
            <p className="text-xs mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredElements.map((element) => (
              <button
                key={element.type}
                type="button"
                className="flex items-start p-3 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors duration-150"
                onClick={() => {
                  onAddElement(element.type);
                  onClose();
                }}
              >
                <div className="h-10 w-10 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  {element.icon}
                </div>
                <div className="ml-3 text-left">
                  <h4 className="text-sm font-medium text-secondary-900">{element.name}</h4>
                  <p className="text-xs text-secondary-500 mt-1">{element.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* AI suggestion */}
      <div className="p-4 border-t border-secondary-200 bg-secondary-50">
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-secondary-900">AI Suggestions</h4>
            <p className="text-xs text-secondary-600 mt-1">
              Let AI recommend elements based on your website content and goals.
            </p>
            <button
              type="button"
              className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Get suggestions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}