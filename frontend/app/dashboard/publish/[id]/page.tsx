'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface WebsiteData {
  id: string;
  name: string;
  status: 'draft' | 'published';
  domain?: string;
  lastPublished?: string;
}

export default function PublishPage({ params }: { params: { id: string } }) {
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const router = useRouter();

  // Fetch website data
  useEffect(() => {
    const fetchWebsite = async () => {
      setIsLoading(true);
      
      try {
        const response = await api.get(`/websites/${params.id}`);
        const websiteData = response.data.website;
        setWebsite(websiteData);
        
        // Initialize custom domain if available
        if (websiteData.domain) {
          setCustomDomain(websiteData.domain);
          setUseCustomDomain(true);
        }
      } catch (error) {
        console.error('Error fetching website:', error);
        toast.error('Failed to load website data');
        
        // Demo data for development
        setWebsite({
          id: params.id,
          name: 'Demo Website',
          status: 'draft',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWebsite();
  }, [params.id]);

  // Handle publishing website
  const handlePublish = async () => {
    if (!website) return;
    
    setIsPublishing(true);
    
    try {
      // Prepare domain data
      const domainData = useCustomDomain ? { domain: customDomain } : {};
      
      // Call publish API
      await api.post(`/websites/${params.id}/publish`, domainData);
      
      // Update local state
      setWebsite({
        ...website,
        status: 'published',
        domain: useCustomDomain ? customDomain : undefined,
        lastPublished: new Date().toISOString(),
      });
      
      toast.success('Website published successfully!');
      
      // Redirect back to editor after short delay
      setTimeout(() => {
        router.push(`/dashboard/editor/${params.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error publishing website:', error);
      toast.error('Failed to publish website');
    } finally {
      setIsPublishing(false);
    }
  };

  // Get default domain
  const getDefaultDomain = () => {
    return `${website?.id}.landingpad.digital`;
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="bg-white border-b border-secondary-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-secondary-900">Publish Website</h1>
            <Button
              variant="secondary"
              onClick={() => router.push(`/dashboard/editor/${params.id}`)}
            >
              Back to Editor
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : website ? (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-secondary-200">
              <h2 className="text-xl font-semibold text-secondary-900">
                {website.name}
              </h2>
              <p className="mt-1 text-sm text-secondary-500">
                Configure publishing settings for your website
              </p>
            </div>
            
            <div className="px-6 py-5 space-y-6">
              {/* Status badge */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-secondary-700">Status:</span>
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    website.status === 'published' ? 'bg-success-100 text-success-800' : 'bg-secondary-100 text-secondary-800'
                  }`}
                >
                  {website.status === 'published' ? 'Published' : 'Draft'}
                </span>
                
                {website.lastPublished && (
                  <span className="text-xs text-secondary-500">
                    Last published: {new Date(website.lastPublished).toLocaleString()}
                  </span>
                )}
              </div>
              
              {/* Domain configuration */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-medium text-secondary-900">Domain Configuration</h3>
                  <div className="flex-grow border-t border-secondary-200"></div>
                </div>
                
                <div className="space-y-4">
                  {/* Default domain */}
                  <div className="flex items-start">
                    <input
                      type="radio"
                      id="default-domain"
                      name="domain-type"
                      checked={!useCustomDomain}
                      onChange={() => setUseCustomDomain(false)}
                      className="mt-1 h-4 w-4 text-primary-600 border-secondary-300 rounded"
                    />
                    <div className="ml-3">
                      <label htmlFor="default-domain" className="text-sm font-medium text-secondary-700">
                        Use default domain
                      </label>
                      <p className="text-sm text-secondary-500">
                        Your website will be available at <span className="font-mono">{getDefaultDomain()}</span>
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
                          onChange={(e) => setCustomDomain(e.target.value)}
                          disabled={!useCustomDomain}
                          placeholder="example.com"
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-secondary-300 text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-secondary-50 disabled:text-secondary-500"
                        />
                      </div>
                      
                      {useCustomDomain && (
                        <div className="mt-3 text-sm text-secondary-600 bg-secondary-50 p-3 rounded-md">
                          <p className="font-medium mb-1">DNS Configuration</p>
                          <p>To use a custom domain, you need to configure your DNS settings:</p>
                          <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Add a CNAME record pointing to <span className="font-mono">{getDefaultDomain()}</span></li>
                            <li>Set TTL to 3600 seconds (1 hour) or lower</li>
                            <li>Wait for DNS propagation (may take up to 48 hours)</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-secondary-50 border-t border-secondary-200 flex justify-end">
              <Button
                variant="secondary"
                className="mr-3"
                onClick={() => router.push(`/dashboard/editor/${params.id}`)}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                isLoading={isPublishing}
                disabled={useCustomDomain && !customDomain.trim()}
              >
                {isPublishing ? 'Publishing...' : 'Publish Website'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-secondary-600">Website not found</p>
            <Button
              className="mt-4"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
