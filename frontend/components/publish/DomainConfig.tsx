'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export interface DomainConfigProps {
  websiteId: string;
  currentDomain?: string;
  defaultDomain: string;
  onUpdate?: (domain: string | null) => void;
}

export function DomainConfig({
  websiteId,
  currentDomain,
  defaultDomain,
  onUpdate,
}: DomainConfigProps) {
  const [useCustomDomain, setUseCustomDomain] = useState(!!currentDomain);
  const [customDomain, setCustomDomain] = useState(currentDomain || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle domain verification
  const handleVerify = async () => {
    if (!customDomain.trim()) {
      toast.error('Please enter a valid domain');
      return;
    }
    
    setIsVerifying(true);
    setIsValid(null);
    
    try {
      // In a real app, this would call an API to verify DNS settings
      // For now, we'll just simulate the verification process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate a successful validation
      setIsValid(true);
      toast.success('Domain verification successful!');
    } catch (error) {
      console.error('Error verifying domain:', error);
      setIsValid(false);
      toast.error('Domain verification failed. Please check your DNS settings.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle domain update
  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Prepare domain data
      const domainData = useCustomDomain ? { domain: customDomain } : { domain: null };
      
      // Call update API
      await api.put(`/websites/${websiteId}/domain`, domainData);
      
      toast.success('Domain settings updated successfully!');
      
      if (onUpdate) {
        onUpdate(useCustomDomain ? customDomain : null);
      }
    } catch (error) {
      console.error('Error updating domain:', error);
      toast.error('Failed to update domain settings');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Domain types */}
        <div className="space-y-4">
          {/* Default domain */}
          <div className="flex items-start">
            <input
              type="radio"
              id="default-domain"
              name="domain-type"
              checked={!useCustomDomain}
              onChange={() => {
                setUseCustomDomain(false);
                setIsValid(null);
              }}
              className="mt-1 h-4 w-4 text-primary-600 border-secondary-300 rounded"
            />
            <div className="ml-3">
              <label htmlFor="default-domain" className="text-sm font-medium text-secondary-700">
                Use default domain
              </label>
              <p className="text-sm text-secondary-500">
                Your website will be available at <span className="font-mono">{defaultDomain}</span>
              </p>
            </div>
          </div>
          
          {/* Custom domain */}
          <div className="flex items-start">
            <input
              type="radio"
              id="custom-domain"
              name="domain-type"
              checked={useCustomDomain}
              onChange={() => setUseCustomDomain(true)}
              className="mt-1 h-4 w-4 text-primary-600 border-secondary-300 rounded"
            />
            <div className="ml-3 flex-grow">
              <label htmlFor="custom-domain" className="text-sm font-medium text-secondary-700">
                Use custom domain
              </label>
              <p className="text-sm text-secondary-500 mb-2">
                Enter your own domain name
              </p>
              
              <div className="flex mt-1 rounded-md shadow-sm">
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => {
                    setCustomDomain(e.target.value);
                    setIsValid(null);
                  }}
                  disabled={!useCustomDomain}
                  placeholder="example.com"
                  className="flex-grow min-w-0 block w-full px-3 py-2 rounded-l-md border border-r-0 border-secondary-300 text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-secondary-50 disabled:text-secondary-500"
                />
                <Button
                  variant="secondary"
                  disabled={!useCustomDomain || !customDomain.trim() || isVerifying}
                  isLoading={isVerifying}
                  onClick={handleVerify}
                  className="rounded-l-none"
                >
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
              
              {/* Domain validity indicator */}
              {isValid !== null && (
                <div className={`mt-2 text-sm ${isValid ? 'text-success-600' : 'text-error-600'}`}>
                  {isValid ? (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Domain verified successfully
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Domain verification failed
                    </div>
                  )}
                </div>
              )}
              
              {useCustomDomain && (
                <div className="mt-3 text-sm text-secondary-600 bg-secondary-50 p-3 rounded-md">
                  <p className="font-medium mb-1">DNS Configuration</p>
                  <p>To use a custom domain, you need to configure your DNS settings:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Add a CNAME record pointing to <span className="font-mono">{defaultDomain}</span></li>
                    <li>Set TTL to 3600 seconds (1 hour) or lower</li>
                    <li>Wait for DNS propagation (may take up to 48 hours)</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Update button */}
      <div className="flex justify-end">
        <Button
          onClick={handleUpdate}
          isLoading={isUpdating}
          disabled={useCustomDomain && (!customDomain.trim() || isValid === false)}
        >
          {isUpdating ? 'Updating...' : 'Update Domain Settings'}
        </Button>
      </div>
    </div>
  );
}
