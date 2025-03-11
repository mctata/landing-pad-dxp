import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

interface Stats {
  users: number;
  websites: number;
  deployments: number;
  domains: number;
  failedDeployments: number;
  activeDomains: number;
}

interface Deployment {
  id: string;
  status: string;
  version: string;
  commitMessage: string;
  createdAt: string;
  completedAt: string | null;
  buildTime: number | null;
  website: {
    name: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Website {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastPublishedAt: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Domain {
  id: string;
  name: string;
  status: string;
  verificationStatus: string;
  isPrimary: boolean;
  createdAt: string;
  website: {
    name: string;
  };
  user: {
    firstName: string;
    lastName: string;
  };
}

interface PaginationData {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDeployments, setRecentDeployments] = useState<Deployment[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [websitesPagination, setWebsitesPagination] = useState<PaginationData>({
    totalItems: 0,
    itemsPerPage: 10,
    currentPage: 1,
    totalPages: 0
  });
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deploymentsPagination, setDeploymentsPagination] = useState<PaginationData>({
    totalItems: 0,
    itemsPerPage: 10,
    currentPage: 1,
    totalPages: 0
  });
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainsPagination, setDomainsPagination] = useState<PaginationData>({
    totalItems: 0,
    itemsPerPage: 10,
    currentPage: 1,
    totalPages: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  // Fetch websites
  useEffect(() => {
    if (activeTab === 'websites') {
      fetchWebsites(websitesPagination.currentPage);
    }
  }, [activeTab, websitesPagination.currentPage]);

  // Fetch deployments
  useEffect(() => {
    if (activeTab === 'deployments') {
      fetchDeployments(deploymentsPagination.currentPage);
    }
  }, [activeTab, deploymentsPagination.currentPage]);

  // Fetch domains
  useEffect(() => {
    if (activeTab === 'domains') {
      fetchDomains(domainsPagination.currentPage);
    }
  }, [activeTab, domainsPagination.currentPage]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/stats');
      setStats(response.data.stats);
      setRecentDeployments(response.data.recentDeployments);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebsites = async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/websites?page=${page}&limit=10`);
      setWebsites(response.data.websites);
      setWebsitesPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load websites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeployments = async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/deployments?page=${page}&limit=10`);
      setDeployments(response.data.deployments);
      setDeploymentsPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load deployments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async (page: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/domains?page=${page}&limit=10`);
      setDomains(response.data.domains);
      setDomainsPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load domains');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleWebsitesPageChange = (page: number) => {
    setWebsitesPagination({
      ...websitesPagination,
      currentPage: page
    });
  };

  const handleDeploymentsPageChange = (page: number) => {
    setDeploymentsPagination({
      ...deploymentsPagination,
      currentPage: page
    });
  };

  const handleDomainsPageChange = (page: number) => {
    setDomainsPagination({
      ...domainsPagination,
      currentPage: page
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const renderStatusBadge = (status: string) => {
    let bgColor = "bg-gray-100 text-gray-800";
    
    switch (status) {
      case 'success':
      case 'active':
      case 'published':
      case 'verified':
        bgColor = "bg-green-100 text-green-800";
        break;
      case 'failed':
      case 'error':
        bgColor = "bg-red-100 text-red-800";
        break;
      case 'queued':
      case 'pending':
        bgColor = "bg-yellow-100 text-yellow-800";
        break;
      case 'in_progress':
        bgColor = "bg-blue-100 text-blue-800";
        break;
      case 'draft':
        bgColor = "bg-gray-100 text-gray-800";
        break;
      case 'archived':
        bgColor = "bg-gray-800 text-white";
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const renderPagination = (
    pagination: PaginationData, 
    onPageChange: (page: number) => void,
    ariaLabel: string
  ) => {
    return (
      <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-6" aria-label={ariaLabel}>
        <div className="hidden md:-mt-px md:flex">
          <button
            onClick={() => onPageChange(1)}
            disabled={pagination.currentPage === 1}
            className={`inline-flex items-center border-t-2 ${
              pagination.currentPage === 1 
                ? 'border-transparent text-gray-300 cursor-not-allowed' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } px-4 pt-4 text-sm font-medium`}
            aria-label="First page"
          >
            <ChevronDoubleLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            First
          </button>
          
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className={`inline-flex items-center border-t-2 ${
              pagination.currentPage === 1 
                ? 'border-transparent text-gray-300 cursor-not-allowed' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } px-4 pt-4 text-sm font-medium`}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Previous
          </button>
          
          {[...Array(pagination.totalPages)].map((_, i) => {
            // Show at most 5 page numbers, centered around the current page
            if (pagination.totalPages <= 5 || 
                i + 1 === 1 || 
                i + 1 === pagination.totalPages ||
                (i + 1 >= pagination.currentPage - 1 && i + 1 <= pagination.currentPage + 1)) {
              return (
                <button
                  key={i}
                  onClick={() => onPageChange(i + 1)}
                  className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                    i + 1 === pagination.currentPage
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-label={`Page ${i + 1}`}
                  aria-current={i + 1 === pagination.currentPage ? 'page' : undefined}
                >
                  {i + 1}
                </button>
              );
            } else if (
              (i === 1 && pagination.currentPage > 3) || 
              (i === pagination.totalPages - 2 && pagination.currentPage < pagination.totalPages - 2)
            ) {
              return (
                <span key={i} className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500">
                  ...
                </span>
              );
            }
            return null;
          })}
          
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
            className={`inline-flex items-center border-t-2 ${
              pagination.currentPage === pagination.totalPages || pagination.totalPages === 0
                ? 'border-transparent text-gray-300 cursor-not-allowed' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } px-4 pt-4 text-sm font-medium`}
            aria-label="Next page"
          >
            Next
            <ChevronRightIcon className="h-5 w-5 ml-2" aria-hidden="true" />
          </button>
          
          <button
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
            className={`inline-flex items-center border-t-2 ${
              pagination.currentPage === pagination.totalPages || pagination.totalPages === 0
                ? 'border-transparent text-gray-300 cursor-not-allowed' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } px-4 pt-4 text-sm font-medium`}
            aria-label="Last page"
          >
            Last
            <ChevronDoubleRightIcon className="h-5 w-5 ml-2" aria-hidden="true" />
          </button>
        </div>
        
        {/* Mobile pagination */}
        <div className="flex w-full md:hidden justify-between">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className={`inline-flex items-center ${
              pagination.currentPage === 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-gray-700'
            } py-2 text-sm font-medium`}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" aria-hidden="true" />
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
            className={`inline-flex items-center ${
              pagination.currentPage === pagination.totalPages || pagination.totalPages === 0
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-gray-700'
            } py-2 text-sm font-medium`}
            aria-label="Next page"
          >
            Next
            <ChevronRightIcon className="h-5 w-5 ml-1" aria-hidden="true" />
          </button>
        </div>
      </nav>
    );
  };

  if (loading && !stats && !websites.length && !deployments.length && !domains.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage your websites, deployments, and domains
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'overview') fetchStats();
              if (activeTab === 'websites') fetchWebsites(websitesPagination.currentPage);
              if (activeTab === 'deployments') fetchDeployments(deploymentsPagination.currentPage);
              if (activeTab === 'domains') fetchDomains(domainsPagination.currentPage);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Refresh data"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.873-1.514 3.157-1.514 4.03 0l6.28 10.875c.87 1.513-.17 3.398-2.017 3.398H4.222c-1.847 0-2.887-1.885-2.017-3.398l6.28-10.875zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { key: 'overview', name: 'Overview' },
              { key: 'websites', name: 'Websites' },
              { key: 'deployments', name: 'Deployments' },
              { key: 'domains', name: 'Domains' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
                aria-current={activeTab === tab.key ? 'page' : undefined}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'overview' && stats && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.users}</dd>
                    </dl>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Websites</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.websites}</dd>
                    </dl>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Deployments</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.deployments}</dd>
                    </dl>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Domains</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.domains}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Failed Deployments</dt>
                      <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.failedDeployments}</dd>
                    </dl>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Domains</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.activeDomains}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <h2 className="mt-8 text-lg font-medium text-gray-900">Recent Deployments</h2>
              <div className="mt-3 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Website
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Version
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created At
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Build Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recentDeployments.length > 0 ? (
                            recentDeployments.map((deployment) => (
                              <tr key={deployment.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {renderStatusBadge(deployment.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{deployment.website?.name || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{deployment.version}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{`${deployment.user.firstName} ${deployment.user.lastName}`}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{formatDate(deployment.createdAt)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {deployment.buildTime ? `${(deployment.buildTime / 1000).toFixed(2)}s` : 'N/A'}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                No deployments found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'websites' && (
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Published
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {websites.length > 0 ? (
                          websites.map((website) => (
                            <tr key={website.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{website.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {renderStatusBadge(website.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{`${website.user.firstName} ${website.user.lastName}`}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(website.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(website.lastPublishedAt)}</div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              No websites found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {websitesPagination.totalPages > 0 && (
                renderPagination(websitesPagination, handleWebsitesPageChange, "Website pagination")
              )}
            </div>
          )}

          {activeTab === 'deployments' && (
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Website
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Version
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completed
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {deployments.length > 0 ? (
                          deployments.map((deployment) => (
                            <tr key={deployment.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {renderStatusBadge(deployment.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{deployment.website?.name || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{deployment.version}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{`${deployment.user.firstName} ${deployment.user.lastName}`}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(deployment.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(deployment.completedAt)}</div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              No deployments found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {deploymentsPagination.totalPages > 0 && (
                renderPagination(deploymentsPagination, handleDeploymentsPageChange, "Deployment pagination")
              )}
            </div>
          )}

          {activeTab === 'domains' && (
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Domain Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Verification
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Primary
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Website
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {domains.length > 0 ? (
                          domains.map((domain) => (
                            <tr key={domain.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{domain.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {renderStatusBadge(domain.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {renderStatusBadge(domain.verificationStatus)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {domain.isPrimary ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Yes
                                    </span>
                                  ) : 'No'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{domain.website?.name || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(domain.createdAt)}</div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              No domains found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {domainsPagination.totalPages > 0 && (
                renderPagination(domainsPagination, handleDomainsPageChange, "Domain pagination")
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;