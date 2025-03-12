import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
  DocumentPlusIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  XCircleIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  author: {
    name: string;
    id: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  preview?: string;
}

interface PaginationData {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

const contentTypes = [
  { id: 'all', name: 'All Content' },
  { id: 'template', name: 'Templates' },
  { id: 'page', name: 'Pages' },
  { id: 'section', name: 'Sections' },
  { id: 'component', name: 'Components' },
];

// Mock content data for development
const generateMockContent = (): ContentItem[] => {
  return [
    {
      id: '1',
      title: 'Landing Page Template',
      type: 'template',
      status: 'published',
      author: {
        name: 'John Doe',
        id: '2'
      },
      tags: ['landing', 'marketing'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      preview: 'https://example.com/landing-template.jpg'
    },
    {
      id: '2',
      title: 'Portfolio Template',
      type: 'template',
      status: 'published',
      author: {
        name: 'Jane Smith',
        id: '3'
      },
      tags: ['portfolio', 'personal'],
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      preview: 'https://example.com/portfolio-template.jpg'
    },
    {
      id: '3',
      title: 'Hero Section',
      type: 'section',
      status: 'published',
      author: {
        name: 'Admin User',
        id: '1'
      },
      tags: ['hero', 'featured'],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      preview: 'https://example.com/hero-section.jpg'
    },
    {
      id: '4',
      title: 'Contact Form Component',
      type: 'component',
      status: 'published',
      author: {
        name: 'Robert Johnson',
        id: '4'
      },
      tags: ['form', 'contact'],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      preview: 'https://example.com/contact-form.jpg'
    },
    {
      id: '5',
      title: 'Blog Page',
      type: 'page',
      status: 'draft',
      author: {
        name: 'Emily Davis',
        id: '5'
      },
      tags: ['blog', 'content'],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: null,
      preview: 'https://example.com/blog-page.jpg'
    },
    {
      id: '6',
      title: 'E-commerce Template',
      type: 'template',
      status: 'draft',
      author: {
        name: 'John Doe',
        id: '2'
      },
      tags: ['ecommerce', 'shop'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: null,
      preview: 'https://example.com/ecommerce-template.jpg'
    },
    {
      id: '7',
      title: 'Footer Component',
      type: 'component',
      status: 'published',
      author: {
        name: 'Jane Smith',
        id: '3'
      },
      tags: ['footer', 'layout'],
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      preview: 'https://example.com/footer-component.jpg'
    }
  ];
};

export const ContentManagement: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    totalItems: 0,
    itemsPerPage: 12,
    currentPage: 1,
    totalPages: 0
  });

  // Fetch content data
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get('/api/admin/content', {
          params: {
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            type: activeTab !== 'all' ? activeTab : undefined,
            search: searchQuery || undefined
          }
        });
        
