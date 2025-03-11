'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface AIContentGenerationFormProps {
  /**
   * Callback function when content is generated
   */
  onGenerate: (content: any) => void;
  /**
   * Loading state for the generation process
   */
  isLoading: boolean;
  /**
   * Type of element to generate content for (hero, text, cta, etc.)
   */
  elementType: string;
}

/**
 * Form for generating AI content with customization options
 */
export default function AIContentGenerationForm({
  onGenerate,
  isLoading,
  elementType,
}: AIContentGenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Focus the prompt input when the component mounts
  useEffect(() => {
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, []);
  
  // Options for tone selection
  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'formal', label: 'Formal' },
    { value: 'friendly', label: 'Friendly' },
  ];
  
  // Options for content length
  const lengthOptions = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
  ];
  
  // Generate sample prompts based on element type
  const getSamplePrompts = () => {
    switch (elementType) {
      case 'hero':
        return [
          'Create a hero section for a SaaS product that helps small businesses with accounting',
          'Write a compelling headline for a marketing agency website',
          'Generate a hero section for a personal portfolio website'
        ];
      case 'features':
        return [
          'List 3 key features of our project management software',
          'Create feature descriptions for a mobile banking app',
          'Write about the benefits of our AI-powered analytics tool'
        ];
      case 'text':
        return [
          'Write an about us section for a digital marketing agency',
          'Create a product description for wireless headphones',
          'Write a brief company history for a family restaurant'
        ];
      case 'cta':
        return [
          'Create a call to action for newsletter sign-ups',
          'Write a compelling CTA for a free trial of our software',
          'Generate a CTA for booking a consultation call'
        ];
      case 'testimonials':
        return [
          'Create sample testimonial structures (we\'ll fill in the details)',
          'Generate a format for customer success stories',
          'Design a testimonial section highlighting user experiences'
        ];
      default:
        return [
          'Write content for my website section',
          'Generate text that describes my services',
          'Create compelling copy for this section'
        ];
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    onGenerate({
      prompt,
      tone,
      length,
      elementType
    });
  };
  
  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4" 
      aria-label="AI content generation form"
      aria-describedby="form-intro"
    >
      <p id="form-intro" className="text-sm text-secondary-600 mb-3">
        Describe what content you want to generate for your {elementType}. Be specific about topic,
        audience, and purpose for best results.
      </p>
      
      <div>
        <label htmlFor="content-prompt" className="block text-sm font-medium text-secondary-700 mb-1">
          Describe what you want to generate
          <span className="text-red-500 ml-1" aria-hidden="true">*</span>
        </label>
        <textarea
          ref={promptInputRef}
          id="content-prompt"
          rows={4}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="E.g., Write a headline and subheadline for a website that sells eco-friendly products..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          aria-describedby="prompt-suggestions prompt-instructions"
          aria-required="true"
        />
        <p id="prompt-instructions" className="mt-1 text-xs text-secondary-500">
          Be specific about what you want. Include target audience, tone, and key messages.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-secondary-700 mb-1">
            Tone
          </label>
          <select
            id="tone"
            className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            aria-label="Select content tone"
          >
            {toneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="length" className="block text-sm font-medium text-secondary-700 mb-1">
            Length
          </label>
          <select
            id="length"
            className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            aria-label="Select content length"
          >
            {lengthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <p id="prompt-suggestions" className="text-xs text-secondary-500 mb-2">Try one of these prompts:</p>
        <div className="flex flex-wrap gap-2">
          {getSamplePrompts().map((samplePrompt, index) => (
            <button
              key={index}
              type="button"
              className="text-xs bg-secondary-100 hover:bg-secondary-200 text-secondary-800 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={`Use prompt: ${samplePrompt}`}
              onClick={() => setPrompt(samplePrompt)}
            >
              {samplePrompt.length > 40 ? samplePrompt.substring(0, 40) + '...' : samplePrompt}
            </button>
          ))}
        </div>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        isLoading={isLoading}
        disabled={!prompt.trim() || isLoading}
        aria-live="polite"
        aria-busy={isLoading}
        aria-label={isLoading ? 'Generating content, please wait' : 'Generate content'}
      >
        {isLoading ? 'Generating...' : 'Generate Content'}
      </Button>
    </form>
  );
}
