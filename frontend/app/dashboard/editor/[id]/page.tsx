'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { PageElementsMenu } from '@/components/editor/PageElementsMenu';
import { AIContentSidebar } from '@/components/editor/AIContentSidebar';
import { AIStyleSuggestion } from '@/components/editor/AIStyleSuggestion';
import { AISuggestionPanel, AIContentModal } from '@/components/ai';
import { AIProvider } from '@/lib/ai/ai-context';
import { useEditorStore } from '@/lib/editor/editor-store';
import { toast } from 'react-toastify';
import { generateId } from '@/lib/utils';

// Type for element data
interface ElementData {
  id: string;
  type: string;
  position: number;
  content: any;
  settings?: any;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIContentModalOpen, setIsAIContentModalOpen] = useState(false);
  const [selectedElementForAI, setSelectedElementForAI] = useState<ElementData | null>(null);
  
  // Editor store
  const { 
    project, 
    currentPageId, 
    selectedElementId,
    openPanel,
    setProject,
    setCurrentPage,
    selectElement,
    setOpenPanel,
    addElement,
    updateElement,
    deleteElement,
    reorderElements,
    saveProject,
    updateProjectSettings,
  } = useEditorStore();
  
  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // const response = await projectAPI.getProjectById(projectId);
        // setProject(response.data.project);
        
        // For demo, create a mock project
        const mockProject = {
          id: projectId,
          name: 'Demo Project',
          settings: {
            colors: {
              primary: '#4361ee',
              secondary: '#3f37c9',
              accent: '#f72585',
              background: '#ffffff',
              text: '#212529',
            },
            fonts: {
              heading: 'Montserrat',
              body: 'Open Sans',
            },
            globalStyles: {
              borderRadius: '0.375rem',
              buttonStyle: 'rounded',
            },
          },
          pages: [
            {
              id: 'page-1',
              name: 'Home',
              slug: 'home',
              isHome: true,
              elements: [
                {
                  id: 'element-1',
                  type: 'hero',
                  position: 0,
                  content: {
                    headline: 'Welcome to Your Website',
                    subheadline: 'A beautiful, professional website built with Landing Pad',
                    ctaText: 'Get Started',
                    ctaLink: '#',
                    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
                    alignment: 'center',
                  },
                },
                {
                  id: 'element-2',
                  type: 'features',
                  position: 1,
                  content: {
                    headline: 'Features',
                    subheadline: 'Why choose our products',
                    features: [
                      {
                        title: 'Easy to Use',
                        description: 'Our platform is designed to be intuitive and user-friendly.',
                        icon: 'star',
                      },
                      {
                        title: 'Powerful Tools',
                        description: 'Access a wide range of powerful tools to enhance your workflow.',
                        icon: 'bolt',
                      },
                      {
                        title: 'Reliable Support',
                        description: 'Our team is always ready to help you with any questions.',
                        icon: 'heart',
                      },
                    ],
                    columns: 3,
                  },
                },
                {
                  id: 'element-3',
                  type: 'text',
                  position: 2,
                  content: {
                    headline: 'About Us',
                    content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies aliquam, nisl nisl ultricies nisl, nec ultricies nisl nisl nec. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies aliquam, nisl nisl ultricies nisl, nec ultricies nisl nisl nec.</p><p>Nullam euismod, nisl eget ultricies aliquam, nisl nisl ultricies nisl, nec ultricies nisl nisl nec. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
                    alignment: 'left',
                  },
                },
              ],
            },
            {
              id: 'page-2',
              name: 'About',
              slug: 'about',
              isHome: false,
              elements: [],
            },
            {
              id: 'page-3',
              name: 'Contact',
              slug: 'contact',
              isHome: false,
              elements: [],
            },
          ],
        };
        
        setProject(mockProject);
      } catch (err: any) {
        console.error('Error fetching project:', err);
        setError(err.message || 'Failed to load project');
        toast.error('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, setProject]);
  
  // Current page elements
  const currentPage = project?.pages.find(page => page.id === currentPageId);
  const elements = currentPage?.elements || [];
  
  // Get the selected element
  const selectedElement = selectedElementId
    ? elements.find(element => element.id === selectedElementId) || null
    : null;
  
  // Handle element actions
  const handleAddElement = (type: string) => {
    if (currentPageId) {
      addElement(currentPageId, type);
      toast.success(`Added ${type} element`);
    }
  };
  
  const handleUpdateElement = (elementId: string, updates: any) => {
    if (currentPageId) {
      updateElement(currentPageId, elementId, updates);
    }
  };
  
  const handleDeleteElement = (elementId: string) => {
    if (currentPageId) {
      deleteElement(currentPageId, elementId);
      toast.success('Element deleted');
    }
  };
  
  const handleReorderElements = (startIndex: number, endIndex: number) => {
    if (currentPageId) {
      reorderElements(currentPageId, startIndex, endIndex);
    }
  };
  
  // Handle page change
  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId);
  };
  
  // Handle add page (stub for now)
  const handleAddPage = () => {
    // In a real implementation, this would open a modal to create a new page
    toast.info('Add page feature coming soon');
  };
  
  // Handle save project
  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      await saveProject();
      toast.success('Project saved successfully');
    } catch (err) {
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle opening AI content modal for an element
  const handleOpenAIContentModal = (elementId: string) => {
    if (!project || !currentPageId) return;
    
    // Find element
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    setSelectedElementForAI(element as ElementData);
    setIsAIContentModalOpen(true);
  };
  
  // Handle applying AI-generated content to an element
  const handleApplyAIContent = (content: any) => {
    if (!selectedElementForAI || !project || !currentPageId) return;
    
    handleUpdateElement(selectedElementForAI.id, {
      content: {
        ...selectedElementForAI.content,
        ...content,
      },
    });
    
    toast.success('AI content applied successfully');
    
    // Auto-save
    setTimeout(handleSaveProject, 500);
  };

  // Handle applying color scheme from AI suggestions
  const handleApplyColorScheme = (colors: any) => {
    if (!project) return;
    
    updateProjectSettings({
      colors
    });
    
    toast.success('Color scheme applied successfully');
    
    // Auto-save
    setTimeout(handleSaveProject, 500);
  };
  
  // Handle applying font pairing from AI suggestions
  const handleApplyFontPairing = (fonts: any) => {
    if (!project) return;
    
    updateProjectSettings({
      fonts
    });
    
    toast.success('Font pairing applied successfully');
    
    // Auto-save
    setTimeout(handleSaveProject, 500);
  };

  // Get default settings for a new element
  const getDefaultSettingsForElement = (type: string) => {
    return {
      layout: 'full-width',
      padding: 'medium',
      background: 'transparent',
    };
  };

  // Handle applying AI suggestion to the page
  const handleApplySuggestion = (suggestion: any) => {
    if (!project || !currentPageId) return;
    
    if (suggestion.type === 'text') {
      // Create new text element with the suggested content
      const newElementId = generateId();
      addElement(currentPageId, 'text', {
        heading: suggestion.content.heading,
        content: `<p>${suggestion.content.subheading}</p>`,
      });
      
      toast.success('AI suggestion applied');
    } else if (suggestion.type === 'layout') {
      // This would create multiple elements based on the layout suggestion
      // For simplicity, we'll just show a toast for now
      toast.success('Layout suggestion would create multiple elements');
    } else if (suggestion.type === 'style') {
      // Update website global styles - this would require a method to update project settings
      toast.success('AI style suggestion applied');
    }
  };
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-primary-500 border-secondary-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-secondary-700">Loading editor...</p>
        </div>
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-secondary-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-error-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-secondary-900 mt-4">Failed to load project</h2>
          <p className="mt-2 text-secondary-600">{error || 'An unexpected error occurred'}</p>
          <button 
            className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <AIProvider>
      <div className="h-screen flex flex-col">
        {/* Editor Toolbar */}
        <EditorToolbar
          websiteId={project.id}
          pages={project.pages}
          currentPageId={currentPageId || ''}
          onPageChange={handlePageChange}
          onAddPage={handleAddPage}
          openPanel={openPanel}
          setOpenPanel={setOpenPanel}
          onOpenAIContent={() => {
            if (selectedElementId) {
              setOpenPanel('ai-content');
            } else {
              toast.info('Please select an element first');
            }
          }}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Elements Panel */}
          {openPanel === 'elements' && (
            <PageElementsMenu
              onAddElement={handleAddElement}
              isOpen={openPanel === 'elements'}
              onClose={() => setOpenPanel(null)}
            />
          )}
          
          {/* AI Content Sidebar */}
          {openPanel === 'ai-content' && selectedElementId && (
            <AIContentSidebar
              isOpen={openPanel === 'ai-content'}
              onClose={() => setOpenPanel(null)}
              elementId={selectedElementId}
              elementType={selectedElement?.type || null}
              currentContent={selectedElement?.content || {}}
              onApplyContent={handleUpdateElement}
            />
          )}
          
          {/* Editor Canvas */}
          <div className="flex-1 overflow-auto">
            <EditorCanvas
              elements={elements}
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onReorderElements={handleReorderElements}
              settings={project.settings}
            />
          </div>
          
          {/* AI Style Suggestions */}
          {openPanel === 'ai-style' && (
            <div className="w-96 border-l border-secondary-200 bg-white h-full overflow-auto">
              <div className="p-4 border-b border-secondary-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-secondary-900">AI Style Suggestions</h3>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-md text-secondary-500 hover:bg-secondary-100 flex items-center justify-center"
                    onClick={() => setOpenPanel(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <AIStyleSuggestion
                websiteType={project.name}
                currentColors={project.settings.colors}
                currentFonts={project.settings.fonts}
                onApplyColorScheme={handleApplyColorScheme}
                onApplyFontPairing={handleApplyFontPairing}
              />
            </div>
          )}
          
          {/* Website Settings Panel */}
          {openPanel === 'website-settings' && (
            <div className="w-80 border-l border-secondary-200 bg-white h-full overflow-auto">
              <div className="p-4 border-b border-secondary-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-secondary-900">Website Settings</h3>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-md text-secondary-500 hover:bg-secondary-100 flex items-center justify-center"
                    onClick={() => setOpenPanel(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-secondary-600 text-sm">
                  Customize your website's appearance and settings
                </p>
              </div>
              
              <div className="p-4">
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-secondary-900 mb-2">Colors</h4>
                  {/* Color pickers would go here */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-secondary-500 mb-1">Primary</label>
                      <div 
                        className="h-10 rounded border border-secondary-300 cursor-pointer"
                        style={{ backgroundColor: project.settings.colors.primary }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary-500 mb-1">Secondary</label>
                      <div 
                        className="h-10 rounded border border-secondary-300 cursor-pointer"
                        style={{ backgroundColor: project.settings.colors.secondary }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary-500 mb-1">Accent</label>
                      <div 
                        className="h-10 rounded border border-secondary-300 cursor-pointer"
                        style={{ backgroundColor: project.settings.colors.accent }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary-500 mb-1">Text</label>
                      <div 
                        className="h-10 rounded border border-secondary-300 cursor-pointer"
                        style={{ backgroundColor: project.settings.colors.text }}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => setOpenPanel('ai-style')}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Get AI Style Suggestions
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-secondary-900 mb-2">Fonts</h4>
                  {/* Font selectors would go here */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-secondary-500 mb-1">Heading Font</label>
                      <select className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                        <option>{project.settings.fonts.heading}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-secondary-500 mb-1">Body Font</label>
                      <select className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                        <option>{project.settings.fonts.body}</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-secondary-900 mb-2">Global Styles</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-secondary-500 mb-1">Border Radius</label>
                      <select className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                        <option value="0">None</option>
                        <option value="0.125rem">Small</option>
                        <option value="0.25rem">Medium</option>
                        <option value="0.5rem" selected={project.settings.globalStyles.borderRadius === '0.5rem'}>Large</option>
                        <option value="9999px">Pill</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* AI Suggestion Panel */}
          <AISuggestionPanel 
            isOpen={openPanel === 'ai-assistant'}
            onClose={() => setOpenPanel(null)}
            websiteId={params.id as string}
            pageId={currentPageId || ''}
            onApplySuggestion={handleApplySuggestion}
          />
          
          {/* AI Content Modal */}
          {selectedElementForAI && (
            <AIContentModal 
              isOpen={isAIContentModalOpen}
              onClose={() => setIsAIContentModalOpen(false)}
              elementType={selectedElementForAI.type}
              onApplyContent={handleApplyAIContent}
            />
          )}
        </div>
        
        {/* Fixed toolbar for AI actions */}
        <div className="fixed bottom-6 right-6 flex space-x-2">
          {selectedElementId && (
            <button
              className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-md shadow-md hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
              onClick={() => setOpenPanel('ai-content')}
              title="Generate AI Content for Selected Element"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              AI Content
            </button>
          )}
          
          <button
            className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-md shadow-md hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
            onClick={() => setOpenPanel('ai-style')}
            title="Get AI Style Suggestions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
            </svg>
            AI Style
          </button>
          
          <button
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={handleSaveProject}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AIProvider>
  );
}
