import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishModal } from '@/components/publishing/PublishModal';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn().mockResolvedValue({ data: { message: 'Success' } })
  }
}));

// Mock next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn()
  })
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

describe('PublishModal', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders nothing when isOpen is false', () => {
    render(
      <PublishModal 
        isOpen={false} 
        onClose={mockOnClose} 
        websiteId="website-123" 
        isDirty={false} 
      />
    );
    
    // Check if modal is not displayed
    expect(screen.queryByText(/publish website/i)).not.toBeInTheDocument();
  });
  
  it('renders confirmation step when isOpen is true', () => {
    render(
      <PublishModal 
        isOpen={true} 
        onClose={mockOnClose} 
        websiteId="website-123" 
        isDirty={false} 
      />
    );
    
    // Check if modal is displayed
    expect(screen.getByText(/publish website/i)).toBeInTheDocument();
    expect(screen.getByText(/publishing will make your website available to the public/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
  });
  
  it('displays warning when isDirty is true', () => {
    render(
      <PublishModal 
        isOpen={true} 
        onClose={mockOnClose} 
        websiteId="website-123" 
        isDirty={true} 
      />
    );
    
    // Check if warning is displayed - use queryAllByText to handle multiple matches
    const warningElements = screen.queryAllByText(/you have unsaved changes/i);
    expect(warningElements.length).toBeGreaterThan(0);
  });
  
  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup({ delay: null }); // Use zero delay for faster tests

    render(
      <PublishModal 
        isOpen={true} 
        onClose={mockOnClose} 
        websiteId="website-123" 
        isDirty={false} 
      />
    );
    
    // Click the Cancel button
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    // onClose should be called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // We'll add more comprehensive tests later after fixing the timing issues
});