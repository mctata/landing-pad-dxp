'use client';

import { useState, useEffect, Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import { useToast } from '@/components/ui/toast';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  XMarkIcon, 
  PlusIcon, 
  ArrowPathIcon, 
  GlobeAltIcon,
  ServerIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface Domain {
  id: string;
  name: string;
  websiteId: string;
  websiteName: string;
  status: 'pending' | 'active' | 'error';
  verificationStatus: 'pending' | 'verified' | 'failed';
  isPrimary: boolean;
  dnsRecords: {
    type: string;
    host: string;
    value: string;
    ttl: number;
  }[];
  verificationErrors?: string;
  lastVerifiedAt?: string;
  createdAt: string;
}

interface Website {
  id: string;
  name: string;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDnsModalOpen, setIsDnsModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [newDomain, setNewDomain] = useState({
    name: '',
    websiteId: '',
  });
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this would fetch from API
    // For demo, we'll use mock data
    const mockWebsites = [
      { id: 'website1', name: 'My Portfolio' },
      { id: 'website2', name: 'Business Website' },
      { id: 'website3', name: 'Landing Page' },
    ];

    const mockDomains = [
      {
        id: 'domain1',
        name: 'myportfolio.com',
        websiteId: 'website1',
        websiteName: 'My Portfolio',
        status: 'active',
        verificationStatus: 'verified',
        isPrimary: true,
        dnsRecords: [
          {
            type: 'CNAME',
            host: 'www.myportfolio.com',
            value: 'website1.landingpad.digital',
            ttl: 3600,
          },
          {
            type: 'A',
            host: 'myportfolio.com',
            value: '76.76.21.21',
            ttl: 3600,
          },
        ],
        lastVerifiedAt: '2025-01-15T15:45:00Z',
        createdAt: '2024-12-01T10:30:00Z',
      } as Domain,
      {
        id: 'domain2',
        name: 'businesswebsite.com',
        websiteId: 'website2',
        websiteName: 'Business Website',
        status: 'pending',
        verificationStatus: 'pending',
        isPrimary: true,
        dnsRecords: [
          {
            type: 'CNAME',
            host: 'www.businesswebsite.com',
            value: 'website2.landingpad.digital',
            ttl: 3600,
          },
          {
            type: 'A',
            host: 'businesswebsite.com',
            value: '76.76.21.21',
            ttl: 3600,
          },
        ],
        createdAt: '2025-02-15T14:20:00Z',
      } as Domain,
      {
        id: 'domain3',
        name: 'landingpage.org',
        websiteId: 'website3',
        websiteName: 'Landing Page',
        status: 'error',
        verificationStatus: 'failed',
        isPrimary: true,
        dnsRecords: [
          {
            type: 'CNAME',
            host: 'www.landingpage.org',
            value: 'website3.landingpad.digital',
            ttl: 3600,
          },
          {
            type: 'A',
            host: 'landingpage.org',
            value: '76.76.21.21',
            ttl: 3600,
          },
        ],
        verificationErrors: 'DNS records not found. Please check your DNS configuration.',
        createdAt: '2025-01-05T09:15:00Z',
      } as Domain,
    ];

    setWebsites(mockWebsites);
    setDomains(mockDomains);
    setLoading(false);
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDomain.name || !newDomain.websiteId) {
      toast({
        title: 'Error',
        message: 'Please fill in all required fields',
        type: 'error',
      });
      return;
    }
    
    // Validate domain name format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(newDomain.name)) {
      toast({
        title: 'Error',
        message: 'Please enter a valid domain name',
        type: 'error',
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      // In a real app, this would make an API call
      // const response = await api.addDomain(newDomain);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get website name
      const website = websites.find(w => w.id === newDomain.websiteId);
      
      // Create new domain
      const newDomainObj: Domain = {
        id: `domain${domains.length + 1}`,
        name: newDomain.name,
        websiteId: newDomain.websiteId,
        websiteName: website?.name || '',
        status: 'pending',
        verificationStatus: 'pending',
        isPrimary: true,
        dnsRecords: [
          {
            type: 'CNAME',
            host: newDomain.name.startsWith('www.') ? newDomain.name : `www.${newDomain.name}`,
            value: `${newDomain.websiteId}.landingpad.digital`,
            ttl: 3600,
          },
          {
            type: 'A',
            host: newDomain.name.startsWith('www.') ? newDomain.name.substring(4) : newDomain.name,
            value: '76.76.21.21',
            ttl: 3600,
          },
        ],
        createdAt: new Date().toISOString(),
      };
      
      // Update domains state
      setDomains([...domains, newDomainObj]);
      
      // Reset form and close modal
      setNewDomain({ name: '', websiteId: '' });
      setIsAddModalOpen(false);
      
      toast({
        title: 'Success',
        message: 'Domain added successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error adding domain:', error);
      toast({
        title: 'Error',
        message: 'Failed to add domain',
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifying(domainId);
    
    try {
      // In a real app, this would make an API call
      // const response = await api.verifyDomain(domainId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure (80% success rate)
      const success = Math.random() > 0.2;
      
      if (success) {
        // Update domain state
        setDomains(domains.map(domain => {
          if (domain.id === domainId) {
            return {
              ...domain,
              status: 'active',
              verificationStatus: 'verified',
              lastVerifiedAt: new Date().toISOString(),
              verificationErrors: undefined,
            };
          }
          return domain;
        }));
        
        toast({
          title: 'Success',
          message: 'Domain verified successfully',
          type: 'success',
        });
      } else {
        // Update domain state
        setDomains(domains.map(domain => {
          if (domain.id === domainId) {
            return {
              ...domain,
              status: 'error',
              verificationStatus: 'failed',
              verificationErrors: 'DNS records not found. Please check your DNS configuration.',
            };
          }
          return domain;
        }));
        
        toast({
          title: 'Error',
          message: 'Domain verification failed',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast({
        title: 'Error',
        message: 'Failed to verify domain',
        type: 'error',
      });
    } finally {
      setVerifying(null);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      // In a real app, this would make an API call
      // await api.deleteDomain(domainId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update domains state
      setDomains(domains.filter(domain => domain.id !== domainId));
      
      toast({
        title: 'Success',
        message: 'Domain removed successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast({
        title: 'Error',
        message: 'Failed to remove domain',
        type: 'error',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openDnsModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsDnsModalOpen(true);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-gray-900">Domains</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage custom domains for your websites
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Domain
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        </div>
      ) : domains.length === 0 ? (
        <div className="mt-12 text-center">
          <GlobeAltIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">No domains yet</h2>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            Add a custom domain to your website to make it more professional and easier for visitors to remember.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Domain
          </button>
        </div>
      ) : (
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {domains.map((domain) => (
              <li key={domain.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 relative">
                        <GlobeAltIcon className="h-8 w-8 text-gray-400" />
                        {domain.status === 'active' && (
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white" />
                        )}
                        {domain.status === 'pending' && (
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-yellow-400 border-2 border-white" />
                        )}
                        {domain.status === 'error' && (
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-red-400 border-2 border-white" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{domain.name}</div>
                        <div className="text-sm text-gray-500">
                          Website: {domain.websiteName}
                        </div>
                      </div>
                    </div>
                    <div className="flex">
                      {domain.isPrimary && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                          Primary
                        </span>
                      )}
                      {domain.status === 'active' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                      {domain.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {domain.status === 'error' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Error
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 sm:flex sm:justify-between">
                    <div className="sm:flex sm:space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <ServerIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        DNS Records: {domain.dnsRecords.length}
                        <button
                          type="button"
                          onClick={() => openDnsModal(domain)}
                          className="ml-1 text-blue-600 hover:text-blue-500"
                        >
                          View
                        </button>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <ShieldCheckIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        {domain.verificationStatus === 'verified' ? (
                          <span className="text-green-600">Verified</span>
                        ) : domain.verificationStatus === 'pending' ? (
                          <span className="text-yellow-600">Pending verification</span>
                        ) : (
                          <span className="text-red-600">Verification failed</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <div className="flex space-x-2">
                        {domain.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() => handleVerifyDomain(domain.id)}
                            disabled={verifying === domain.id}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${
                              verifying === domain.id
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                          >
                            {verifying === domain.id ? (
                              <>
                                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Verifying...
                              </>
                            ) : (
                              'Verify'
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteDomain(domain.id)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  {domain.verificationErrors && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {domain.verificationErrors}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Tutorial section */}
      <div className="mt-12 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Custom Domain Setup Guide</h2>
          <p className="mt-1 text-sm text-gray-500">
            How to correctly set up your custom domain
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="prose prose-blue max-w-none">
            <ol className="space-y-4">
              <li>
                <strong>Register a domain</strong> - Purchase a domain from a domain registrar like Namecheap, GoDaddy, or Google Domains.
              </li>
              <li>
                <strong>Add your domain</strong> - Click the "Add Domain" button above and select the website you want to connect it to.
              </li>
              <li>
                <strong>Configure DNS records</strong> - Log in to your domain registrar and add the required DNS records:
                <ul className="mt-2">
                  <li>Add an <strong>A record</strong> for your root domain (example.com) pointing to our IP: <code>76.76.21.21</code></li>
                  <li>Add a <strong>CNAME record</strong> for www subdomain (www.example.com) pointing to your LandingPad URL: <code>yoursite.landingpad.digital</code></li>
                </ul>
              </li>
              <li>
                <strong>Verify your domain</strong> - Once you've added the DNS records, click the "Verify" button. DNS changes can take up to 48 hours to propagate.
              </li>
            </ol>
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Need help?</strong> Our support team is available to assist you with domain setup. Contact us at support@landingpad.dev
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Domain Modal */}
      <Transition.Root show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsAddModalOpen}>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsAddModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <GlobeAltIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Add Custom Domain
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Connect your own domain to your website. You'll need to configure DNS records at your domain registrar.
                        </p>
                      </div>
                    </div>
                  </div>
                  <form onSubmit={handleAddDomain} className="mt-5 sm:mt-4">
                    <div>
                      <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                        Domain Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="domain"
                          id="domain"
                          placeholder="example.com"
                          value={newDomain.name}
                          onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Enter your domain without http:// or https:// (e.g., example.com)
                      </p>
                    </div>
                    <div className="mt-4">
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <div className="mt-1">
                        <select
                          id="website"
                          name="website"
                          value={newDomain.websiteId}
                          onChange={(e) => setNewDomain({ ...newDomain, websiteId: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select a website</option>
                          {websites.map((website) => (
                            <option key={website.id} value={website.id}>
                              {website.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                      <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                      >
                        {processing ? 'Adding...' : 'Add Domain'}
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                        onClick={() => setIsAddModalOpen(false)}
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

      {/* DNS Records Modal */}
      <Transition.Root show={isDnsModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsDnsModalOpen}>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsDnsModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <ServerIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        DNS Records for {selectedDomain?.name}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Configure these DNS records at your domain registrar to connect your domain.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Host
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Value
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              TTL
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedDomain?.dnsRecords.map((record, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                                {record.type}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                                {record.host}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                                {record.value}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                                {record.ttl}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-5 sm:mt-6">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
                        onClick={() => setIsDnsModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}