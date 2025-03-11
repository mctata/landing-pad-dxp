import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIContentGenerationForm } from '@/components/ai';

describe('AIContentGenerationForm', () => {
  // Define a mock function for the onGenerate prop
  const mockOnGenerate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with correct fields', () => {
    render(
      <AIContentGenerationForm 
        onGenerate={mockOnGenerate} 
        isLoading={false} 
        elementType="text"
      />
    );

    // Check if form elements exist
    expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });

  it('submits the form with correct values', async () => {
    render(
      <AIContentGenerationForm 
        onGenerate={mockOnGenerate} 
        isLoading={false} 
        elementType="text"
      />
    );

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/prompt/i), 'Create a catchy headline for a tech website');
    await userEvent.selectOptions(screen.getByLabelText(/tone/i), 'professional');
    await userEvent.selectOptions(screen.getByLabelText(/length/i), 'medium');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // Check if onGenerate was called with the correct values
    expect(mockOnGenerate).toHaveBeenCalledWith({
      prompt: 'Create a catchy headline for a tech website',
      tone: 'professional',
      length: 'medium',
      elementType: 'text'
    });
  });

  it('disables the form when loading', () => {
    render(
      <AIContentGenerationForm 
        onGenerate={mockOnGenerate} 
        isLoading={true} 
        elementType="text"
      />
    );

    // Check if form elements are disabled
    expect(screen.getByLabelText(/prompt/i)).toBeDisabled();
    expect(screen.getByLabelText(/tone/i)).toBeDisabled();
    expect(screen.getByLabelText(/length/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });

  it('shows different field labels based on element type', () => {
    // Render form for a "hero" element
    const { rerender } = render(
      <AIContentGenerationForm 
        onGenerate={mockOnGenerate} 
        isLoading={false} 
        elementType="hero"
      />
    );

    // Check if hero-specific label exists
    expect(screen.getByLabelText(/hero section prompt/i)).toBeInTheDocument();

    // Re-render with a different element type
    rerender(
      <AIContentGenerationForm 
        onGenerate={mockOnGenerate} 
        isLoading={false} 
        elementType="features"
      />
    );

    // Check if features-specific label exists
    expect(screen.getByLabelText(/features section prompt/i)).toBeInTheDocument();
  });
});
