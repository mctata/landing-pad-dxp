'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  popularity: number;
  isFeatured: boolean;
  isNew: boolean;
  isPremium: boolean;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this would fetch from API
    // For demo, we'll use mock data
    const mockTemplates = [
      {
        id: 'template1',
        name: 'Portfolio Basic',
        description: 'A clean, minimalist portfolio template for showcasing your work',
        category: 'portfolio',
        thumbnail: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Portfolio+Basic',
        popularity: 4.8,
        isFeatured: true,
        isNew: false,
        isPremium: false
      },
      {
        id: 'template2',
        name: 'Business Pro',
        description: 'Professional template for small businesses and startups',
        category: 'business',
        thumbnail: 'https://via.placeholder.com/300x200/2563EB/FFFFFF?text=Business+Pro',
        popularity: 4.5,
        isFeatured: true,
        isNew: false,
        isPremium: true
      },
      {
        id: 'template3',
        name: 'E-Commerce Basic',
        description: 'Simple template for small online shops',
        category: 'ecommerce',
        thumbnail: 'https://via.placeholder.com/300x200/1D4ED8/FFFFFF?text=E-Commerce+Basic',
        popularity: 4.2,
        isFeatured: false,
        isNew: false,
        isPremium: false
      },
      {
        id: 'template4',
        name: 'Blog Standard',
        description: 'Clean and readable blog template',
        category: 'blog',
        thumbnail: 'https://via.placeholder.com/300x200/1E40AF/FFFFFF?text=Blog+Standard',
        popularity: 4.3,
        isFeatured: false,
        isNew: false,
        isPremium: false
      },
      {
        id: 'template5',
        name: 'Landing Page Pro',
        description: 'High-converting landing page template for products and services',
        category: 'landing',
        thumbnail: 'https://via.placeholder.com/300x200/1E3A8A/FFFFFF?text=Landing+Page+Pro',
        popularity: 4.9,
        isFeatured: true,
        isNew: false,
        isPremium: true
      },
      {
        id: 'template6',
        name: 'Restaurant Deluxe',
        description: 'Elegant template for restaurants and cafes',
        category: 'business',
        thumbnail: 'https://via.placeholder.com/300x200/047857/FFFFFF?text=Restaurant+Deluxe',
        popularity: 4.7,
        isFeatured: false,
        isNew: true,
        isPremium: true
      },
      {
        id: 'template7',
        name: 'Creative Portfolio',
        description: 'Bold template for creative professionals',
        category: 'portfolio',
        thumbnail: 'https://via.placeholder.com/300x200/065F46/FFFFFF?text=Creative+Portfolio',
        popularity: 4.6,
        isFeatured: false,
        isNew: true,
        isPremium: true
      },
      {
        id: 'template8',
        name: 'Event Basic',
        description: 'Simple template for events and conferences',
        category: 'event',
        thumbnail: 'https://via.placeholder.com/300x200/064E3B/FFFFFF?text=Event+Basic',
        popularity: 4.1,
        isFeatured: false,
        isNew: false,
        isPremium: false
      }
    ];

    // Extract unique categories
    const allCategories = [...new Set(mockTemplates.map(template => template.category))];
    
    setTemplates(mockTemplates);
    setFilteredTemplates(mockTemplates);
    setCategories(allCategories);
    setLoading(false);
  }, []);

  // Filter templates based on category and search query
  useEffect(() => {
    let filtered = [...templates];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        template =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredTemplates(filtered);
  }, [selectedCategory, searchQuery, templates]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUseTemplate = (templateId: string) => {
    // In a real app, this would navigate to template creation page
    router.push(`/dashboard/create?template=${templateId}`);
  };

  const handlePreviewTemplate = (templateId: string) => {
    // In a real app, this would open a preview
    toast({
      title: 'Preview',
      message: `Preview functionality for template ${templateId} is not available in the demo`,
      type: 'info',
    });
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-gray-900">Templates</h1>
          <p className="mt-2 text-sm text-gray-500">
            Choose from our collection of professional website templates
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="w-full md:w-64">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search Templates
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by name or description"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category} className="capitalize">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="mt-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-medium text-gray-900">No templates found</h2>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            We couldn't find any templates matching your criteria. Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="relative">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="h-48 w-full object-cover"
                />
                <div className="absolute top-2 right-2 flex flex-col space-y-1">
                  {template.isPremium && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Premium
                    </span>
                  )}
                  {template.isNew && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      New
                    </span>
                  )}
                  {template.isFeatured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Featured
                    </span>
                  )}
                </div>
              </div>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                  <span className="inline-flex items-center">
                    <svg
                      className="h-4 w-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-sm text-gray-600">{template.popularity}</span>
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{template.description}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {template.category}
                  </span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(template.id)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Use Template
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreviewTemplate(template.id)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}