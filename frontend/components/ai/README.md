# AI Content Generation UI

The AI Content Generation UI provides a suite of React components for integrating AI-powered content generation, editing, and suggestion features into the Landing Pad Digital platform.

## Key Components

### Core Components

- **AIContentGenerationForm**: Form for submitting AI content generation requests with parameters like tone, length, and prompt.
- **AIContentEditor**: Interface for editing content with AI assistance, offering functions like shortening, expanding, and style adjustments.
- **AIContentModal**: Modal dialog for generating and previewing AI content before applying it.
- **AISuggestionPanel**: Panel for displaying AI content suggestions.
- **AISuggestionCard**: Card component for displaying individual AI suggestions with preview and apply functionality.
- **AIContentForm**: Forms for generating content with AI.
- **AIPromptInput**: Input component for AI prompts.

### Utility Components

- **AIAssistButton**: Button that triggers AI assistance for specific element types.
- **AIEnhanceToolbar**: Quick-access toolbar for common AI content enhancement functions.
- **AISuggestionPopover**: Popover component for displaying inline suggestions.

### Integration Components

- **AIElementPanel**: Panel that integrates with the website editor to provide AI assistance for specific page elements.

## Context Provider

The AI capabilities are managed through a React Context Provider:

- **AIProvider**: Provides state and methods for AI operations throughout the application.
- **useAI**: Custom hook for accessing AI functionality from any component.

## Features

- **Content Generation**: Create new content based on prompts and parameters.
- **Content Editing**: Modify existing content with AI assistance.
- **Suggestions**: Get multiple alternative suggestions for content or styling.
- **Style Transformation**: Change tone, formality, or other stylistic aspects of text.
- **Element-Specific Generation**: Create content tailored to specific UI elements (hero sections, features, etc.).

## Usage

### Basic Content Generation

```jsx
import { AIAssistButton } from '@/components/ai';

function MyComponent() {
  const handleContentGenerated = (content) => {
    console.log('Generated content:', content);
    // Apply content to your application
  };

  return (
    <AIAssistButton
      elementType="text"
      onContentGenerated={handleContentGenerated}
    />
  );
}
```

### Content Editing

```jsx
import { AIContentEditor } from '@/components/ai';

function MyEditor({ existingContent }) {
  const handleSave = (editedContent) => {
    console.log('Saved content:', editedContent);
    // Save edited content
  };

  const handleCancel = () => {
    // Handle cancellation
  };

  return (
    <AIContentEditor
      content={existingContent}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
```

### Getting Suggestions

```jsx
import { AISuggestionPanel } from '@/components/ai';

function MyPage() {
  const handleApplySuggestion = (suggestion) => {
    console.log('Applied suggestion:', suggestion);
    // Apply the suggestion
  };

  return (
    <AISuggestionPanel
      isOpen={true}
      onClose={() => {}}
      websiteId="website-id"
      pageId="page-id"
      onApplySuggestion={handleApplySuggestion}
    />
  );
}
```

## Integration with Editor

The AI Content Generation UI integrates with the Website Editor through the `AIElementPanel` component:

```jsx
import { AIElementPanel } from '@/components/editor';

function Editor() {
  // Editor state
  const [selectedElement, setSelectedElement] = useState(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  const handleUpdateElement = (elementId, updates) => {
    // Update element in your state
  };

  return (
    <>
      {/* Editor components */}
      <AIElementPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        selectedElement={selectedElement}
        onUpdateElement={handleUpdateElement}
        websiteId="website-id"
        pageId="page-id"
      />
    </>
  );
}
```

## API Requirements

These components expect the following backend API endpoints:

- `POST /api/ai/generate/content`: Generate content for a specific element
- `POST /api/ai/suggestions/:websiteId/:pageId`: Get content suggestions
- `POST /api/ai/modify/content`: Modify existing content

See `aiService.ts` for detailed API integration.

## Customization

The components use Tailwind CSS for styling and can be customized by extending the provided classes. Most components also accept additional `className` props for further customization.
