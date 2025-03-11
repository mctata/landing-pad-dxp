# AI Components API Documentation

This document provides comprehensive documentation for the AI Content Generation UI components in the Landing Pad Digital platform.

## Table of Contents
- [Context Provider](#context-provider)
- [Components](#components)
  - [AIContentModal](#aicontentmodal)
  - [AIContentGenerationForm](#aicontentgenerationform)
  - [AISuggestionPanel](#aisuggestionpanel)
  - [AISuggestionCard](#aisuggestioncard)
  - [AIEnhanceToolbar](#aienhancetoolbar)
  - [AIAssistButton](#aiassistbutton)
- [Hooks](#hooks)
  - [useAICache](#useaicache)
  - [useAIErrorHandling](#useaierrorhandling)
  - [useAIAnalytics](#useaianalytics)
- [API Reference](#api-reference)

## Context Provider

The AI functionality is provided through a React Context Provider that manages state, API calls, caching, error handling, and analytics.

```tsx
import { AIProvider, useAI } from '@/lib/ai/ai-context';

// Wrap your application or section with the provider
<AIProvider analyticsConfig={{ enabled: true, trackingEndpoint: '/api/analytics/ai' }}>
  <YourComponent />
</AIProvider>

// Use the AI functionality in your components
function YourComponent() {
  const { 
    generateContent, 
    isGeneratingContent,
    error 
  } = useAI();
  
  // Use the functions as needed
}
```

### Provider Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Child components that will have access to the AI context |
| `analyticsConfig` | `{ enabled: boolean; trackingEndpoint?: string }` | Optional configuration for AI analytics tracking |

### Context Values

| Value | Type | Description |
|-------|------|-------------|
| `isGeneratingContent` | `boolean` | Whether content is currently being generated |
| `isGeneratingSuggestions` | `boolean` | Whether suggestions are currently being generated |
| `latestContentResult` | `any` | The most recent generated content result |
| `latestSuggestions` | `any[]` | The most recent generated suggestions |
| `error` | `{ message: string; isError: boolean; retrying: boolean }` | Current error state |
| `generateContent` | `(params: any) => Promise<any>` | Function to generate content |
| `generateSuggestions` | `(websiteId: string, pageId: string, type: string, prompt: string) => Promise<any>` | Function to generate suggestions |
| `modifyContent` | `(content: string, action: string, parameters?: any) => Promise<any>` | Function to modify existing content |
| `clearResults` | `() => void` | Function to clear the latest results |
| `clearError` | `() => void` | Function to clear the current error |
| `retryLastOperation` | `() => Promise<any>` | Function to retry the last failed operation |
| `metrics` | `{ contentGenerationCount: number; suggestionGenerationCount: number; ... }` | Analytics metrics |

## Components

### AIContentModal

A modal dialog for generating and previewing AI content before applying it.

```tsx
import { AIContentModal } from '@/components/ai';

<AIContentModal
  isOpen={true}
  onClose={() => setIsOpen(false)}
  elementType="text"
  onApplyContent={(content) => handleApplyContent(content)}
  websiteId="website-123"
  pageId="page-456"
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Whether the modal is open |
| `onClose` | `() => void` | Yes | Callback when the modal is closed |
| `elementType` | `string` | Yes | Type of element to generate content for |
| `onApplyContent` | `(content: any) => void` | Yes | Callback when content is applied |
| `websiteId` | `string` | No | Website ID for tracking |
| `pageId` | `string` | No | Page ID for tracking |

### AIContentGenerationForm

Form component for submitting AI content generation requests.

```tsx
import { AIContentGenerationForm } from '@/components/ai';

<AIContentGenerationForm
  onGenerate={handleGenerate}
  isLoading={isLoading}
  elementType="hero"
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onGenerate` | `(formData: any) => void` | Yes | Callback with form data when generating content |
| `isLoading` | `boolean` | Yes | Whether content is currently being generated |
| `elementType` | `string` | Yes | Type of element to generate content for |

### AISuggestionPanel

Panel that displays AI content suggestions based on user criteria.

```tsx
import { AISuggestionPanel } from '@/components/ai';

<AISuggestionPanel
  isOpen={true}
  onClose={() => setIsOpen(false)}
  websiteId="website-123"
  pageId="page-456"
  onApplySuggestion={(suggestion) => handleApplySuggestion(suggestion)}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Whether the panel is open |
| `onClose` | `() => void` | Yes | Callback when the panel is closed |
| `websiteId` | `string` | Yes | Website ID for contextual generation |
| `pageId` | `string` | Yes | Page ID for contextual generation |
| `onApplySuggestion` | `(suggestion: any) => void` | Yes | Callback when a suggestion is applied |

### AISuggestionCard

Card component for displaying an individual AI suggestion.

```tsx
import { AISuggestionCard } from '@/components/ai';

<AISuggestionCard
  suggestion={suggestion}
  onApply={() => handleApply(suggestion)}
  websiteId="website-123"
  pageId="page-456"
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `suggestion` | `{ id: string; type: 'text' \| 'layout' \| 'style'; title: string; content: any }` | Yes | The suggestion data |
| `onApply` | `() => void` | Yes | Callback when the suggestion is applied |
| `websiteId` | `string` | No | Website ID for tracking |
| `pageId` | `string` | No | Page ID for tracking |

### AIEnhanceToolbar

Toolbar for quick AI content enhancement functions.

```tsx
import { AIEnhanceToolbar } from '@/components/ai';

<AIEnhanceToolbar
  content="This is some text that needs enhancement."
  onUpdate={(updatedContent) => setContent(updatedContent)}
  websiteId="website-123"
  pageId="page-456"
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `content` | `string` | Yes | The text content to enhance |
| `onUpdate` | `(updatedContent: string) => void` | Yes | Callback with the enhanced content |
| `className` | `string` | No | Additional CSS classes |
| `websiteId` | `string` | No | Website ID for tracking |
| `pageId` | `string` | No | Page ID for tracking |

### AIAssistButton

Button that triggers AI assistance for specific element types.

```tsx
import { AIAssistButton } from '@/components/ai';

<AIAssistButton
  elementType="text"
  onContentGenerated={(content) => handleContentGenerated(content)}
  label="Generate with AI"
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `elementType` | `string` | Yes | Type of element to generate content for |
| `onContentGenerated` | `(content: any) => void` | Yes | Callback when content is generated |
| `label` | `string` | No | Button label (default: "AI Generate") |
| `variant` | `"primary" \| "secondary" \| "outline"` | No | Button variant (default: "primary") |
| `size` | `"sm" \| "md" \| "lg"` | No | Button size (default: "md") |
| `className` | `string` | No | Additional CSS classes |
| `websiteId` | `string` | No | Website ID for tracking |
| `pageId` | `string` | No | Page ID for tracking |

## Hooks

### useAICache

Custom hook for caching AI-generated content and suggestions to reduce redundant API calls.

```tsx
import { useAICache } from '@/lib/ai/hooks';

function YourComponent() {
  const {
    getCachedContent,
    getCachedSuggestions,
    cacheContent,
    cacheSuggestions,
    clearExpiredCache,
    clearAllCache
  } = useAICache(300000); // 5 minutes expiry
  
  // Use the cache functions as needed
}
```

#### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `getCachedContent` | `(params: any) => { hit: boolean; content: any \| null }` | Get cached content if available |
| `getCachedSuggestions` | `(websiteId: string, pageId: string, type: string, prompt: string) => { hit: boolean; suggestions: any[] \| null }` | Get cached suggestions if available |
| `cacheContent` | `(params: any, content: any) => void` | Cache generated content |
| `cacheSuggestions` | `(websiteId: string, pageId: string, type: string, prompt: string, suggestions: any[]) => void` | Cache generated suggestions |
| `clearExpiredCache` | `() => void` | Clear expired cache entries |
| `clearAllCache` | `() => void` | Clear all cached data |

### useAIErrorHandling

Custom hook for comprehensive error handling in AI operations.

```tsx
import { useAIErrorHandling, AIErrorType } from '@/lib/ai/hooks';

function YourComponent() {
  const {
    currentError,
    errorCounts,
    handleError,
    clearError,
    retryOperation,
    getUserFriendlyErrorMessage
  } = useAIErrorHandling();
  
  // Use the error handling functions as needed
}
```

#### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `currentError` | `AIError \| null` | Current error information |
| `errorCounts` | `Record<AIErrorType, number>` | Count of errors by type for analytics |
| `handleError` | `(error: any) => AIError` | Process and categorize an error |
| `clearError` | `() => void` | Clear the current error |
| `retryOperation` | `<T>(operation: () => Promise<T>, retryConfig?: RetryConfig) => Promise<T>` | Retry operation with exponential backoff |
| `getUserFriendlyErrorMessage` | `(error?: AIError) => string` | Get user-friendly error message |

### useAIAnalytics

Custom hook for tracking AI feature usage and collecting metrics.

```tsx
import { useAIAnalytics, AIEventType } from '@/lib/ai/hooks';

function YourComponent() {
  const {
    trackEvent,
    startTiming,
    stopTiming,
    trackContentGeneration,
    trackSuggestionGeneration,
    trackContentModification,
    trackSuggestionAccepted,
    trackSuggestionRejected,
    flushEvents,
    metrics
  } = useAIAnalytics({
    enabled: true,
    trackingEndpoint: '/api/analytics/ai',
    batchInterval: 30000,
    batchSize: 10
  });
  
  // Use the analytics functions as needed
}
```

#### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `trackEvent` | `(eventData: Omit<AIEventData, 'timestamp'>) => void` | Track a custom AI event |
| `startTiming` | `(operationId: string) => void` | Start timing an operation |
| `stopTiming` | `(operationId: string) => number` | Stop timing and get duration |
| `trackContentGeneration` | `(params: any, duration: number, success: boolean, errorType?: AIErrorType) => void` | Track content generation event |
| `trackSuggestionGeneration` | `(websiteId: string, pageId: string, type: string, prompt: string, duration: number, count: number, success: boolean, errorType?: AIErrorType) => void` | Track suggestion generation event |
| `trackContentModification` | `(content: string, action: string, parameters: any, duration: number, success: boolean, errorType?: AIErrorType) => void` | Track content modification event |
| `trackSuggestionAccepted` | `(suggestionId: string, suggestionType: string, websiteId?: string, pageId?: string) => void` | Track suggestion acceptance |
| `trackSuggestionRejected` | `(suggestionId: string, suggestionType: string, websiteId?: string, pageId?: string) => void` | Track suggestion rejection |
| `flushEvents` | `() => Promise<boolean>` | Send events to tracking endpoint |
| `metrics` | `{ contentGenerationCount: number; suggestionGenerationCount: number; ... }` | Analytics metrics |

## API Reference

The AI components interact with the following backend API endpoints.

### Content Generation

**Endpoint**: `POST /api/ai/generate/content`

**Request Body**:
```json
{
  "websiteId": "string",
  "pageId": "string",
  "elementType": "string",
  "prompt": "string",
  "tone": "string",
  "length": "string"
}
```

**Response**:
```json
{
  // Response structure varies by elementType
  // Example for "text":
  "heading": "string",
  "subheading": "string",
  "body": "string"
}
```

### Suggestions

**Endpoint**: `POST /api/ai/suggestions/:websiteId/:pageId`

**Request Body**:
```json
{
  "type": "text|layout|style",
  "prompt": "string"
}
```

**Response**:
```json
[
  {
    "id": "string",
    "type": "text|layout|style",
    "title": "string",
    "content": {
      // Content structure varies by type
    }
  }
]
```

### Content Modification

**Endpoint**: `POST /api/ai/modify/content`

**Request Body**:
```json
{
  "content": "string",
  "action": "string",
  "parameters": {
    // Optional parameters specific to the action
  }
}
```

**Response**:
```json
{
  "content": "string"
}
```

## Error Handling

All components that interact with the AI API include robust error handling. Errors are categorized into the following types:

- `NETWORK`: Network connection issues
- `API_UNAVAILABLE`: AI service is temporarily unavailable
- `INVALID_REQUEST`: The request parameters were invalid
- `CONTENT_POLICY`: The request violated content policy
- `RATE_LIMIT`: Rate limit has been exceeded
- `RESOURCE_EXHAUSTED`: Usage quota has been exhausted
- `UNKNOWN`: Other unexpected errors

Components will display appropriate error messages and provide retry functionality when applicable.

## Accessibility

All AI components adhere to WCAG 2.1 AA standards and include the following accessibility features:

- Proper ARIA roles, states, and properties
- Keyboard navigation support
- Focus management in modals and panels
- Screen reader announcements for dynamic content
- Sufficient color contrast
- Loading and error state indicators

## Performance Considerations

To ensure optimal performance:

1. The AI context uses caching to reduce redundant API calls
2. Batch processing for analytics events
3. Throttling and debouncing are applied to user input
4. Optimistic UI updates are implemented where appropriate
5. Requests are retried with exponential backoff when failing

## Best Practices

When using these components, follow these best practices:

1. Provide clear and specific prompts to get better results
2. Set appropriate `websiteId` and `pageId` for contextual generation
3. Implement appropriate error handling and fallbacks
4. Use the analytics data to improve the AI features over time
5. Test with real users to gather feedback on AI-generated content quality
