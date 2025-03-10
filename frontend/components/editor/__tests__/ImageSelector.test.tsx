import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageSelector from '../ImageSelector';

// Mock the Dialog component because it uses Portal which isn't available in tests
jest.mock('@/components/ui/dialog', () => {
  return {
    Dialog: ({ children, open, onOpenChange }: any) => (
      <div data-testid="dialog" data-open={open}>
        {children}
      </div>
    ),
    DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
    DialogContent: ({ children, ...props }: any) => (
      <div data-testid="dialog-content" {...props}>
        {children}
      </div>
    ),
    DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
    DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  };
});

// Mock Tab component
jest.mock('@headlessui/react', () => {
  return {
    Tab: {
      Group: ({ children }: any) => <div data-testid="tab-group">{children}</div>,
      List: ({ children }: any) => <div data-testid="tab-list">{children}</div>,
      Panels: ({ children }: any) => <div data-testid="tab-panels">{children}</div>,
      Panel: ({ children }: any) => <div data-testid="tab-panel">{children}</div>,
    },
  };
});

// Mock the Image components
jest.mock('../ImageUploader', () => () => <div data-testid="image-uploader">Image Uploader</div>);
jest.mock('../UnsplashBrowser', () => () => <div data-testid="unsplash-browser">Unsplash Browser</div>);
jest.mock('../ImageGallery', () => () => <div data-testid="image-gallery">Image Gallery</div>);
jest.mock('@/components/ui/ResponsiveImage', () => ({
  ResponsiveImage: ({ src, alt }: any) => <img data-testid="responsive-image" src={src} alt={alt} />,
}));

describe('ImageSelector Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with empty state correctly', () => {
    render(<ImageSelector value="" onChange={mockOnChange} label="Test Image" />);
    
    // Check if label is rendered
    expect(screen.getByText('Test Image')).toBeInTheDocument();
    
    // Check if placeholder button is rendered
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders with an image correctly', () => {
    render(
      <ImageSelector 
        value="https://example.com/test.jpg" 
        onChange={mockOnChange} 
        label="Test Image" 
      />
    );
    
    // Check if the image is rendered
    const image = screen.getByTestId('responsive-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/test.jpg');
    
    // Action buttons should be rendered (but might be hidden until hover)
    const buttonTriggers = screen.getAllByTestId('dialog-trigger');
    expect(buttonTriggers.length).toBeGreaterThan(0);
  });

  it('applies required attribute correctly', () => {
    render(
      <ImageSelector 
        value="" 
        onChange={mockOnChange} 
        label="Required Image" 
        required={true} 
      />
    );
    
    // Check if label has required indicator
    const label = screen.getByText('Required Image');
    expect(label.parentElement).toHaveClass('after:content-[\'*\']');
    
    // Check if button has required attribute
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-required', 'true');
  });

  it('handles keyboard interaction correctly', () => {
    render(<ImageSelector value="" onChange={mockOnChange} label="Test Image" />);
    
    // Get the button and focus it
    const button = screen.getByRole('button');
    button.focus();
    
    // Verify it's focused
    expect(button).toHaveFocus();
    
    // Press Enter to open dialog
    fireEvent.keyDown(button, { key: 'Enter' });
    
    // Dialog should be triggered
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');
  });

  it('provides accessible status updates', () => {
    render(
      <ImageSelector 
        value="https://example.com/test.jpg" 
        onChange={mockOnChange} 
        label="Test Image" 
      />
    );
    
    // Check if there's a status message for screen readers
    const status = screen.getByText('Image selected: Test Image');
    expect(status).toHaveClass('sr-only');
  });

  it('provides proper descriptions', () => {
    render(
      <ImageSelector 
        value="" 
        onChange={mockOnChange} 
        label="Test Image" 
        description="This is a test description" 
      />
    );
    
    // Check if description is rendered
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
    
    // Check if button is associated with the description
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-describedby');
  });
});
