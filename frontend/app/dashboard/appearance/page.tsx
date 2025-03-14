'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

export default function AppearancePage() {
  const [activeTab, setActiveTab] = useState('themes');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveChanges = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: 'Success',
        message: 'Appearance settings saved successfully',
        type: 'success'
      });
    }, 1000);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-gray-900">Appearance</h1>
          <p className="mt-2 text-sm text-gray-500">
            Customize the look and feel of your website
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-75"
          >
            {loading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-t-2 border-white"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('themes')}
              className={`${
                activeTab === 'themes'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Themes
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`${
                activeTab === 'colors'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Colors
            </button>
            <button
              onClick={() => setActiveTab('fonts')}
              className={`${
                activeTab === 'fonts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Typography
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`${
                activeTab === 'layout'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Layout
            </button>
          </nav>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {activeTab === 'themes' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {['Modern', 'Classic', 'Minimal', 'Bold', 'Creative', 'Professional'].map((theme) => (
                <div 
                  key={theme} 
                  className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 cursor-pointer"
                >
                  <div className="h-32 w-full bg-gray-200 rounded-md mb-4"></div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-900">{theme}</h3>
                    <input 
                      type="radio" 
                      name="theme" 
                      value={theme} 
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500" 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="max-w-2xl">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Brand Colors</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Primary</label>
                      <div className="mt-1 flex items-center">
                        <span className="h-8 w-8 rounded-full border border-gray-300" style={{ backgroundColor: '#3B82F6' }}></span>
                        <input type="text" value="#3B82F6" className="ml-2 block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Secondary</label>
                      <div className="mt-1 flex items-center">
                        <span className="h-8 w-8 rounded-full border border-gray-300" style={{ backgroundColor: '#6B7280' }}></span>
                        <input type="text" value="#6B7280" className="ml-2 block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Accent</label>
                      <div className="mt-1 flex items-center">
                        <span className="h-8 w-8 rounded-full border border-gray-300" style={{ backgroundColor: '#10B981' }}></span>
                        <input type="text" value="#10B981" className="ml-2 block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Highlight</label>
                      <div className="mt-1 flex items-center">
                        <span className="h-8 w-8 rounded-full border border-gray-300" style={{ backgroundColor: '#F59E0B' }}></span>
                        <input type="text" value="#F59E0B" className="ml-2 block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fonts' && (
            <div className="max-w-2xl">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Typography</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Headings Font</label>
                      <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                        <option>Inter</option>
                        <option>Roboto</option>
                        <option>Open Sans</option>
                        <option>Montserrat</option>
                        <option>Playfair Display</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Body Font</label>
                      <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                        <option>Inter</option>
                        <option>Roboto</option>
                        <option>Open Sans</option>
                        <option>Source Sans Pro</option>
                        <option>Lato</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="max-w-2xl">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Layout Options</h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="fullWidth"
                          name="fullWidth"
                          type="checkbox"
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="fullWidth" className="font-medium text-gray-700">
                          Full-width layout
                        </label>
                        <p className="text-gray-500">Use the entire screen width for your website content</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="stickyHeader"
                          name="stickyHeader"
                          type="checkbox"
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="stickyHeader" className="font-medium text-gray-700">
                          Sticky header
                        </label>
                        <p className="text-gray-500">Keep the header visible while scrolling</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}