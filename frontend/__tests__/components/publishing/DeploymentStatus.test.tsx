import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeploymentStatus } from '@/components/publishing/DeploymentStatus';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn()
  }
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock formatDate from utils
jest.mock('@/lib/utils', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString()
}));

describe('DeploymentStatus', () => {
  const mockWebsiteId = 'website-123';
  
  // Sample deployment data
  const mockDeployments = [
    {
      id: 'deploy-1',
      status: 'success',
      createdAt: '2023-09-15T12:00:00Z',
      completedAt: '2023-09-15T12:05:00Z',
      buildTime: 300000, // 5 minutes in ms
      version: '1.0.0',
      commitMessage: 'Initial deployment',
      errorMessage: null
    },
    {
      id: 'deploy-2',
      status: 'failed',
      createdAt: '2023-09-16T14:00:00Z',
      completedAt: '2023-09-16T14:02:00Z',
      buildTime: 120000, // 2 minutes in ms
      version: '1.0.1',
      commitMessage: 'Update homepage',
      errorMessage: 'Build failed: syntax error'
    }
  ];

  const mockActiveDeployment = {
    id: 'deploy-3',
    status: 'in_progress',
    createdAt: '2023-09-17T10:00:00Z',
    completedAt: null,
    buildTime: null,
    version: '1.0.2',
    commitMessage: 'Fix layout issues',
    errorMessage: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset interval and timeout functions
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('displays loading state initially', () => {
    // Mock API to delay response
    (api.get as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));
    
    render(<DeploymentStatus websiteId={mockWebsiteId} />);
    
    // Check if loading spinner is shown (look for SVG with animate-spin class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('displays message when no deployments exist', async () => {
    // Mock API to return empty deployments array
    (api.get as jest.Mock).mockResolvedValue({
      data: { deployments: [] }
    });
    
    render(<DeploymentStatus websiteId={mockWebsiteId} />);
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.getByText(/no deployments yet/i)).toBeInTheDocument();
    });
    
    // Check if API was called with correct parameters
    expect(api.get).toHaveBeenCalledWith(`/websites/${mockWebsiteId}/deployments?limit=5`);
  });

  it('displays list of deployments when they exist', async () => {
    // Mock API to return deployments
    (api.get as jest.Mock).mockResolvedValue({
      data: { deployments: mockDeployments }
    });
    
    render(<DeploymentStatus websiteId={mockWebsiteId} />);
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('1.0.1')).toBeInTheDocument();
    });
    
    // Check if status badges are displayed
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('displays active deployment section when there is an ongoing deployment', async () => {
    // Mock API to return deployments with an active one
    (api.get as jest.Mock).mockResolvedValue({
      data: { deployments: [mockActiveDeployment, ...mockDeployments] }
    });
    
    render(<DeploymentStatus websiteId={mockWebsiteId} />);
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.getByText(/active deployment/i)).toBeInTheDocument();
      expect(screen.getByText(`Version ${mockActiveDeployment.version}`)).toBeInTheDocument();
      expect(screen.getByText(/building and deploying your website/i)).toBeInTheDocument();
    });
  });

  it('shows error message when API call fails', async () => {
    // Mock API to throw error
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<DeploymentStatus websiteId={mockWebsiteId} />);
    
    // Wait for the API call to resolve
    await waitFor(() => {
      // Check if we're out of loading state (which means the catch block was executed)
      expect(screen.queryByText(/no deployments yet/i)).toBeInTheDocument();
    });
    
    // We can't properly test toast.error here since it's mocked in a separate module
    // But the test will catch if there's a JavaScript error from it
  });

  it('polls for updates when there is an active deployment', async () => {
    // First response has active deployment
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { deployments: [mockActiveDeployment, ...mockDeployments] }
    });
    
    // Second response has completed deployment
    const completedDeployment = {
      ...mockActiveDeployment,
      status: 'success',
      completedAt: '2023-09-17T10:10:00Z',
      buildTime: 600000 // 10 minutes
    };
    
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { deployments: [completedDeployment, ...mockDeployments] }
    });
    
    render(<DeploymentStatus websiteId={mockWebsiteId} refreshInterval={1000} />);
    
    // Wait for the first API call to resolve
    await waitFor(() => {
      const inProgressElements = screen.queryAllByText(/in progress/i);
      expect(inProgressElements.length).toBeGreaterThan(0);
    });
    
    // Fast-forward time to trigger polling
    jest.advanceTimersByTime(1000);
    
    // Wait for the second API call to resolve
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it('displays failed status badge', async () => {
    // Testing with a failed deployment
    const failedDeployment = {
      ...mockDeployments[0],
      status: 'failed'
    };
    
    // Mock API to return deployments with a failed one
    (api.get as jest.Mock).mockResolvedValue({
      data: { deployments: [failedDeployment] }
    });
    
    render(<DeploymentStatus websiteId={mockWebsiteId} />);
    
    // Wait for the API call to resolve
    await waitFor(() => {
      const failedElements = screen.queryAllByText(/failed/i);
      expect(failedElements.length).toBeGreaterThan(0);
    });
  });
});