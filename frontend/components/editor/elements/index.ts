// Export all element components
export { TextElement } from './TextElement';
export { HeroElement } from './HeroElement';
export { FeaturesElement } from './FeaturesElement';
export { GalleryElement } from './GalleryElement';
export { TestimonialsElement } from './TestimonialsElement';
export { CtaElement } from './CtaElement';
export { ImageElement } from './ImageElement';
export { PricingElement } from './PricingElement';
export { default as ContactElement } from './ContactElement';
export { CustomHtmlElement } from './CustomHtmlElement';

// Export element type definitions
export type ElementType = 
  | 'text' 
  | 'hero' 
  | 'features' 
  | 'gallery' 
  | 'testimonials' 
  | 'cta' 
  | 'image' 
  | 'pricing' 
  | 'contact' 
  | 'custom';

// Common interfaces for elements
export interface WebsiteSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  globalStyles?: {
    borderRadius?: string;
    buttonStyle?: string;
  };
}

export interface BaseElementProps<T> {
  content: T;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<T>) => void;
}

// Create a common way to render elements based on their type
export const renderElement = (
  type: ElementType, 
  content: any, 
  settings: WebsiteSettings, 
  isEditing?: boolean, 
  onUpdate?: (updates: any) => void,
  additionalProps?: Record<string, any>
) => {
  try {
    // Import all element components dynamically
    const elements = require('./');
    
    // Map element type to component name
    const componentNameMap: Record<ElementType, string> = {
      text: 'TextElement',
      hero: 'HeroElement',
      features: 'FeaturesElement',
      gallery: 'GalleryElement',
      testimonials: 'TestimonialsElement',
      cta: 'CtaElement',
      image: 'ImageElement',
      pricing: 'PricingElement',
      contact: 'ContactElement',
      custom: 'CustomHtmlElement'
    };
    
    // Get the component name
    const componentName = componentNameMap[type];
    if (!componentName) {
      console.error(`Unknown element type: ${type}`);
      return null;
    }
    
    // Get the component
    const Component = elements[componentName];
    if (!Component) {
      console.error(`Component not found for element type: ${type}`);
      return null;
    }
    
    // Render the component with props
    return React.createElement(Component, {
      content,
      settings,
      isEditing,
      onUpdate,
      ...additionalProps
    });
  } catch (error) {
    console.error(`Error rendering element of type ${type}:`, error);
    return null;
  }
};