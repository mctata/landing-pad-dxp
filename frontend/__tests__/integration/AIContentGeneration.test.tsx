import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIProvider } from '@/lib/ai/ai-context';
import { AIContentModal, AIEnhanceToolbar } from '@/components/ai';
import aiService from '@/lib/services/aiService';

// Mock the AI service
jest.mock('@/lib/services/aiService');

describe('AI Content Generation Integration', () => {
  const mockOnApply = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock implementations
    (aiService.generateContent as jest.Mock).mockResolvedValue({
      heading: 'Generated Heading',
      subheading: 'Generated Subheading',
      body: 'Generated body content for testing purposes.'
    });
    
    (aiService.modifyContent as jest.Mock).mockResolvedValue({
      content: 'Modified content for testing.'
    });
  });
  
  it('completes a full content generation flow', async () => {
    render(
      <AIProvider>
        <AIContentModal
          isOpen={true}
          onClose={mockOnClose}
          elementType="text"
          onApplyContent={mockOnApply}
          websiteId="website-123"
          pageId="page-456"
        />
      </AIProvider>
    );
    
    // Check if form is rendered
    expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/prompt/i), 'Create content for testing');
    await userEvent.selectOptions(screen.getByLabelText(/tone/i), 'professional');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));
    
    // Check for loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    
    // Wait for content to be generated
    await waitFor(() => {
      expect(screen.getByText('Generated Heading')).toBeInTheDocument();
    });
    
    // Apply the generated content
    await userEvent.click(screen.getByRole('button', { name: /apply/i }));
    
    // Check if onApply was called with the generated content
    expect(mockOnApply).toHaveBeenCalledWith({
      heading: 'Generated Heading',
      subheading: 'Generated Subheading',
      body: 'Generated body content for testing purposes.'
    });
  });
  
  it('successfully enhances existing content', async () => {
    render(
      <AIProvider>
        <AIEnhanceToolbar
          content="Original content for testing"
          onUpdate={mockOnUpdate}
          websiteId="website-123"
          pageId="page-456"
        />
      </AIProvider>
    );
    
    // Click the rewrite button
    await userEvent.click(screen.getByRole('button', { name: /rewrite/i }));
    
    // Wait for the operation to complete
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('Modified content for testing.');
    });
  });
  
  it('handles errors during the generation flow', async () => {
    // Mock error
    (aiService.generateContent as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(
      <AIProvider>
        <AIContentModal
          isOpen={true}
          onClose={mockOnClose}
          elementType="text"
          onApplyContent={mockOnApply}
          websiteId="website-123"
          pageId="page-456"
        />
      </AIProvider>
    );
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/prompt/i), 'Error test');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));
    
    // Wait for error to be shown
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
    
    // Try again button should be visible
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
