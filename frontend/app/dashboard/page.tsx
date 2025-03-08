'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Website {
  id: string;
  name: string;
  url: string;
  status: 'draft' | 'published';
  template: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  
  // Fetch user websites
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await api.get('/websites');
        setWebsites(response.data.websites || []);
      } catch (error) {
        console.error('Error fetching websites:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWebsites();
  }, []);
  
  // Demo websites for illustration
  const demoWebsites: Website[] = [
    {
      id: '1',
      name: 'My Portfolio',
      url: 'my-portfolio.landingpad.digital',
      status: 'published',
      template: 'portfolio',
      createdAt: '2025-02-15T00:00:00Z',
      updatedAt: '2025-03-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Business Landing Page',
      url: 'business-landing.landingpad.digital',
      status: 'draft',
      template: 'landing',
      createdAt: '2025-03-05T00:00:00Z',
      updatedAt: '2025-03-05T00:00:00Z'
    }
  ];
  
  // Use demo websites if no real websites are available
  const displayWebsites = websites.length > 0 ? websites : demoWebsites;
  
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold text-secondary-900">My Websites</h1>
            <Button
              onClick={() => router.push('/dashboard/create')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Website
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                  <div className="h-48 bg-secondary-200 rounded-t-lg" />
                  <div className="p-4 space-y-4">
                    <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
                    <div className="h-4 bg-secondary-200 rounded w-1/2"></div>
                    <div className="flex justify-between">
                      <div className="h-8 bg-secondary-200 rounded w-1/4"></div>
                      <div className="h-8 bg-secondary-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayWebsites.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mx-auto h-24 w-24 text-secondary-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-secondary-900">No websites yet</h3>
              <p className="mt-2 text-secondary-600">Create your first website to get started.</p>
              <div className="mt-6">
                <Button
                  onClick={() => router.push('/dashboard/create')}
                >
                  Create Website
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayWebsites.map((website) => (
                <div key={website.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="relative h-48 bg-secondary-100">
                    {website.template && (
                      <Image
                        src={`/images/templates/${website.template}.jpg`}
                        alt={website.name}
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        website.status === 'published' 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-secondary-100 text-secondary-800'
                      }`}>
                        {website.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-secondary-900">{website.name}</h3>
                    <p className="text-sm text-secondary-500 mt-1">
                      {website.url}
                    </p>
                    <p className="text-xs text-secondary-400 mt-1">
                      Last updated: {formatDate(website.updatedAt)}
                    </p>
                    
                    <div className="mt-4 flex justify-between">
                      <Link 
                        href={`/dashboard/editor/${website.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      
                      {website.status === 'published' ? (
                        <a 
                          href={`https://${website.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View Site
                        </a>
                      ) : (
                        <Link 
                          href={`/dashboard/publish/${website.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Publish
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Create New Website Card */}
              <div className="bg-white rounded-lg shadow overflow-hidden border-2 border-dashed border-secondary-300 flex flex-col items-center justify-center p-6 h-full">
                <div className="h-16 w-16 text-secondary-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-secondary-900">Create New Website</h3>
                <p className="mt-2 text-sm text-secondary-600 text-center">
                  Start building your next website with our AI-powered tools
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => router.push('/dashboard/create')}
                    variant="outline"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}