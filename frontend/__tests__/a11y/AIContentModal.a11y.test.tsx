import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, runA11yTest } from './a11y-setup';
import AIContentModal from '@/components/ai/AIContentModal';
import { AIProvider } from '@/lib/ai/ai-context';

// Mock the AIService
jest.mock('@/lib/services/aiService', () => ({
  generateContent: jest.fn().mockResolvedValue({
    heading: 'Test Heading',
    subheading: 'Test Subheading',
    body: 'Test body content.'
  }),
  getSuggestions: jest.fn(),
  modifyContent: jest.fn()
}));

// Mock the Button component
jest.mock('@/components/ui/Button', () => {
  return {
    __esModule: true,
    Button: ({ children, onClick, isLoading, disabled, ...props }: any) => (
      <button 
        onClick={onClick} 
        disabled={disabled || isLoading} 
        data-loading={isLoading ? 'true' : 'false'}
        {...props}
      >
        {isLoading ? 'Loading...' : children}
      </button>
    )
  };
});

describe('AIContentModal Accessibility Tests', () => {
  it('should not have accessibility violations when in form state', async () => {
    const { container } = render(
      <AIProvider>
        <AIContentModal
          isOpen={true}
          onClose={() => {}}
          elementType="text"
          onApplyContent={() => {}}
        />
      </AIProvider>
    );
    
    await runA11yTest(container);
  });
  
  it('should have proper focus management', async () => {
    const { container, getByRole } = render(
      <AIProvider>
        <AIContentModal
          isOpen={true}
          onClose={() => {}}
          elementType="text"
          onApplyContent={() => {}}
        />
      </AIProvider>
    );
    
    // Check that close button is focused initially (as specified in the component)
    const closeButton = getByRole('button', { name: /close dialog/i });
    expect(document.activeElement).toBe(closeButton);
    
    // Run a11y tests
    await runA11yTest(container);
  });
  
  it('should handle aria-* attributes correctly in the preview state', async () => {
    // To test preview state, we need to trigger content generation
    // This would normally be tested in an integration test, but we're checking a11y here
    
    const { container, getByLabelText, getByRole, findByText } = render(
      <AIProvider>
        <AIContentModal
          isOpen={true}
          onClose={() => {}}
          elementType="text"
          onApplyContent={() => {}}
        />
      </AIProvider>
    );
    
    // Fill in the form
    const promptInput = getByLabelText(/describe what you want to generate/i);
    await userEvent.type(promptInput, 'Test accessibility');
    
    // Submit the form
    const generateButton = getByRole('button', { name: /generate content/i });
    await userEvent.click(generateButton);
    
    // Wait for preview content to appear
    await findByText('Test Heading');
    
    // Run a11y tests on the preview state
    await runA11yTest(container);
  });
  
  it('should render appropriate a11y attributes for loading states', async () => {
    // Mock a slow API response to test loading state a11y
    jest.mock('@/lib/services/aiService', () => ({
      generateContent: jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          heading: 'Test Heading',
          subheading: 'Test Subheading', 
          body: 'Test body content.'
        }), 500))
      ),
      getSuggestions: jest.fn(),
      modifyContent: jest.fn()
    }));
    
    const { container, getByLabelText, getByRole, queryByText } = render(
      <AIProvider>
        <AIContentModal
          isOpen={true}
          onClose={() => {}}
          elementType="text"
          onApplyContent={() => {}}
        />
      </AIProvider>
    );
    
    // Fill in the form
    const promptInput = getByLabelText(/describe what you want to generate/i);
    await userEvent.type(promptInput, 'Test accessibility');
    
    // Submit the form
    const generateButton = getByRole('button', { name: /generate content/i });
    await userEvent.click(generateButton);
    
    // In loading state, button should have aria-busy="true"
    const loadingButton = getByRole('button', { name: /generating/i });
    expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    
    // Run a11y tests on the loading state
    await runA11yTest(container);
  });
  
  it('should handle error states accessibly', async () => {
    // Mock API to throw an error
    jest.mock('@/lib/services/aiService', () => ({
      generateContent: jest.fn().mockRejectedValue(new Error('Test error')),
      getSuggestions: jest.fn(),
      modifyContent: jest.fn()
    }));
    
    const { container, getByLabelText, getByRole, findByRole } = render(
      <AIProvider>
        <AIContentModal
          isOpen={true}
          onClose={() => {}}
          elementType="text"
          onApplyContent={() => {}}
        />
      </AIProvider>
    );
    
    // Fill in the form
    const promptInput = getByLabelText(/describe what you want to generate/i);
    await userEvent.type(promptInput, 'Test accessibility error');
    
    // Submit the form
    const generateButton = getByRole('button', { name: /generate content/i });
    await userEvent.click(generateButton);
    
    // Wait for error message to appear
    const errorMessage = await findByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    
    // Run a11y tests on the error state
    await runA11yTest(container);
  });
});
