import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIEnhanceToolbar } from '@/components/ai';
import { AIProvider } from '@/lib/ai/ai-context';
import aiService from '@/lib/services/aiService';

// Mock the AI service
jest.mock('@/lib/services/aiService');

describe('AIEnhanceToolbar', () => {
  const mockContent = 'This is some test content that needs to be enhanced.';
  const mockOnUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (aiService.modifyContent as jest.Mock).mockResolvedValue({
      content: 'Enhanced test content!'
    });
  });
  
  it('renders toolbar with all action buttons', () => {
    render(
      <AIProvider>
        <AIEnhanceToolbar 
          content={mockContent}
          onUpdate={mockOnUpdate}
          websiteId="website-123"
          pageId="page-456"
        />
      </AIProvider>
    );
    
    // Check if all action buttons are rendered
    expect(screen.getByRole('button', { name: /shorten/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rewrite/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /formal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /casual/i })).toBeInTheDocument();
  });
  
  it('calls service and updates content when shorten button is clicked', async () => {
    render(
      <AIProvider>
        <AIEnhanceToolbar 
          content={mockContent}
          onUpdate={mockOnUpdate}
          websiteId="website-123"
          pageId="page-456"
        />
      </AIProvider>
    );
    
    // Click shorten button
    await userEvent.click(screen.getByRole('button', { name: /shorten/i }));
    
    // Check if service was called with correct parameters
    await waitFor(() => {
      expect(aiService.modifyContent).toHaveBeenCalledWith({
        content: mockContent,
        action: 'shorten'
      });
    });
    
    // Check if onUpdate was called with modified content
    expect(mockOnUpdate).toHaveBeenCalledWith('Enhanced test content!');
  });
  
  it('shows loading state during content modification', async () => {
    // Make service call take some time
    (aiService.modifyContent as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ content: 'Enhanced content!' });
        }, 100);
      });
    });
    
    render(
      <AIProvider>
        <AIEnhanceToolbar 
          content={mockContent}
          onUpdate={mockOnUpdate}
          websiteId="website-123"
          pageId="page-456"
        />
      </AIProvider>
    );
    
    // Click expand button
    await userEvent.click(screen.getByRole('button', { name: /expand/i }));
    
    // Check for loading state
    expect(screen.getByRole('button', { name: /expanding/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expanding/i })).toBeDisabled();
    
    // Wait for operation to complete
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /expanding/i })).not.toBeInTheDocument();
    });
    
    // Original button should be back
    expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument();
  });
  
  it('handles errors during content modification', async () => {
    // Mock error
    const mockError = new Error('API Error');
    (aiService.modifyContent as jest.Mock).mockRejectedValue(mockError);
    
    render(
      <AIProvider>
        <AIEnhanceToolbar 
          content={mockContent}
          onUpdate={mockOnUpdate}
          websiteId="website-123"
          pageId="page-456"
        />
      </AIProvider>
    );
    
    // Click rewrite button
    await userEvent.click(screen.getByRole('button', { name: /rewrite/i }));
    
    // Wait for the operation to fail
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /rewriting/i })).not.toBeInTheDocument();
    });
    
    // Check if onUpdate was NOT called (as operation failed)
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
  
  it('handles style changes with parameters', async () => {
    render(
      <AIProvider>
        <AIEnhanceToolbar 
          content={mockContent}
          onUpdate={mockOnUpdate}
          websiteId="website-123"
          pageId="page-456"
        />
      </AIProvider>
    );
    
    // Click formal style button
    await userEvent.click(screen.getByRole('button', { name: /formal/i }));
    
    // Check if service was called with correct parameters
    await waitFor(() => {
      expect(aiService.modifyContent).toHaveBeenCalledWith({
        content: mockContent,
        action: 'changeStyle',
        parameters: { style: 'professional' }
      });
    });
  });
});
