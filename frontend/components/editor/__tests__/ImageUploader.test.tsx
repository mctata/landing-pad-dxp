import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUploader from '../ImageUploader';
import { useImageStore } from '@/lib/store/useImageStore';

// Mock zustand store
jest.mock('@/lib/store/useImageStore', () => ({
  useImageStore: jest.fn(),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('ImageUploader Component', () => {
  const mockUploadImage = jest.fn();
  const mockOnUploadSuccess = jest.fn();
  const mockOnUploadError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useImageStore as jest.Mock).mockImplementation((selector) => {
      const state = {
        uploadImage: mockUploadImage,
      };
      return selector(state);
    });

    // Mock successful upload
    mockUploadImage.mockResolvedValue({
      id: 'test-id',
      url: 'https://example.com/test-image.jpg',
      name: 'test-image.jpg',
      source: 'upload',
      createdAt: new Date().toISOString(),
    });
  });

  it('renders uploader in initial state', () => {
    render(<ImageUploader onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
    
    expect(screen.getByText(/Drag and drop an image, or/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Files/i)).toBeInTheDocument();
  });

  it('handles file upload when browse button is clicked', async () => {
    render(<ImageUploader onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
    
    // Create a test file
    const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Get file input and simulate upload
    const input = screen.getByRole('button', { name: /Browse Files/i });
    fireEvent.click(input);
    
    // Since we can't directly trigger the file input, we'll check if the onClick handler works
    // by checking if the uploadImage function is called when we simulate a file change
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
      
      await waitFor(() => {
        expect(mockUploadImage).toHaveBeenCalledWith(file, expect.any(Object));
      });
      
      // Wait for upload success callback
      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalledWith('https://example.com/test-image.jpg');
      });
    }
  });

  it('handles upload errors correctly', async () => {
    // Mock upload failure
    mockUploadImage.mockRejectedValue(new Error('Upload failed'));
    
    render(<ImageUploader onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
    
    // Create a test file
    const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Get file input and simulate upload
    const input = screen.getByRole('button', { name: /Browse Files/i });
    fireEvent.click(input);
    
    // Simulate file change
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
      
      await waitFor(() => {
        expect(mockUploadImage).toHaveBeenCalledWith(file, expect.any(Object));
      });
      
      // Wait for error callback
      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith(expect.any(Error));
      });
    }
  });

  it('validates file types', async () => {
    render(<ImageUploader onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
    
    // Create an invalid file type
    const file = new File(['test'], 'test-document.pdf', { type: 'application/pdf' });
    
    // Get file input and simulate upload
    const input = screen.getByRole('button', { name: /Browse Files/i });
    fireEvent.click(input);
    
    // Simulate file change
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
      
      // Check if error is displayed
      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith(expect.any(Error));
      });
    }
  });
});
