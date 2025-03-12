'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ContentTypes = [
  { id: 'template', name: 'Template' },
  { id: 'page', name: 'Page' },
  { id: 'section', name: 'Section' },
  { id: 'component', name: 'Component' },
];

const EditContentPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('template');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [content, setContent] = useState('{}');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch content data
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get(`/api/admin/content/${contentId}`);
        
        if (response.data && response.data.content) {
          const contentData = response.data.content;
          setTitle(contentData.title);
          setDescription(contentData.description || '');
          setType(contentData.type);
          setTags(contentData.tags || []);
          setStatus(contentData.status);
          
          // Format content JSON for display
          const contentObj = typeof contentData.content === 'string' 
            ? JSON.parse(contentData.content) 
            : contentData.content;
          
          setContent(JSON.stringify(contentObj, null, 2));
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      fetchContent();
    }
  }, [contentId]);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleUpdateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      let contentObj;
      try {
        contentObj = JSON.parse(content);
      } catch (jsonError) {
        setError('Invalid JSON in content field');
        setSaving(false);
        return;
      }
      
      const response = await axios.put(`/api/admin/content/${contentId}`, {
        title,
        description,
        type,
        content: contentObj,
        tags,
        status
      });
      
      if (response.data) {
        router.push('/admin/content');
      }
    } catch (err) {
      console.error('Error updating content:', err);
      setError('Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      await axios.post(`/api/admin/content/${contentId}/publish`);
      setStatus('published');
    } catch (err) {
      console.error('Error publishing content:', err);
      setError('Failed to publish content');
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setSaving(true);
      await axios.post(`/api/admin/content/${contentId}/unpublish`);
      setStatus('draft');
    } catch (err) {
      console.error('Error unpublishing content:', err);
      setError('Failed to unpublish content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Content</h1>
          <p className="mt-2 text-sm text-gray-700">
            Update content item details
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {status === 'draft' ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Publish
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Unpublish
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/admin/content')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleUpdateContent} className="mt-6 space-y-8 divide-y divide-gray-200">
        <div className="space-y-8 divide-y divide-gray-200">
          <div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Basic Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                This information will be displayed publicly so be careful what you share.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Brief description of the content item.
                </p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Content Type
                </label>
                <div className="mt-1">
                  <select
                    id="type"
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    {ContentTypes.map((contentType) => (
                      <option key={contentType.id} value={contentType.id}>
                        {contentType.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow focus-within:z-10">
                    <input
                      type="text"
                      name="tags"
                      id="tags"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      placeholder="Add tags separated by Enter"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 inline-flex flex-shrink-0 h-4 w-4 items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                        >
                          <span className="sr-only">Remove tag {tag}</span>
                          <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Content JSON</h3>
              <p className="mt-1 text-sm text-gray-500">
                Edit the JSON configuration for this content item
              </p>
            </div>
            <div className="mt-6">
              <div className="sm:col-span-6">
                <div className="mt-1">
                  <textarea
                    id="content"
                    name="content"
                    rows={20}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/admin/content')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditContentPage;