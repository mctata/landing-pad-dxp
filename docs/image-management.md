# Image Management

The image management system allows users to upload, browse, select, and optimize images for their website projects. This document provides an overview of the available features and components.

## Features

- Upload images from local device
- Search and use images from Unsplash
- Browse and manage previously uploaded images
- Automatically optimize images for web use
- Responsive image loading with placeholders
- Image metadata management
- Fully accessible UI with keyboard navigation and screen reader support
- Mobile-friendly touch targets and responsive design

## Components

### ImageSelector

The main component that combines all the image selection functionality:

```jsx
import { ImageSelector } from '@/components/editor';

function MyComponent() {
  const [imageUrl, setImageUrl] = useState('');
  
  return (
    <ImageSelector
      value={imageUrl}
      onChange={setImageUrl}
      label="Feature Image"
      description="Choose an image for this section"
      required={true}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| value | string | The current image URL |
| onChange | function | Callback when an image is selected |
| label | string | Label for the image field |
| description | string | Description text |
| className | string | Additional CSS classes |
| placeholder | string | Placeholder text when no image is selected |
| previewClassName | string | CSS classes for the image preview |
| buttonText | string | Text for the selection button |
| required | boolean | Whether the field is required |

### ImageUploader

Component for uploading images from the local device:

```jsx
import { ImageUploader } from '@/components/editor';

function UploadComponent() {
  return (
    <ImageUploader
      onUploadSuccess={(url) => console.log('Uploaded:', url)}
      onUploadError={(error) => console.error(error)}
      maxFileSizeMB={5}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| onUploadSuccess | function | Callback when upload succeeds |
| onUploadError | function | Callback when upload fails |
| maxFileSizeMB | number | Maximum file size in MB |
| maxWidth | number | Maximum width for resizing |
| maxHeight | number | Maximum height for resizing |
| quality | number | JPEG quality (0-1) |
| className | string | Additional CSS classes |

### UnsplashBrowser

Component for browsing and searching Unsplash images:

```jsx
import { UnsplashBrowser } from '@/components/editor';

function UnsplashComponent() {
  return (
    <UnsplashBrowser
      onSelect={(image) => console.log('Selected:', image)}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| onSelect | function | Callback when an image is selected |
| className | string | Additional CSS classes |

### ImageGallery

Component for browsing and managing uploaded images:

```jsx
import { ImageGallery } from '@/components/editor';

function GalleryComponent() {
  return (
    <ImageGallery
      onSelect={(image) => console.log('Selected:', image)}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| onSelect | function | Callback when an image is selected |
| className | string | Additional CSS classes |

### ResponsiveImage

A performance-optimized image component:

```jsx
import { ResponsiveImage } from '@/components/ui';

function ImageComponent() {
  return (
    <ResponsiveImage
      src="/images/example.jpg"
      alt="Example image"
      aspectRatio="16/9"
      objectFit="cover"
      fadeIn={true}
      fallbackSrc="/images/placeholder.svg"
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| src | string | Image source URL |
| alt | string | Alt text for the image |
| sizes | string | Sizes attribute for responsive loading |
| className | string | Additional CSS classes |
| objectFit | string | CSS object-fit property |
| aspectRatio | string | Aspect ratio (e.g. '16/9') |
| background | string | Background CSS class |
| loadingStrategy | string | 'lazy' or 'eager' |
| placeholderSize | number | Size of the placeholder in pixels |
| fadeIn | boolean | Whether to fade in the image |
| fallbackSrc | string | Fallback image URL if loading fails |

## API Endpoints

### Upload Image

```
POST /api/images/upload
```

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - file: Image file
  - name: (optional) Image name
  - alt: (optional) Alt text
  - description: (optional) Description
  - tags: (optional) Comma-separated tags

**Response:**
```json
{
  "id": "image-id",
  "url": "/uploads/image.jpg",
  "thumbnailUrl": "/uploads/image.jpg",
  "name": "Image name",
  "description": "Image description",
  "alt": "Alt text",
  "tags": ["tag1", "tag2"],
  "source": "upload",
  "createdAt": "2025-03-10T06:00:00Z",
  "size": 12345
}
```

### Unsplash API Proxy

```
GET /api/unsplash/search?query=nature
GET /api/unsplash/photos/:id
GET /api/unsplash/random
GET /api/unsplash/collections
GET /api/unsplash/collections/:id/photos
```

These endpoints proxy requests to the Unsplash API while securing API keys.

## Image Store

The image store manages the state of images using Zustand:

```javascript
import { useImageStore } from '@/lib/store/useImageStore';

// Get images
const images = useImageStore(state => state.images);

// Get upload function
const uploadImage = useImageStore(state => state.uploadImage);

// Upload an image
uploadImage(fileObject, { name: 'My Image' })
  .then(image => console.log('Uploaded:', image))
  .catch(error => console.error('Upload failed:', error));
```

## Utilities

Image utility functions are available in `@/lib/utils/imageUtils`:

```javascript
import { 
  resizeImageFile, 
  isValidImage, 
  generatePlaceholderImage 
} from '@/lib/utils/imageUtils';

// Resize an image before upload
const resizedBlob = await resizeImageFile(fileObject, 1200, 800, 0.8);

// Check if a file is a valid image
if (isValidImage(fileObject)) {
  // File is an image
}

// Generate a placeholder for progressive loading
const placeholderDataUrl = await generatePlaceholderImage(imageUrl, 20);
```

## Environment Variables

```
# Unsplash API
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
UNSPLASH_SECRET_KEY=your_unsplash_secret_key
```

## Accessibility Features

The image management components are built with accessibility in mind:

### Keyboard Navigation

- All components are fully navigable using the keyboard
- Tab navigation for interactive elements
- Enter/Space keys to activate buttons and select images
- Escape key to close dialogs and cancel operations
- Arrow keys for navigation within components (where applicable)
- Focus trapping within dialogs to prevent focus from leaving the dialog

### Screen Reader Support

- Proper ARIA roles, states, and properties for all components
- Live regions for dynamic content updates (e.g., loading states, errors)
- Descriptive labels for all interactive elements
- Status announcements for operations like uploads and selections
- Proper heading structure for content organization

### Semantic HTML

- Proper HTML elements used for their intended purposes
- Form controls with associated labels
- Images with appropriate alt text
- Dialogs with proper heading structure

### Visual Indicators

- Clear focus states for keyboard navigation
- Loading states with visual indicators
- Error states with proper error messages
- Visual feedback for selected items

### Touch Support

- Minimum touch target size of 44×44 pixels for mobile devices
- Responsive design that works across all screen sizes
- Proper spacing between interactive elements to prevent accidental taps

## Best Practices

### Image Optimization

- Always use the `ResponsiveImage` component for displaying images on the frontend
- Set appropriate sizes for images to avoid unnecessary large downloads
- Use WebP format when possible for better compression
- Set appropriate quality settings for your use case (70-80% is usually sufficient)
- Implement lazy loading for images below the fold

### Responsive Images

To create responsive images for different screen sizes:

```jsx
<ResponsiveImage
  src={imageUrl}
  alt="Responsive image example"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  aspectRatio="16/9"
/>
```

### Accessibility

- Always provide meaningful alt text for images
- Use appropriate contrast ratios for images with text
- Avoid using images of text when possible
- Test with screen readers to ensure images are properly described
- Ensure keyboard navigation works as expected

### Unsplash Attribution

When using Unsplash images, make sure to provide proper attribution as required by the Unsplash API license:

```jsx
<div className="text-xs text-gray-500">
  Photo by <a href={`https://unsplash.com/@${image.unsplashData.user.username}?utm_source=your_app&utm_medium=referral`}>{image.unsplashData.user.name}</a> on <a href="https://unsplash.com/?utm_source=your_app&utm_medium=referral">Unsplash</a>
</div>
```

## Testing Accessibility

To ensure the components remain accessible, consider the following testing approaches:

### Automated Testing

- Use tools like Axe, Lighthouse, or WAVE to scan for accessibility issues
- Integrate accessibility testing into your CI/CD pipeline
- Use React Testing Library to test keyboard navigation and focus management

### Manual Testing

- Test keyboard navigation through all components
- Use screen readers like NVDA, JAWS, or VoiceOver to test screen reader support
- Test with high contrast mode enabled to ensure proper contrast ratios
- Test with different zoom levels to ensure text remains readable
- Test with mobile devices to ensure touch targets are large enough

### Example Automated Test

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ImageSelector } from '@/components/editor';

test('ImageSelector has no accessibility violations', async () => {
  const { container } = render(
    <ImageSelector 
      value="" 
      onChange={() => {}} 
      label="Test Image" 
      required={true}
    />
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('ImageSelector can be operated with keyboard', () => {
  render(
    <ImageSelector 
      value="" 
      onChange={() => {}} 
      label="Test Image" 
    />
  );
  
  // Find the button and focus it
  const button = screen.getByRole('button', { name: /select image/i });
  button.focus();
  
  // Press Enter to open dialog
  fireEvent.keyDown(button, { key: 'Enter' });
  
  // Dialog should be open and first tab should be focused
  const tab = screen.getByRole('tab', { name: /upload/i });
  expect(tab).toHaveFocus();
});
```
