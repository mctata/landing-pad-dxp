'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { projectAPI } from '@/lib/api';
import { useProject } from '@/lib/project/project-context';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth/auth-context';

interface Project {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  published: boolean;
  publishedUrl?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Redirect regular users to the create page
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard/create');
    }
  }, [user, router]);
  
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      
      try {
        // Fetch projects from API
        // const response = await projectAPI.getProjects();
        // setProjects(response.data.projects);
        
        // Mock data for demo
        setProjects([
          {
            id: 'project-1',
            name: 'My Portfolio',
            description: 'Personal portfolio website',
            updatedAt: '2025-03-01T12:00:00Z',
            published: true,
            publishedUrl: 'https://portfolio.landingpad.digital',
          },
          {
            id: 'project-2',
            name: 'Business Website',
            description: 'Website for my small business',
            updatedAt: '2025-02-20T10:30:00Z',
            published: false,
          },
          {
            id: 'project-3',
            name: 'Landing Page',
            description: 'Product launch landing page',
            updatedAt: '2025-01-15T15:45:00Z',
            published: true,
            publishedUrl: 'https://product.landingpad.digital',
          },
        ]);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load your projects');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Handle creating a new project
  const handleCreateProject = () => {
    router.push('/dashboard/create');
  };
  
  return (
    <div className="min-h-screen bg-secondary-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">My Websites</h1>
            <p className="mt-1 text-sm text-secondary-500">Manage and edit your websites</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-primary-600 text-white font-medium shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={handleCreateProject}
            >
              Create New Website
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="mt-8 flex justify-center">
            <div className="w-12 h-12 border-4 border-t-primary-500 border-secondary-200 rounded-full animate-spin"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-secondary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-secondary-900">No websites yet</h2>
            <p className="mt-2 text-secondary-500 max-w-md mx-auto">
              Get started by creating your first website. Choose from our templates or start from scratch.
            </p>
            <button
              type="button"
              className="mt-6 px-4 py-2 rounded-md bg-primary-600 text-white font-medium shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={handleCreateProject}
            >
              Create New Website
            </button>
          </div>
        ) : (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-secondary-200">
              {projects.map((project) => (
                <li key={project.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="sm:flex sm:items-center">
                        <p className="text-lg font-medium text-primary-600 truncate">
                          {project.name}
                        </p>
                        <div className="mt-1 sm:mt-0 sm:ml-4">
                          {project.published ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <Link 
                          href={`/dashboard/editor/${project.id}`}
                          className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-secondary-300 text-xs font-medium rounded text-secondary-700 bg-white hover:bg-secondary-50"
                        >
                          Edit
                        </Link>
                        
                        {project.published && (
                          <a
                            href={project.publishedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-secondary-500">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-secondary-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <p>
                          Updated on <time dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time>
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
