import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishButton } from '@/components/publishing/PublishButton';

// Mock the PublishModal component
jest.mock('@/components/publishing/PublishModal', () => {
  return {
    __esModule: true,
    default: ({ isOpen, onClose, websiteId, isDirty }) => 
      isOpen ? (
        <div data-testid="publish-modal">
          <button onClick={onClose} data-testid="close-modal-btn">Close</button>
          <div>Website ID: {websiteId}</div>
          <div>Is Dirty: {isDirty ? 'true' : 'false'}</div>
        </div>
      ) : null
  };
});

describe('PublishButton', () => {
  it('renders the publish button', () => {
    render(<PublishButton websiteId="website-123" />);
    
    // Check if button exists
    const button = screen.getByRole('button', { name: /publish/i });
    expect(button).toBeInTheDocument();
    
    // Modal should not be visible initially
    expect(screen.queryByTestId('publish-modal')).not.toBeInTheDocument();
  });
  
  it('displays last published date when provided', () => {
    const lastPublishedAt = '2023-09-15T12:00:00Z';
    
    render(
      <PublishButton 
        websiteId="website-123" 
        lastPublishedAt={lastPublishedAt} 
      />
    );
    
    // Check if last published date is displayed
    expect(screen.getByText(/last published:/i)).toBeInTheDocument();
  });
  
  it('does not display last published date when not provided', () => {
    render(
      <PublishButton 
        websiteId="website-123" 
        lastPublishedAt={null} 
      />
    );
    
    // Check if last published date is not displayed
    expect(screen.queryByText(/last published:/i)).not.toBeInTheDocument();
  });
  
  it('applies animation class when isDirty is true', () => {
    render(
      <PublishButton 
        websiteId="website-123" 
        isDirty={true} 
      />
    );
    
    // Check if animation class is applied
    const button = screen.getByRole('button', { name: /publish/i });
    expect(button.className).toContain('animate-pulse');
  });
  
  it('does not apply animation class when isDirty is false', () => {
    render(
      <PublishButton 
        websiteId="website-123" 
        isDirty={false} 
      />
    );
    
    // Check if animation class is not applied
    const button = screen.getByRole('button', { name: /publish/i });
    expect(button.className).not.toContain('animate-pulse');
  });
  
  it('opens modal when clicked and passes correct props', async () => {
    render(
      <PublishButton 
        websiteId="website-123" 
        isDirty={true} 
      />
    );
    
    // Click the button
    await userEvent.click(screen.getByRole('button', { name: /publish/i }));
    
    // Check if modal is opened
    const modal = screen.getByTestId('publish-modal');
    expect(modal).toBeInTheDocument();
    
    // Check if correct props are passed
    expect(screen.getByText(/website id: website-123/i)).toBeInTheDocument();
    expect(screen.getByText(/is dirty: true/i)).toBeInTheDocument();
  });
  
  it('closes modal when close button is clicked', async () => {
    render(
      <PublishButton 
        websiteId="website-123" 
        isDirty={true} 
      />
    );
    
    // Click the button to open the modal
    await userEvent.click(screen.getByRole('button', { name: /publish/i }));
    
    // Modal should be visible
    expect(screen.getByTestId('publish-modal')).toBeInTheDocument();
    
    // Click the close button
    await userEvent.click(screen.getByTestId('close-modal-btn'));
    
    // Modal should be closed
    expect(screen.queryByTestId('publish-modal')).not.toBeInTheDocument();
  });
});