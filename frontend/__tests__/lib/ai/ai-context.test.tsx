import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIProvider, useAI } from '@/lib/ai/ai-context';
import aiService from '@/lib/services/aiService';

// Mock the AI service
jest.mock('@/lib/services/aiService');

// Test component that uses the AI context
const TestComponent = () => {
  const { 
    generateContent, 
    isGeneratingContent, 
    latestContentResult,
    clearResults
  } = useAI();

  const handleGenerate = async () => {
    await generateContent({
      websiteId: 'test-website',
      pageId: 'test-page',
      elementType: 'text',
      prompt: 'Test prompt'
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} data-testid="generate-btn">
        Generate Content
      </button>
      <button onClick={clearResults} data-testid="clear-btn">
        Clear Results
      </button>
      {isGeneratingContent && <p data-testid="loading">Loading...</p>}
      {latestContentResult && (
        <div data-testid="content-result">
          <h2>{latestContentResult.heading}</h2>
          <h3>{latestContentResult.subheading}</h3>
          <p>{latestContentResult.body}</p>
        </div>
      )}
    </div>
  );
};

describe('AI Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides AI functionality to components', async () => {
    // Mock AI service response
    const mockContent = {
      heading: 'Test Heading',
      subheading: 'Test Subheading',
      body: 'Test body content'
    };
    (aiService.generateContent as jest.Mock).mockResolvedValue(mockContent);

    // Render component with AI provider
    render(
      <AIProvider>
        <TestComponent />
      </AIProvider>
    );

    // Initial state - no content displayed
    expect(screen.queryByTestId('content-result')).not.toBeInTheDocument();
    
    // Generate content
    await act(async () => {
      userEvent.click(screen.getByTestId('generate-btn'));
    });

    // Loading state should appear
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for content to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('content-result')).toBeInTheDocument();
    });

    // Check content is displayed correctly
    expect(screen.getByText('Test Heading')).toBeInTheDocument();
    expect(screen.getByText('Test Subheading')).toBeInTheDocument();
    expect(screen.getByText('Test body content')).toBeInTheDocument();

    // Clear results
    await act(async () => {
      userEvent.click(screen.getByTestId('clear-btn'));
    });

    // Content should be removed
    expect(screen.queryByTestId('content-result')).not.toBeInTheDocument();
  });

  it('handles errors during content generation', async () => {
    // Mock AI service error
    const mockError = new Error('API Error');
    (aiService.generateContent as jest.Mock).mockRejectedValue(mockError);

    // We'll create a custom component to test error handling
    const ErrorTestComponent = () => {
      const { generateContent, error } = useAI();

      const handleGenerate = async () => {
        try {
          await generateContent({
            websiteId: 'test-website',
            pageId: 'test-page',
            elementType: 'text',
            prompt: 'Test prompt'
          });
        } catch (e) {
          // Error is handled by context
        }
      };

      return (
        <div>
          <button onClick={handleGenerate} data-testid="generate-btn">
            Generate Content
          </button>
          {error && <p data-testid="error-message">{error.message}</p>}
        </div>
      );
    };

    // Render component with AI provider
    render(
      <AIProvider>
        <ErrorTestComponent />
      </AIProvider>
    );

    // Generate content (which will fail)
    await act(async () => {
      userEvent.click(screen.getByTestId('generate-btn'));
    });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });
});
