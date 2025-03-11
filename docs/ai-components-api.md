# AI Components and API Documentation

This document outlines the AI features of the Landing Pad DXP platform, including both frontend components and backend APIs.

## Overview

The AI functionality in Landing Pad DXP helps users create and enhance website content through:

- Content generation for various website elements (headlines, descriptions, features, testimonials)
- Layout suggestions based on website type and user requirements
- Style recommendations including color schemes and typography
- Content enhancement (rewriting, expanding, shortening, proofreading)
- AI-powered design suggestions and improvements

## Environment Requirements

To use the AI features, you need to set up the following environment variables:

```
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4 for premium features
```

## Backend API

The AI backend API is available under the `/api/ai` namespace and provides the following endpoints:

### Content Generation

**Endpoint:** `POST /api/ai/generate/content`

Generates content for a specific element type based on user prompts.

**Request:**
```json
{
  "websiteId": "website123",
  "pageId": "page456",
  "elementType": "hero",
  "prompt": "Create a hero section for a fitness app",
  "tone": "motivational",
  "length": "medium"
}
```

**Response:**
```json
{
  "headline": "Transform Your Body, Transform Your Life",
  "subheadline": "Track workouts, set goals, and achieve your fitness dreams with our all-in-one fitness solution",
  "ctaText": "Start Your Journey"
}
```

### Layout Generation

**Endpoint:** `POST /api/ai/generate/layout`

Generates layout structures for different page types.

**Request:**
```json
{
  "websiteId": "website123",
  "pageId": "page456",
  "prompt": "Create a professional services page layout",
  "pageType": "services"
}
```

**Response:**
```json
{
  "structure": {
    "type": "services",
    "sections": ["header", "hero", "services", "process", "testimonials", "cta", "footer"],
    "layout": "single-column",
    "spacing": "comfortable"
  },
  "elements": [
    {
      "id": "header-1",
      "type": "header",
      "position": "top",
      "settings": {
        "logoPosition": "left",
        "menuItems": ["Services", "About", "Contact", "Blog"],
        "cta": {
          "text": "Get Started",
          "style": "primary"
        }
      }
    },
    ...
  ]
}
```

### Style Generation

**Endpoint:** `POST /api/ai/generate/style`

Generates style recommendations including colors, typography, and spacing.

**Request:**
```json
{
  "websiteId": "website123",
  "prompt": "Create a modern tech style with blue as the primary color",
  "existingColors": {
    "primary": "#3B82F6"
  }
}
```

**Response:**
```json
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#1E293B",
    "accent": "#06B6D4",
    "background": "#F8FAFC",
    "text": "#334155",
    "headings": "#0F172A",
    "lightBackground": "#F1F5F9",
    "borders": "#E2E8F0"
  },
  "typography": {
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "baseSize": 16,
    "scaleRatio": 1.2,
    "lineHeight": 1.6
  },
  "spacing": {
    "base": 16,
    "scale": 1.5
  }
}
```

### Content Modification

**Endpoint:** `POST /api/ai/modify/content`

Modifies existing content with actions like rewrite, expand, shorten, etc.

**Request:**
```json
{
  "content": "We offer great services that can help your business grow.",
  "action": "expand",
  "parameters": {
    "factor": "2x"
  }
}
```

**Response:**
```json
{
  "content": "We offer comprehensive business solutions designed to accelerate your company's growth trajectory. Our strategic services combine industry best practices with innovative approaches, providing you with the tools and expertise needed to expand your market reach, optimize operations, and boost revenue. By partnering with our dedicated team, you'll gain access to customized strategies that address your specific business challenges and opportunities."
}
```

### Suggestions

**Endpoint:** `POST /api/ai/suggestions/:websiteId/:pageId`

Generates multiple suggestions for text, layout, or style.

**Request:**
```json
{
  "type": "text",
  "prompt": "Suggest headline options for a real estate website"
}
```

