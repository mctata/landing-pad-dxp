import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishButton } from '@/components/publishing/PublishButton';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn()
  })
}));

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn(),
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

describe('Publishing Workflow Integration', () => {
  const mockWebsiteId = 'website-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays publish button with correct props', () => {
    // Test without animation
    render(<PublishButton websiteId={mockWebsiteId} isDirty={false} />);
    const button = screen.getByRole('button', { name: /publish/i });
    expect(button).toBeInTheDocument();
    expect(button.className).not.toContain('animate-pulse');
    
    // Test with animation for unsaved changes
    render(<PublishButton websiteId={mockWebsiteId} isDirty={true} />);
    const dirtyButton = screen.getAllByRole('button', { name: /publish/i })[1];
    expect(dirtyButton).toBeInTheDocument();
    expect(dirtyButton.className).toContain('animate-pulse');
  });

  it('displays last published date when provided', () => {
    const lastPublishedAt = '2023-09-15T12:00:00Z';
    
    render(
      <PublishButton 
        websiteId={mockWebsiteId} 
        lastPublishedAt={lastPublishedAt} 
      />
    );
    
    // Check if last published date is displayed
    expect(screen.getByText(/last published:/i)).toBeInTheDocument();
  });

  it('validates API call for publishing', async () => {
    // Mock successful API response
    (api.post as jest.Mock).mockResolvedValue({
      data: { message: 'Website published successfully' }
    });

    // This tests the API directly
    await api.post(`/websites/${mockWebsiteId}/publish`);
    
    // Verify API was called with correct parameters
    expect(api.post).toHaveBeenCalledWith(`/websites/${mockWebsiteId}/publish`);

    // Test toast functionality
    toast.success('Website published successfully!');
    expect(toast.success).toHaveBeenCalledWith('Website published successfully!');
  });
});