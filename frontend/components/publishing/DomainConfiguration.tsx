'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface DomainConfigurationProps {
  websiteId: string;
}

interface DomainData {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'failed';
  isPrimary: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  dnsRecords: {
    type: string;
    host: string;
    value: string;
    ttl: number;
  }[];
  createdAt: string;
}

export function DomainConfiguration({ websiteId }: DomainConfigurationProps) {
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDnsInfo, setShowDnsInfo] = useState<string | null>(null);
  
  // Load domains on component mount
  useEffect(() => {
    fetchDomains();
  }, [websiteId]);
  
  // Function to fetch domains
  const fetchDomains = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/websites/${websiteId}/domains`);
      setDomains(response.data.domains || []);
    } catch (err) {
      console.error('Failed to fetch domains', err);
      toast.error('Failed to load domains. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to add a new domain
  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    
    setError(null);
    setIsAddingDomain(true);
    
    try {
      // Basic domain validation
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(newDomain)) {
        setError('Please enter a valid domain name (e.g., example.com)');
        return;
      }
      
      // Check if domain already exists
      if (domains.some(domain => domain.name.toLowerCase() === newDomain.toLowerCase())) {
        setError('This domain is already added to your website');
        return;
      }
      
      // Add the domain
      const response = await api.post(`/websites/${websiteId}/domains`, {
        name: newDomain
      });
      
      // Update domains list
      setDomains([...domains, response.data.domain]);
      
      // Reset the input
      setNewDomain('');
      
      // Show success message
      toast.success('Domain added successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add domain. Please try again.');
    } finally {
      setIsAddingDomain(false);
    }
  };
  
  // Function to remove a domain
  const handleRemoveDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to remove this domain?')) return;
    
    try {
      await api.delete(`/websites/${websiteId}/domains/${domainId}`);
      
      // Update domains list
      setDomains(domains.filter(domain => domain.id !== domainId));
      
      // Show success message
      toast.success('Domain removed successfully!');
    } catch (err) {
      console.error('Failed to remove domain', err);
      toast.error('Failed to remove domain. Please try again.');
    }
  };
  
  // Function to set primary domain
  const handleSetPrimaryDomain = async (domainId: string) => {
    try {
      await api.put(`/websites/${websiteId}/domains/${domainId}/primary`);
      
      // Update domains list
      setDomains(domains.map(domain => ({
        ...domain,
        isPrimary: domain.id === domainId
      })));
      
      // Show success message
      toast.success('Primary domain updated successfully!');
    } catch (err) {
      console.error('Failed to set primary domain', err);
      toast.error('Failed to set primary domain. Please try again.');
    }
  };
  
  // Function to verify domain
  const handleVerifyDomain = async (domainId: string) => {
    try {
      await api.post(`/websites/${websiteId}/domains/${domainId}/verify`);
      
      // Refresh domains to get updated status
      fetchDomains();
      
      // Show success message
      toast.success('Domain verification initiated.');
    } catch (err) {
      console.error('Failed to verify domain', err);
      toast.error('Failed to verify domain. Please try again.');
    }
  };
  
  // Status badge component
  const StatusBadge = ({ status }: { status: 'pending' | 'active' | 'failed' | 'verified' }) => {
    const styles = {
      pending: 'bg-warning-100 text-warning-800',
      active: 'bg-success-100 text-success-800',
      verified: 'bg-success-100 text-success-800',
      failed: 'bg-error-100 text-error-800',
    };
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status === 'pending' ? 'Pending' : status === 'active' ? 'Active' : status === 'verified' ? 'Verified' : 'Failed'}
      </span>
    );
  };
  
  return (
    <div className="bg-white rounded-md shadow">
      <div className="p-4 border-b border-secondary-200">
        <h2 className="text-lg font-semibold text-secondary-900">Domain Configuration</h2>
        <p className="text-sm text-secondary-600 mt-1">
          Connect your custom domain to your website. Your site is always accessible via our system domain.
        </p>
      </div>
      
      <div className="p-4">
        {/* Domain input */}
        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-secondary-700 mb-1">
            Add Custom Domain
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="domain"
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-md border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isAddingDomain}
            />
            <Button
              onClick={handleAddDomain}
              isLoading={isAddingDomain}
              disabled={!newDomain.trim() || isAddingDomain}
            >
              Add
            </Button>
          </div>
          {error && (
            <p className="mt-1 text-sm text-error-600">{error}</p>
          )}
          <p className="mt-1 text-xs text-secondary-500">
            Enter your domain without 'http://' or 'www' (e.g., example.com)
          </p>
        </div>
        
        {/* System domain */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-secondary-700 mb-2">
            System Domain
          </h3>
          <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-md">
            <div className="flex items-center">
              <span className="text-secondary-800">
                {`${websiteId}.landingpad.digital`}
              </span>
              <StatusBadge status="active" />
            </div>
            <div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`https://${websiteId}.landingpad.digital`);
                  toast.success('System domain copied to clipboard!');
                }}
              >
                Copy URL
              </Button>
            </div>
          </div>
        </div>
        
        {/* Custom domains list */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-secondary-700 mb-2">
            Custom Domains
            {domains.length > 0 && ` (${domains.length})`}
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
          ) : domains.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-secondary-300 rounded-md bg-secondary-50">
              <p className="text-secondary-600">No custom domains added yet.</p>
              <p className="text-sm text-secondary-500 mt-1">
                Add your first custom domain above.
              </p>
            </div>
          ) : (
            <div className="border border-secondary-200 rounded-md overflow-hidden">
              {domains.map((domain) => (
                <div 
                  key={domain.id} 
                  className="p-4 border-b border-secondary-200 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-secondary-900">
                          {domain.name}
                        </span>
                        {domain.isPrimary && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            Primary
                          </span>
                        )}
                        <StatusBadge status={domain.status} />
                        <StatusBadge status={domain.verificationStatus} />
                      </div>
                      
                      <div className="text-xs text-secondary-500 mt-1">
                        Added {new Date(domain.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {domain.verificationStatus !== 'verified' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowDnsInfo(domain.id)}
                        >
                          DNS Setup
                        </Button>
                      )}
                      
                      {domain.verificationStatus === 'pending' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleVerifyDomain(domain.id)}
                        >
                          Verify
                        </Button>
                      )}
                      
                      {domain.status === 'active' && !domain.isPrimary && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSetPrimaryDomain(domain.id)}
                        >
                          Set Primary
                        </Button>
                      )}
                      
                      <button
                        type="button"
                        className="text-error-600 hover:text-error-800"
                        onClick={() => handleRemoveDomain(domain.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* DNS Info */}
                  {showDnsInfo === domain.id && (
                    <div className="mt-4 p-4 bg-secondary-50 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-secondary-900">DNS Configuration</h4>
                        <button
                          type="button"
                          className="text-secondary-500 hover:text-secondary-700"
                          onClick={() => setShowDnsInfo(null)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      
                      <p className="text-sm text-secondary-700 mb-3">
                        Add the following records to your domain DNS settings:
                      </p>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary-200 text-sm">
                          <thead className="bg-secondary-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                Host
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                Value
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                TTL
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-secondary-200">
                            {domain.dnsRecords?.map((record, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-secondary-900">
                                  {record.type}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-secondary-900">
                                  {record.host}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-secondary-900">
                                  <div className="flex items-center">
                                    <span className="truncate max-w-xs">{record.value}</span>
                                    <button
                                      type="button"
                                      className="ml-2 text-primary-600 hover:text-primary-800"
                                      onClick={() => {
                                        navigator.clipboard.writeText(record.value);
                                        toast.success('Value copied to clipboard!');
                                      }}
                                      title="Copy to clipboard"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-secondary-900">
                                  {record.ttl === 0 ? 'Auto' : record.ttl}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 text-xs text-secondary-600">
                        <p>
                          <strong>Note:</strong> DNS propagation can take up to 24-48 hours to complete.
                          After adding these records, click the "Verify" button to check if your DNS is properly configured.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DomainConfiguration;