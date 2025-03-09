'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { templateAPI, projectAPI } from '@/lib/api';
import { useTemplate } from '@/lib/template/template-context';
import { toast } from 'react-toastify';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      
      try {
        // Fetch templates from API
        // const response = await templateAPI.getTemplates();
        // setTemplates(response.data.templates);
        
        // Mock data for demo
        setTemplates([
          {
            id: 'template-1',
            name: 'Portfolio',
            description: 'Perfect for showcasing your work and skills',
            category: 'portfolio',
            thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
          },
          {
            id: 'template-2',
            name: 'Business',
            description: 'Professional website for your business',
            category: 'business',
            thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
          },
          {
            id: 'template-3',
            name: 'Blog',
            description: 'Share your thoughts and ideas with the world',
            category: 'blog',
            thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
          },
          {
            id: 'template-4',
            name: 'Landing Page',
            description: 'Promote your product or service',
            category: 'landing-page',
            thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
          },
          {
            id: 'template-5',
            name: 'Personal',
            description: 'A personal website for your online presence',
            category: 'personal',
            thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
          },
        ]);
        
        // Get unique categories
        const categories = Array.from(new Set(templates.map(t => t.category)));
        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category)));
  
  // Filter templates by category
  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;
  
  // Handle project name change
  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };
  
  // Handle project description change
  const handleProjectDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProjectDescription(e.target.value);
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };
  
  // Navigate to next step
  const handleNextStep = () => {
    if (step === 1 && !projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    
    if (step === 2 && !selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    
    setStep(step + 1);
  };
  
  // Navigate to previous step
  const handlePreviousStep = () => {
    setStep(step - 1);
  };
  
  // Create project
  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedTemplate) {
      toast.error('Please enter a project name and select a template');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create project via API
      // const response = await projectAPI.createProject({
      //   name: projectName,
      //   description: projectDescription,
      //   templateId: selectedTemplate,
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Project created successfully');
      
      // Navigate to editor page
      router.push(`/dashboard/editor/project-new`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };
  
  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="min-h-screen bg-secondary-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900">Create New Website</h1>
          <p className="mt-2 text-secondary-600">
            Follow the steps below to create your new website
          </p>
        </div>
        
        {/* Progress Indicator */}
        <div className="mt-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-secondary-300'}`}>
                <span className="text-white font-medium">1</span>
              </div>
              <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary-600' : 'bg-secondary-300'}`}></div>
              <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-secondary-300'}`}>
                <span className="text-white font-medium">2</span>
              </div>
              <div className={`h-1 w-16 ${step >= 3 ? 'bg-primary-600' : 'bg-secondary-300'}`}></div>
              <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 3 ? 'bg-primary-600' : 'bg-secondary-300'}`}>
                <span className="text-white font-medium">3</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center mt-2">
            <div className="flex items-center text-sm">
              <div className="text-center w-24">
                <span className={step >= 1 ? 'text-primary-700 font-medium' : 'text-secondary-500'}>
                  Details
                </span>
              </div>
              <div className="w-16"></div>
              <div className="text-center w-24">
                <span className={step >= 2 ? 'text-primary-700 font-medium' : 'text-secondary-500'}>
                  Template
                </span>
              </div>
              <div className="w-16"></div>
              <div className="text-center w-24">
                <span className={step >= 3 ? 'text-primary-700 font-medium' : 'text-secondary-500'}>
                  Summary
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 1: Project Details */}
        {step === 1 && (
          <div className="mt-8 bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-medium text-secondary-900">Project Details</h2>
            <p className="mt-1 text-sm text-secondary-500">
              Enter a name and description for your website
            </p>
            
            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-secondary-700">
                  Website Name <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={projectName}
                  onChange={handleProjectNameChange}
                  className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="My Website"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium text-secondary-700">
                  Description <span className="text-secondary-500">(optional)</span>
                </label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  value={projectDescription}
                  onChange={handleProjectDescriptionChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="A brief description of your website"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                onClick={handleNextStep}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Template Selection */}
        {step === 2 && (
          <div className="mt-8 bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-medium text-secondary-900">Choose a Template</h2>
            <p className="mt-1 text-sm text-secondary-500">
              Select a template for your website
            </p>
            
            {/* Category Filter */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  selectedCategory === null
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </button>
              
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    selectedCategory === category
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {formatCategoryName(category)}
                </button>
              ))}
            </div>
            
            {/* Templates Grid */}
            {isLoading ? (
              <div className="mt-8 flex justify-center">
                <div className="w-12 h-12 border-4 border-t-primary-500 border-secondary-200 rounded-full animate-spin"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="mt-8 text-center py-12 bg-secondary-50 rounded-lg">
                <p className="text-secondary-500">No templates found</p>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg overflow-hidden ${
                      selectedTemplate === template.id
                        ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50'
                        : 'border-secondary-200 hover:border-primary-300'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="relative h-48 bg-secondary-100">
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {selectedTemplate === template.id && (
                        <div className="absolute top-2 right-2 h-6 w-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-secondary-900">{template.name}</h3>
                      <p className="mt-1 text-sm text-secondary-500">{template.description}</p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                          {formatCategoryName(template.category)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                className="px-4 py-2 border border-secondary-300 text-base font-medium rounded-md shadow-sm text-secondary-700 bg-white hover:bg-secondary-50"
                onClick={handlePreviousStep}
              >
                Previous
              </button>
              
              <button
                type="button"
                className="px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleNextStep}
                disabled={!selectedTemplate}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="mt-8 bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-medium text-secondary-900">Summary</h2>
            <p className="mt-1 text-sm text-secondary-500">
              Review your website details before creating
            </p>
            
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-secondary-500">Website Name</h3>
                <p className="mt-1 text-base text-secondary-900">{projectName}</p>
              </div>
              
              {projectDescription && (
                <div>
                  <h3 className="text-sm font-medium text-secondary-500">Description</h3>
                  <p className="mt-1 text-base text-secondary-900">{projectDescription}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-secondary-500">Template</h3>
                <p className="mt-1 text-base text-secondary-900">
                  {selectedTemplate && templates.find(t => t.id === selectedTemplate)?.name}
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                className="px-4 py-2 border border-secondary-300 text-base font-medium rounded-md shadow-sm text-secondary-700 bg-white hover:bg-secondary-50"
                onClick={handlePreviousStep}
              >
                Previous
              </button>
              
              <button
                type="button"
                className="px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateProject}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Website'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