        if (response.data && response.data.content) {
          setContent(response.data.content);
          setPagination(prev => ({ 
            ...prev,
            totalItems: response.data.pagination.totalItems,
            totalPages: response.data.pagination.totalPages,
            currentPage: response.data.pagination.currentPage
          }));
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content');
        
        // Fallback to mock data during development
        if (process.env.NODE_ENV === 'development') {
          const mockData = generateMockContent();
          setContent(mockData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [activeTab, searchQuery, pagination.currentPage, pagination.itemsPerPage]);

  // Filter content based on active tab and search query
  useEffect(() => {
    let filtered = [...content];
    
    // Filter by content type
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.type === activeTab);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Sort by last updated
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    setFilteredContent(filtered);
    
    // Update pagination
    setPagination({
      ...pagination,
      totalItems: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pagination.itemsPerPage))
    });
  }, [content, activeTab, searchQuery, pagination.itemsPerPage]);
  
  // Get paginated content
  const getPaginatedContent = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredContent.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handleContentClick = (content: ContentItem) => {
    setSelectedContent(content);
    setIsPreviewModalOpen(true);
  };

  const handleDeleteClick = (content: ContentItem) => {
    setSelectedContent(content);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedContent) return;
    
    try {
      await axios.delete(`/api/admin/content/${selectedContent.id}`);
      
      // Update local state
      setContent(prev => prev.filter(item => item.id !== selectedContent.id));
      setIsDeleteModalOpen(false);
      setSelectedContent(null);
    } catch (err) {
      console.error('Error deleting content:', err);
      setError('Failed to delete content');
      
      // For development, still update UI even if API fails
      if (process.env.NODE_ENV === 'development') {
        setContent(prev => prev.filter(item => item.id !== selectedContent.id));
        setIsDeleteModalOpen(false);
        setSelectedContent(null);
      }
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('#file-upload') as HTMLInputElement;
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setError('Please select a file to import');
      return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setLoading(true);
      
      const response = await axios.post('/api/admin/content/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.message) {
        // Refresh content after import
        const contentResponse = await axios.get('/api/admin/content', {
          params: {
            page: 1,
            limit: pagination.itemsPerPage
          }
        });
        
        if (contentResponse.data && contentResponse.data.content) {
          setContent(contentResponse.data.content);
          setPagination(prev => ({
            ...prev,
            currentPage: 1,
            totalItems: contentResponse.data.pagination.totalItems,
            totalPages: contentResponse.data.pagination.totalPages
          }));
        }
      }
      
      setIsImportModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error importing content:', err);
      setError('Failed to import content');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Content Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage templates, pages, sections, and components
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <a
            href="/admin/content/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentPlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Create New
          </a>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Import
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <Tab.Group onChange={(index) => handleTabChange(contentTypes[index].id)}>
              <Tab.List className="flex space-x-8 border-b border-gray-200">
                {contentTypes.map((type) => (
                  <Tab
                    key={type.id}
                    className={({ selected }) =>
                      `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selected
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`
                    }
                  >
                    {type.name}
                  </Tab>
                ))}
              </Tab.List>
            </Tab.Group>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search content
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Search by title or tag"
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : getPaginatedContent().length === 0 ? (
          <div className="text-center py-12">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No content found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating a new item'}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {getPaginatedContent().map((item) => (
              <div
                key={item.id}
                className="relative bg-white border border-gray-200 rounded-lg shadow overflow-hidden transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500"
              >
                <div 
                  className="aspect-w-16 aspect-h-9 bg-gray-200 cursor-pointer"
                  onClick={() => handleContentClick(item)}
                >
                  {item.preview ? (
                    <img 
                      src={item.preview} 
                      alt={item.title} 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {item.status === 'published' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Published
                      </span>
                    )}
                    {item.status === 'draft' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 truncate" title={item.title}>
                    {item.title}
                  </h3>
                  <div className="mt-1">
                    <p className="text-xs text-gray-500">
                      <span className="capitalize">{item.type}</span> • Updated {formatDate(item.updatedAt)}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <TagIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleContentClick(item)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        aria-label={`Preview ${item.title}`}
                      >
                        <EyeIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                        Preview
                      </button>
                      <a
                        href={`/admin/content/edit/${item.id}`}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        aria-label={`Edit ${item.title}`}
                      >
                        <PencilIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                        Edit
                      </a>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(item)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      aria-label={`Delete ${item.title}`}
                    >
                      <TrashIcon className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {filteredContent.length > 0 && pagination.totalPages > 1 && (
          <nav
            className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-6"
            aria-label="Pagination"
          >
            <div className="hidden sm:block">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                </span>{' '}
                of <span className="font-medium">{pagination.totalItems}</span> results
              </p>
            </div>
            <div className="flex flex-1 justify-between sm:justify-end">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                  pagination.currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                  pagination.currentPage === pagination.totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </div>
      
      {/* Preview Modal */}
      <Transition.Root show={isPreviewModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsPreviewModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                  <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsPreviewModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  {selectedContent && (
                    <div>
                      <div className="mt-3 text-center sm:mt-0 sm:text-left">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                          {selectedContent.title}
                        </Dialog.Title>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {selectedContent.type}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedContent.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedContent.status.charAt(0).toUpperCase() + selectedContent.status.slice(1)}
                          </span>
                          {selectedContent.tags.map((tag) => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 aspect-w-16 aspect-h-9 bg-gray-100 rounded overflow-hidden">
                        {selectedContent.preview ? (
                          <img 
                            src={selectedContent.preview} 
                            alt={selectedContent.title} 
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <svg
                              className="h-12 w-12 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Created by</p>
                          <p className="text-sm font-medium text-gray-900">{selectedContent.author.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last updated</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(selectedContent.updatedAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created at</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(selectedContent.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Published at</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(selectedContent.publishedAt)}</p>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          onClick={() => setIsPreviewModalOpen(false)}
                        >
                          Close
                        </button>
                        <a
                          href={`/admin/content/edit/${selectedContent.id}`}
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Edit
                        </a>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      
      {/* Delete Confirmation Modal */}
      <Transition.Root show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsDeleteModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <XMarkIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Delete Content
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete "{selectedContent?.title}"? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleDeleteConfirm}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      
      {/* Import Modal */}
      <Transition.Root show={isImportModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsImportModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsImportModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <ArrowUpTrayIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Import Content
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Select a JSON or ZIP file containing content to import.
                        </p>
                      </div>
                    </div>
                  </div>
                  <form onSubmit={handleImport} className="mt-5">
                    <div className="mt-2">
                      <div className="flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                            >
                              <span>Upload a file</span>
                              <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">JSON or ZIP up to 10MB</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                      >
                        Import
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                        onClick={() => setIsImportModalOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default ContentManagement;