**Response:**
```json
[
  {
    "id": "1",
    "type": "text",
    "title": "Professional & Trustworthy",
    "content": {
      "heading": "Find Your Dream Home With Confidence",
      "subheading": "Expert agents guiding you through every step of your real estate journey"
    }
  },
  {
    "id": "2",
    "type": "text",
    "title": "Modern & Direct",
    "content": {
      "heading": "Your Perfect Property Is Just A Click Away",
      "subheading": "Discover thousands of listings tailored to your preferences"
    }
  },
  {
    "id": "3",
    "type": "text",
    "title": "Aspirational & Emotional",
    "content": {
      "heading": "Where Memories Begin",
      "subheading": "Turn the key to your future with our premium property selection"
    }
  }
]
```

### Color Scheme Generation

**Endpoint:** `POST /api/ai/generate-color-scheme`

Generates color schemes based on industry, mood, or base color.

**Request:**
```json
{
  "industry": "healthcare",
  "mood": "calming"
}
```

**Response:**
```json
{
  "primary": "#4FBDBA",
  "secondary": "#5F7A61",
  "accent": "#A1E8AF",
  "background": "#F7F7F7",
  "text": "#333333",
  "headings": "#2A5D67",
  "lightBackground": "#EFF7F6",
  "borders": "#D7E4E3"
}
```

### Font Pairing Generation

**Endpoint:** `POST /api/ai/generate-font-pairings`

Generates harmonious font pairings based on style and industry.

**Request:**
```json
{
  "style": "elegant",
  "industry": "luxury"
}
```

**Response:**
```json
[
  {
    "heading": "Playfair Display",
    "body": "Source Sans Pro"
  },
  {
    "heading": "Cormorant Garamond",
    "body": "Montserrat"
  },
  {
    "heading": "Libre Baskerville",
    "body": "Raleway"
  }
]
```

## Frontend Components

### AIContentForm

A form component for generating content based on user inputs.

```jsx
import { AIContentForm } from '@/components/ai';

// Usage
<AIContentForm 
  websiteId="123"
  pageId="456"
  elementType="hero"
  onContentGenerated={(content) => {
    // Handle the generated content
    console.log(content);
  }}
/>
```

### AIStyleGenerator

A component for generating style recommendations.

```jsx
import { AIStyleGenerator } from '@/components/ai';

// Usage
<AIStyleGenerator
  websiteId="123"
  onStyleGenerated={(style) => {
    // Apply the generated style
    console.log(style);
  }}
/>
```

### AISuggestionPanel

A panel that displays AI-generated suggestions for the current project.

```jsx
import { AISuggestionPanel } from '@/components/ai';

// Usage
<AISuggestionPanel
  websiteId="123"
  pageId="456"
  type="text"
  onSuggestionSelected={(suggestion) => {
    // Apply the selected suggestion
    console.log(suggestion);
  }}
/>
```

### AIContentEditor

An editor with AI enhancement capabilities for existing content.

```jsx
import { AIContentEditor } from '@/components/ai';

// Usage
<AIContentEditor
  initialContent="Your content here"
  onContentChanged={(newContent) => {
    // Handle the updated content
    console.log(newContent);
  }}
/>
```

## Best Practices

1. **API Usage Limits**
   - The AI API has rate limits to prevent abuse
   - Free tier: 20 requests per 15 minutes
   - Paid tier: 50 requests per 15 minutes

2. **Context Matters**
   - Provide clear, specific prompts for better results
   - Include relevant website and industry information in your prompts
   - Use element-specific prompts for best results

3. **User Guidance**
   - Always present AI-generated content as suggestions that can be edited
   - Provide a way for users to regenerate if they're not satisfied
   - Allow manual editing of all AI-generated content

4. **Testing and Validation**
   - AI models may occasionally produce unexpected outputs
   - Implement content validation where appropriate
   - Consider implementing content moderation for public-facing websites

## Error Handling

The AI API returns standardized error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

Common error scenarios:
- Rate limiting: 429 Too Many Requests
- Invalid parameters: 400 Bad Request
- AI service issues: 500 Internal Server Error
- Authentication/authorization: 401 Unauthorized or 403 Forbidden