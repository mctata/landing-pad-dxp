'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface DeploymentStatusProps {
  websiteId: string;
  refreshInterval?: number; // in milliseconds, default is 5000 (5 seconds)
}

interface Deployment {
  id: string;
  status: 'queued' | 'in_progress' | 'success' | 'failed';
  createdAt: string;
  completedAt: string | null;
  buildTime: number | null;
  version: string;
  commitMessage: string;
  errorMessage: string | null;
}

export function DeploymentStatus({ 
  websiteId, 
  refreshInterval = 5000 
}: DeploymentStatusProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDeployment, setActiveDeployment] = useState<Deployment | null>(null);
  const [pollTimer, setPollTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch deployments on component mount
  useEffect(() => {
    fetchDeployments();

    // Cleanup on unmount
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [websiteId]);

  // Function to fetch deployments
  const fetchDeployments = async () => {
    try {
      const response = await api.get(`/websites/${websiteId}/deployments?limit=5`);
      const fetchedDeployments = response.data.deployments || [];
      
      setDeployments(fetchedDeployments);
      
      // Check if there's an active deployment
      const ongoing = fetchedDeployments.find(
        (d: Deployment) => d.status === 'queued' || d.status === 'in_progress'
      );
      
      setActiveDeployment(ongoing || null);
      
      // If there's an active deployment, poll for updates
      if (ongoing) {
        if (!pollTimer) {
          const timer = setInterval(fetchDeployments, refreshInterval);
          setPollTimer(timer);
        }
      } else {
        // If no active deployment, clear polling
        if (pollTimer) {
          clearInterval(pollTimer);
          setPollTimer(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch deployments', err);
      toast.error('Failed to load deployment status');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      queued: 'bg-secondary-100 text-secondary-800',
      in_progress: 'bg-primary-100 text-primary-800',
      success: 'bg-success-100 text-success-800',
      failed: 'bg-error-100 text-error-800',
    };
    
    const statusText = {
      queued: 'Queued',
      in_progress: 'In Progress',
      success: 'Success',
      failed: 'Failed',
    };
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-md shadow">
      <div className="p-4 border-b border-secondary-200">
        <h2 className="text-lg font-semibold text-secondary-900">Deployment Status</h2>
        <p className="text-sm text-secondary-600 mt-1">
          Monitor the deployment status of your website
        </p>
      </div>
      
      <div className="p-4">
        {/* Active deployment */}
        {activeDeployment && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-secondary-700 mb-2">
              Active Deployment
            </h3>
            <div className="border border-primary-200 rounded-md bg-primary-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-secondary-900">
                    Version {activeDeployment.version}
                  </span>
                  {getStatusBadge(activeDeployment.status)}
                </div>
                <span className="text-xs text-secondary-500">
                  Started {formatDate(activeDeployment.createdAt)}
                </span>
              </div>
              
              <div className="mt-3">
                <div className="w-full bg-white rounded-full h-2 mb-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: activeDeployment.status === 'queued' 
                        ? '10%' 
                        : activeDeployment.status === 'in_progress' 
                          ? '50%' 
                          : '100%' 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-secondary-600">
                  {activeDeployment.status === 'queued' && 'Preparing deployment...'}
                  {activeDeployment.status === 'in_progress' && 'Building and deploying your website...'}
                  {activeDeployment.status === 'success' && 'Deployment completed successfully!'}
                  {activeDeployment.status === 'failed' && 'Deployment failed. Please check the error message below.'}
                </div>
              </div>
              
              {activeDeployment.errorMessage && (
                <div className="mt-3 p-2 bg-error-50 border border-error-200 rounded text-xs text-error-800 overflow-auto max-h-32">
                  {activeDeployment.errorMessage}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Recent deployments */}
        <div>
          <h3 className="text-sm font-medium text-secondary-700 mb-2">
            Recent Deployments
          </h3>
          
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <svg
                className="animate-spin h-6 w-6 text-primary-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : deployments.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-secondary-300 rounded-md bg-secondary-50">
              <p className="text-secondary-600">No deployments yet.</p>
              <p className="text-sm text-secondary-500 mt-1">
                Publish your website to see deployment history here.
              </p>
            </div>
          ) : (
            <div className="border border-secondary-200 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Build Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {deployments.map((deployment) => (
                    <tr key={deployment.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900">
                        {deployment.version}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(deployment.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-500">
                        {formatDate(deployment.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-500">
                        {deployment.buildTime ? `${(deployment.buildTime / 1000).toFixed(1)}s` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeploymentStatus;