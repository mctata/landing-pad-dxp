import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Element interfaces
export interface ElementData {
  id: string;
  type: string;
  content: any;
  settings?: any;
  position: number;
}

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

export interface PageData {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
  elements: ElementData[];
}

export interface ProjectData {
  id: string;
  name: string;
  settings: WebsiteSettings;
  pages: PageData[];
}

// Editor store state interface
interface EditorState {
  // Project data
  project: ProjectData | null;
  currentPageId: string | null;
  selectedElementId: string | null;
  openPanel: string | null;
  undoStack: ProjectData[];
  redoStack: ProjectData[];
  isSaving: boolean;
  
  // Actions
  setProject: (project: ProjectData) => void;
  setCurrentPage: (pageId: string) => void;
  selectElement: (elementId: string | null) => void;
  setOpenPanel: (panel: string | null) => void;
  
  // Project actions
  updateProjectSettings: (settings: Partial<WebsiteSettings>) => void;
  
  // Page actions
  addPage: (name: string) => void;
  updatePage: (pageId: string, updates: Partial<Omit<PageData, 'id' | 'elements'>>) => void;
  deletePage: (pageId: string) => void;
  setHomePage: (pageId: string) => void;
  
  // Element actions
  addElement: (pageId: string, type: string, position?: number) => void;
  updateElement: (pageId: string, elementId: string, updates: Partial<Omit<ElementData, 'id'>>) => void;
  deleteElement: (pageId: string, elementId: string) => void;
  reorderElements: (pageId: string, startIndex: number, endIndex: number) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  
  // Project saving
  saveProject: () => Promise<void>;
}

// Initial state for website settings
const defaultSettings: WebsiteSettings = {
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
};

// Create the store
export const useEditorStore = create<EditorState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        project: null,
        currentPageId: null,
        selectedElementId: null,
        openPanel: null,
        undoStack: [],
        redoStack: [],
        isSaving: false,
        
        // Setters
        setProject: (project) => {
          set({ 
            project,
            currentPageId: project.pages.length > 0 ? project.pages[0].id : null,
            selectedElementId: null,
            undoStack: [],
            redoStack: [],
          });
        },
        
        setCurrentPage: (pageId) => {
          set({ 
            currentPageId: pageId,
            selectedElementId: null,
          });
        },
        
        selectElement: (elementId) => {
          set({ selectedElementId: elementId });
        },
        
        setOpenPanel: (panel) => {
          set({ openPanel: panel });
        },
        
        // Project actions
        updateProjectSettings: (settings) => {
          const { project } = get();
          if (!project) return;
          
          // Save current state to history
          get().saveHistory();
          
          set({
            project: {
              ...project,
              settings: {
                ...project.settings,
                ...settings,
                colors: {
                  ...project.settings.colors,
                  ...settings.colors,
                },
                fonts: {
                  ...project.settings.fonts,
                  ...settings.fonts,
                },
                globalStyles: {
                  ...project.settings.globalStyles,
                  ...settings.globalStyles,
                },
              },
            },
          });
        },
        
        // Page actions
        addPage: (name) => {
          const { project } = get();
          if (!project) return;
          
          // Save current state to history
          get().saveHistory();
          
          const newPageId = uuidv4();
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          
          const newPage: PageData = {
            id: newPageId,
            name,
            slug,
            isHome: project.pages.length === 0, // First page is home
            elements: [],
          };
          
          set({
            project: {
              ...project,
              pages: [...project.pages, newPage],
            },
            currentPageId: newPageId,
          });
        },
        
        updatePage: (pageId, updates) => {
          const { project } = get();
          if (!project) return;
          
          // Save current state to history
          get().saveHistory();
          
          set({
            project: {
              ...project,
              pages: project.pages.map((page) =>
                page.id === pageId
                  ? { ...page, ...updates }
                  : page
              ),
            },
          });
        },
        
        deletePage: (pageId) => {
          const { project, currentPageId } = get();
          if (!project) return;
          
          // Can't delete the only page
          if (project.pages.length <= 1) return;
          
          // Can't delete home page
          const pageToDelete = project.pages.find(p => p.id === pageId);
          if (pageToDelete?.isHome) return;
          
          // Save current state to history
          get().saveHistory();
          
          const newPages = project.pages.filter((page) => page.id !== pageId);
          
          // If deleting current page, switch to first page
          const newCurrentPageId = 
            currentPageId === pageId ? newPages[0].id : currentPageId;
          
          set({
            project: {
              ...project,
              pages: newPages,
            },
            currentPageId: newCurrentPageId,
            selectedElementId: null,
          });
        },
        
        setHomePage: (pageId) => {
          const { project } = get();
          if (!project) return;
          
          // Save current state to history
          get().saveHistory();
          
          set({
            project: {
              ...project,
              pages: project.pages.map((page) => ({
                ...page,
                isHome: page.id === pageId,
              })),
            },
          });
        },
        
        // Element actions
        addElement: (pageId, type, position) => {
          const { project } = get();
          if (!project) return;
          
          // Find the page
          const pageIndex = project.pages.findIndex(p => p.id === pageId);
          if (pageIndex === -1) return;
          
          // Calculate the position
          const page = project.pages[pageIndex];
          const lastPosition = page.elements.length > 0
            ? Math.max(...page.elements.map(e => e.position))
            : -1;
          const newPosition = position !== undefined ? position : lastPosition + 1;
          
          // Save current state to history
          get().saveHistory();
          
          // Create the new element with default content based on type
          const newElement: ElementData = {
            id: uuidv4(),
            type,
            position: newPosition,
            content: getDefaultContentForType(type),
          };
          
          // Update the page with the new element
          const updatedPages = [...project.pages];
          updatedPages[pageIndex] = {
            ...page,
            elements: [...page.elements, newElement],
          };
          
          set({
            project: {
              ...project,
              pages: updatedPages,
            },
            selectedElementId: newElement.id,
          });
        },
        
        updateElement: (pageId, elementId, updates) => {
          const { project } = get();
          if (!project) return;
          
          // Find the page
          const pageIndex = project.pages.findIndex(p => p.id === pageId);
          if (pageIndex === -1) return;
          
          // Find the element
          const page = project.pages[pageIndex];
          const elementIndex = page.elements.findIndex(e => e.id === elementId);
          if (elementIndex === -1) return;
          
          // Save current state to history
          get().saveHistory();
          
          // Update the element
          const updatedElements = [...page.elements];
          updatedElements[elementIndex] = {
            ...updatedElements[elementIndex],
            ...updates,
          };
          
          // Update the page with the updated elements
          const updatedPages = [...project.pages];
          updatedPages[pageIndex] = {
            ...page,
            elements: updatedElements,
          };
          
          set({
            project: {
              ...project,
              pages: updatedPages,
            },
          });
        },
        
        deleteElement: (pageId, elementId) => {
          const { project, selectedElementId } = get();
          if (!project) return;
          
          // Find the page
          const pageIndex = project.pages.findIndex(p => p.id === pageId);
          if (pageIndex === -1) return;
          
          // Find the element
          const page = project.pages[pageIndex];
          const elementIndex = page.elements.findIndex(e => e.id === elementId);
          if (elementIndex === -1) return;
          
          // Save current state to history
          get().saveHistory();
          
          // Remove the element
          const updatedElements = page.elements.filter(e => e.id !== elementId);
          
          // Update the page with the updated elements
          const updatedPages = [...project.pages];
          updatedPages[pageIndex] = {
            ...page,
            elements: updatedElements,
          };
          
          set({
            project: {
              ...project,
              pages: updatedPages,
            },
            selectedElementId: selectedElementId === elementId ? null : selectedElementId,
          });
        },
        
        reorderElements: (pageId, startIndex, endIndex) => {
          const { project } = get();
          if (!project) return;
          
          // Find the page
          const pageIndex = project.pages.findIndex(p => p.id === pageId);
          if (pageIndex === -1) return;
          
          // Save current state to history
          get().saveHistory();
          
          // Get the page and its elements
          const page = project.pages[pageIndex];
          const sortedElements = [...page.elements].sort((a, b) => a.position - b.position);
          
          // Reorder the elements
          const [removed] = sortedElements.splice(startIndex, 1);
          sortedElements.splice(endIndex, 0, removed);
          
          // Update positions
          const updatedElements = sortedElements.map((element, index) => ({
            ...element,
            position: index,
          }));
          
          // Update the page with the updated elements
          const updatedPages = [...project.pages];
          updatedPages[pageIndex] = {
            ...page,
            elements: updatedElements,
          };
          
          set({
            project: {
              ...project,
              pages: updatedPages,
            },
          });
        },
        
        // History actions
        saveHistory: () => {
          const { project, undoStack } = get();
          if (!project) return;
          
          set({
            undoStack: [...undoStack, { ...project }],
            redoStack: [],
          });
        },
        
        undo: () => {
          const { undoStack, redoStack, project } = get();
          if (undoStack.length === 0 || !project) return;
          
          const newUndoStack = [...undoStack];
          const previousState = newUndoStack.pop()!;
          
          set({
            project: previousState,
            undoStack: newUndoStack,
            redoStack: [project, ...redoStack],
          });
        },
        
        redo: () => {
          const { redoStack, undoStack, project } = get();
          if (redoStack.length === 0 || !project) return;
          
          const newRedoStack = [...redoStack];
          const nextState = newRedoStack.shift()!;
          
          set({
            project: nextState,
            redoStack: newRedoStack,
            undoStack: [...undoStack, project],
          });
        },
        
        // Project saving
        saveProject: async () => {
          const { project } = get();
          if (!project) return;
          
          set({ isSaving: true });
          
          try {
            // TODO: Implement API call to save project
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            
            console.log('Project saved:', project);
          } catch (error) {
            console.error('Error saving project:', error);
            throw error;
          } finally {
            set({ isSaving: false });
          }
        },
      }),
      {
        name: 'editor-storage',
      }
    )
  )
);

// Helper function to get default content for element types
function getDefaultContentForType(type: string): any {
  switch (type) {
    case 'hero':
      return {
        headline: 'Welcome to Your Website',
        subheadline: 'A beautiful, professional website built with Landing Pad',
        ctaText: 'Get Started',
        ctaLink: '#',
        image: '/images/placeholders/hero-image.jpg',
        alignment: 'center',
      };
      
    case 'features':
      return {
        headline: 'Features',
        subheadline: 'Why choose our products',
        features: [
          {
            title: 'Feature 1',
            description: 'Description of feature 1',
            icon: 'star',
          },
          {
            title: 'Feature 2',
            description: 'Description of feature 2',
            icon: 'heart',
          },
          {
            title: 'Feature 3',
            description: 'Description of feature 3',
            icon: 'bolt',
          },
        ],
        columns: 3,
      };
      
    case 'text':
      return {
        headline: 'Section Title',
        content: '<p>This is a text section. You can edit this content to add your own text.</p>',
        alignment: 'left',
      };
      
    case 'image':
      return {
        image: '/images/placeholders/image.jpg',
        caption: 'Image caption',
        altText: 'Description of the image',
        size: 'large',
      };
      
    case 'gallery':
      return {
        headline: 'Gallery',
        images: [
          {
            url: '/images/placeholders/gallery-1.jpg',
            caption: 'Image 1',
            altText: 'Description of image 1',
          },
          {
            url: '/images/placeholders/gallery-2.jpg',
            caption: 'Image 2',
            altText: 'Description of image 2',
          },
          {
            url: '/images/placeholders/gallery-3.jpg',
            caption: 'Image 3',
            altText: 'Description of image 3',
          },
        ],
        layout: 'grid',
        columns: 3,
      };
      
    case 'testimonials':
      return {
        headline: 'What Our Customers Say',
        testimonials: [
          {
            quote: 'This product has changed how I work. Highly recommended!',
            author: 'Jane Doe',
            role: 'CEO, Company Inc.',
            image: '/images/placeholders/avatar-1.jpg',
          },
          {
            quote: 'The best solution we have found in the market.',
            author: 'John Smith',
            role: 'Marketing Director',
            image: '/images/placeholders/avatar-2.jpg',
          },
        ],
        style: 'cards',
      };
      
    case 'pricing':
      return {
        headline: 'Pricing Plans',
        subheadline: 'Choose the plan that works for you',
        plans: [
          {
            name: 'Basic',
            price: '9',
            period: 'month',
            description: 'Perfect for starters',
            features: [
              'Feature 1',
              'Feature 2',
              'Feature 3',
            ],
            cta: 'Get Started',
            ctaLink: '#',
            highlighted: false,
          },
          {
            name: 'Pro',
            price: '19',
            period: 'month',
            description: 'Most popular choice',
            features: [
              'Feature 1',
              'Feature 2',
              'Feature 3',
              'Feature 4',
              'Feature 5',
            ],
            cta: 'Get Started',
            ctaLink: '#',
            highlighted: true,
          },
          {
            name: 'Enterprise',
            price: '49',
            period: 'month',
            description: 'For larger teams',
            features: [
              'Feature 1',
              'Feature 2',
              'Feature 3',
              'Feature 4',
              'Feature 5',
              'Feature 6',
              'Feature 7',
            ],
            cta: 'Contact Us',
            ctaLink: '#',
            highlighted: false,
          },
        ],
      };
      
    case 'contact':
      return {
        headline: 'Contact Us',
        subheadline: 'Get in touch with our team',
        email: 'contact@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, City, Country',
        showForm: true,
        formFields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'message', label: 'Message', type: 'textarea', required: true },
        ],
        submitText: 'Send Message',
      };
      
    case 'cta':
      return {
        headline: 'Ready to get started?',
        subheadline: 'Join thousands of satisfied customers',
        buttonText: 'Get Started',
        buttonLink: '#',
        style: 'centered',
      };
      
    case 'custom':
      return {
        html: '<div style="padding: 20px; text-align: center;">Custom HTML content goes here</div>',
      };
      
    default:
      return {};
  }
}
