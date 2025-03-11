/**
 * Types for AI content generation components
 */

export interface AIContentPrompt {
  prompt: string;
  type: AIContentType;
  context?: Record<string, any>;
}

export type AIContentType = 
  | 'headline'
  | 'paragraph'
  | 'tagline'
  | 'cta'
  | 'features'
  | 'testimonial'
  | 'product'
  | 'service'
  | 'bio'
  | 'faq'
  | 'seo-title'
  | 'seo-description'
  | 'seo-keywords';

export interface AIContentResult {
  id: string;
  type: AIContentType;
  prompt: string;
  content: string;
  alternativeContents?: string[];
  timestamp: number;
}

export interface AISuggestion {
  id: string;
  type: AIContentType;
  content: string;
  context?: string;
}

export interface AIContentFormProps {
  onSubmit: (prompt: AIContentPrompt) => Promise<void>;
  isLoading: boolean;
  elementType?: string;
  defaultContextData?: Record<string, any>;
}

export interface AIPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export interface AISuggestionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: AISuggestion[];
  isLoading: boolean;
  onSelectSuggestion: (suggestion: AISuggestion) => void;
}

export interface AIContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  alternativeContents?: string[];
  onRequestAlternatives?: () => void;
  isGeneratingAlternatives?: boolean;
  contentType: AIContentType;
}

export interface AIAssistantButtonProps {
  onClick: () => void;
  tooltipText?: string;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
