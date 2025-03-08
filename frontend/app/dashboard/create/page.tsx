'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
}

interface CreateWebsiteFormData {
  name: string;
  template: string;
  purpose: string;
}

export default function CreateWebsitePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const router = useRouter();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch
  } = useForm<CreateWebsiteFormData>({
    defaultValues: {
      name: '',
      template: '',
      purpose: ''
    }
  });
  
  const templateValue = watch('template');
  
  // Demo templates
  const templates: TemplateOption[] = [
    {
      id: 'portfolio',
      name: 'Portfolio',
      description: 'A clean, modern portfolio to showcase your work and skills.',
      image: '/images/templates/portfolio.jpg',
      tags: ['personal', 'creative', 'showcase'],
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Professional website for small to medium businesses.',
      image: '/images/templates/business.jpg',
      tags: ['business', 'professional', 'services'],
    },
    {
      id: 'landing',
      name: 'Landing Page',
      description: 'High-converting landing page for products or services.',
      image: '/images/templates/landing.jpg',
      tags: ['marketing', 'conversion', 'product'],
    },
    {
      id: 'blog',
      name: 'Blog',
      description: 'Clean and readable blog layout for content creators.',
      image: '/images/templates/blog.jpg',
      tags: ['content', 'writing', 'articles'],
    },
    {
      id: 'ecommerce',
      name: 'E-Commerce',
      description: 'Online store template with product listings and cart functionality.',
      image: '/images/templates/ecommerce.jpg',
      tags: ['shop', 'products', 'retail'],
    },
  ];
  
  const onSubmit = async (data: CreateWebsiteFormData) => {
    setIsLoading(true);
    
    try {
      // API call to create website
      const response = await api.post('/websites', data);
      
      toast.success('Website created successfully!');
      
      // Redirect to editor
      router.push(`/dashboard/editor/${response.data.website.id}`);
    } catch (error: any) {
      console.error('Error creating website:', error);
      toast.error(error.response?.data?.message || 'Failed to create website. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setValue('template', templateId);
    
    // Move to next step
    setStep(2);
  };
  
  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };
  
  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pb-5 border-b border-secondary-200 mb-8">
            <h1 className="text-2xl font-semibold text-secondary-900">Create New Website</h1>
            <p className="mt-2 text-sm text-secondary-500">
              Follow these steps to create your custom website with AI-powered content.
            </p>
          </div>
          
          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-secondary-200 text-secondary-600'
              }`}>
                1
              </div>
              <div className={`h-1 flex-1 mx-2 ${
                step >= 2 ? 'bg-primary-600' : 'bg-secondary-200'
              }`}></div>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-secondary-200 text-secondary-600'
              }`}>
                2
              </div>
              <div className={`h-1 flex-1 mx-2 ${
                step >= 3 ? 'bg-primary-600' : 'bg-secondary-200'
              }`}></div>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                step >= 3 ? 'bg-primary-600 text-white' : 'bg-secondary-200 text-secondary-600'
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-medium text-secondary-500">Choose Template</span>
              <span className="text-xs font-medium text-secondary-500">Add Details</span>
              <span className="text-xs font-medium text-secondary-500">Content Ideas</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Template Selection */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-medium text-secondary-900 mb-4">
                  Choose a template to get started
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                        templateValue === template.id 
                          ? 'border-primary-600 ring-2 ring-primary-200'
                          : 'border-secondary-200 hover:border-primary-300'
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="relative h-40 bg-secondary-100">
                        <Image
                          src={template.image}
                          alt={template.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-secondary-900">{template.name}</h3>
                        <p className="mt-1 text-sm text-secondary-500">{template.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {template.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!templateValue}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 2: Website Details */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-medium text-secondary-900 mb-4">
                  Add details about your website
                </h2>
                
                <div className="bg-white p-6 rounded-lg shadow space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-1">
                      Website Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      {...register('name', { 
                        required: 'Name is required',
                        minLength: {
                          value: 3,
                          message: 'Name must be at least 3 characters',
                        },
                      })}
                      className={`input-field ${errors.name ? 'border-error-500' : ''}`}
                      placeholder="My Awesome Website"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="purpose" className="block text-sm font-medium text-secondary-700 mb-1">
                      Website Purpose (for AI content generation)
                    </label>
                    <textarea
                      id="purpose"
                      {...register('purpose', { 
                        required: 'Purpose is required',
                        minLength: {
                          value: 10,
                          message: 'Please provide more details (at least 10 characters)',
                        },
                      })}
                      rows={4}
                      className={`input-field ${errors.purpose ? 'border-error-500' : ''}`}
                      placeholder="Describe what your website is for, your business/personal goals, target audience, etc."
                    />
                    {errors.purpose && (
                      <p className="mt-1 text-sm text-error-600">{errors.purpose.message}</p>
                    )}
                    <p className="mt-1 text-xs text-secondary-500">
                      The more details you provide, the better our AI can generate relevant content for your website.
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePreviousStep}
                  >
                    Back
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleNextStep}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: Content Ideas */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-medium text-secondary-900 mb-4">
                  Content ideas and AI generation
                </h2>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-secondary-900">AI-Generated Content</h3>
                      <p className="mt-1 text-sm text-secondary-500">
                        Our AI will analyze your template and purpose to generate custom content for your website.
                        This includes headlines, text, and layout suggestions.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t border-secondary-200 pt-6">
                    <h4 className="text-md font-medium text-secondary-900 mb-2">What to expect:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-success-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>AI-written headlines and text suggestions</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-success-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Layout and design recommendations</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-success-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Image suggestions from Unsplash</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-success-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Color scheme based on your branding or template</span>
                      </li>
                    </ul>
                  </div>
                  
                  <p className="mt-6 text-sm text-secondary-600">
                    You'll be able to edit and customize everything in the next step using our drag-and-drop editor.
                  </p>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePreviousStep}
                  >
                    Back
                  </Button>
                  
                  <Button
                    type="submit"
                    isLoading={isLoading}
                  >
                    Create Website
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}