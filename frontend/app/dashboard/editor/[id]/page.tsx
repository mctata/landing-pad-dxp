'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { EditorLayout } from '@/components/layout/EditorLayout';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { PageElementsMenu } from '@/components/editor/PageElementsMenu';
import { api } from '@/lib/api';
import { generateId } from '@/lib/utils';

interface WebsiteData {
  id: string;
  name: string;
  pages: PageData[];
  settings: WebsiteSettings;
  template: string;
  status: 'draft' | 'published';
}

interface PageData {
  id: string;
  name: string;
  slug: string;
  elements: ElementData[];
  isHome: boolean;
  seo: {
    title?: string;
    description?: string;
  };
}

interface ElementData {
  id: string;
  type: 'hero' | 'text' | 'image' | 'features' | 'cta' | 'pricing' | 'testimonials' | 'contact' | 'gallery' | 'custom';
  content: any;
  settings: any;
  position: number;
}

interface WebsiteSettings {
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
  globalStyles: {
    borderRadius: string;
    buttonStyle: string;
  };
}

export default function EditorPage({ params }: { params: { id: string } }) {
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const router = useRouter();
  
  // Fetch website data
  useEffect(() => {
    const fetchWebsite = async () => {
      setIsLoading(true);
      
      try {
        const response = await api.get(`/websites/${params.id}`);
        const websiteData = response.data.website;
        
        setWebsite(websiteData);
        
        // Set current page to home page by default
        const homePage = websiteData.pages.find(page => page.isHome) || websiteData.pages[0];
        if (homePage) {
          setCurrentPageId(homePage.id);
        }
      } catch (error) {
        console.error('Error fetching website:', error);
        toast.error('Failed to load website data');
        
        // Demo data for development
        const demoWebsite = createDemoWebsite(params.id);
        setWebsite(demoWebsite);
        setCurrentPageId(demoWebsite.pages[0].id);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWebsite();
  }, [params.id]);
  
  // Handle saving website changes
  const handleSave = async () => {
    if (!website) return;
    
    setIsSaving(true);
    
    try {
      await api.put(`/websites/${params.id}`, website);
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error saving website:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle adding a new element to the current page
  const handleAddElement = (elementType: ElementData['type']) => {
    if (!website || !currentPageId) return;
    
    // Find current page
    const pageIndex = website.pages.findIndex(page => page.id === currentPageId);
    if (pageIndex === -1) return;
    
    // Create new element
    const newElement: ElementData = {
      id: generateId(),
      type: elementType,
      content: getDefaultContentForElement(elementType),
      settings: getDefaultSettingsForElement(elementType),
      position: website.pages[pageIndex].elements.length,
    };
    
    // Add element to page
    const updatedPages = [...website.pages];
    updatedPages[pageIndex].elements.push(newElement);
    
    // Update website state
    setWebsite({
      ...website,
      pages: updatedPages,
    });
    
    // Select the new element
    setSelectedElementId(newElement.id);
    
    // Show settings panel
    setOpenPanel('element-settings');
    
    // Auto-save
    setTimeout(handleSave, 500);
  };
  
  // Handle updating an element
  const handleUpdateElement = (elementId: string, updates: Partial<ElementData>) => {
    if (!website || !currentPageId) return;
    
    // Find current page
    const pageIndex = website.pages.findIndex(page => page.id === currentPageId);
    if (pageIndex === -1) return;
    
    // Find element
    const elementIndex = website.pages[pageIndex].elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return;
    
    // Update element
    const updatedPages = [...website.pages];
    updatedPages[pageIndex].elements[elementIndex] = {
      ...updatedPages[pageIndex].elements[elementIndex],
      ...updates,
    };
    
    // Update website state
    setWebsite({
      ...website,
      pages: updatedPages,
    });
  };
  
  // Handle deleting an element
  const handleDeleteElement = (elementId: string) => {
    if (!website || !currentPageId) return;
    
    // Find current page
    const pageIndex = website.pages.findIndex(page => page.id === currentPageId);
    if (pageIndex === -1) return;
    
    // Remove element
    const updatedPages = [...website.pages];
    updatedPages[pageIndex].elements = updatedPages[pageIndex].elements.filter(el => el.id !== elementId);
    
    // Update positions after deletion
    updatedPages[pageIndex].elements.forEach((el, index) => {
      el.position = index;
    });
    
    // Update website state
    setWebsite({
      ...website,
      pages: updatedPages,
    });
    
    // Clear selected element if it was deleted
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
      setOpenPanel(null);
    }
    
    // Auto-save
    setTimeout(handleSave, 500);
  };
  
  // Handle reordering elements
  const handleReorderElements = (startIndex: number, endIndex: number) => {
    if (!website || !currentPageId) return;
    
    // Find current page
    const pageIndex = website.pages.findIndex(page => page.id === currentPageId);
    if (pageIndex === -1) return;
    
    // Clone elements array
    const elements = [...website.pages[pageIndex].elements];
    
    // Remove element from start position and insert at end position
    const [removed] = elements.splice(startIndex, 1);
    elements.splice(endIndex, 0, removed);
    
    // Update positions
    elements.forEach((el, index) => {
      el.position = index;
    });
    
    // Update website state
    const updatedPages = [...website.pages];
    updatedPages[pageIndex].elements = elements;
    
    setWebsite({
      ...website,
      pages: updatedPages,
    });
    
    // Auto-save
    setTimeout(handleSave, 500);
  };
  
  // Handle updating website settings
  const handleUpdateSettings = (newSettings: Partial<WebsiteSettings>) => {
    if (!website) return;
    
    setWebsite({
      ...website,
      settings: {
        ...website.settings,
        ...newSettings,
      },
    });
    
    // Auto-save
    setTimeout(handleSave, 500);
  };
  
  // Handle adding a new page
  const handleAddPage = () => {
    if (!website) return;
    
    const newPageId = generateId();
    const newPage: PageData = {
      id: newPageId,
      name: 'New Page',
      slug: `page-${website.pages.length + 1}`,
      elements: [],
      isHome: false,
      seo: {
        title: `${website.name} | New Page`,
        description: '',
      },
    };
    
    setWebsite({
      ...website,
      pages: [...website.pages, newPage],
    });
    
    // Switch to new page
    setCurrentPageId(newPageId);
    
    // Auto-save
    setTimeout(handleSave, 500);
  };
  
  // Get current page
  const currentPage = website?.pages.find(page => page.id === currentPageId);
  
  return (
    <EditorLayout
      websiteName={website?.name || 'Loading...'}
      isSaving={isSaving}
      onSave={handleSave}
      onPreview={() => window.open(`/preview/${params.id}`, '_blank')}
      onPublish={() => router.push(`/dashboard/publish/${params.id}`)}
      onExit={() => router.push('/dashboard')}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : website && currentPage ? (
        <div className="flex h-full">
          {/* Elements menu */}
          <PageElementsMenu 
            onAddElement={handleAddElement}
            isOpen={openPanel === 'elements'}
            onClose={() => setOpenPanel(null)}
          />
          
          {/* Editor canvas */}
          <div className="flex-1 overflow-auto">
            <EditorToolbar 
              websiteId={params.id}
              pages={website.pages}
              currentPageId={currentPageId}
              onPageChange={setCurrentPageId}
              onAddPage={handleAddPage}
              openPanel={openPanel}
              setOpenPanel={setOpenPanel}
            />
            
            <EditorCanvas 
              elements={currentPage.elements}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onReorderElements={handleReorderElements}
              settings={website.settings}
            />
          </div>
          
          {/* Editor sidebar */}
          <EditorSidebar 
            selectedElementId={selectedElementId}
            elements={currentPage.elements}
            settings={website.settings}
            onUpdateElement={handleUpdateElement}
            onUpdateSettings={handleUpdateSettings}
            isOpen={openPanel === 'element-settings' || openPanel === 'website-settings'}
            panelType={openPanel === 'element-settings' ? 'element' : 'website'}
            onClose={() => setOpenPanel(null)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-lg text-secondary-600">Website not found</p>
            <button
              className="mt-4 btn-primary"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </EditorLayout>
  );
}

// Helper functions to create demo data
function getDefaultContentForElement(type: ElementData['type']) {
  switch (type) {
    case 'hero':
      return {
        title: 'Welcome to our website',
        subtitle: 'We provide amazing services that help you achieve your goals.',
        buttonText: 'Get Started',
        buttonLink: '#',
        imageUrl: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      };
    case 'text':
      return {
        heading: 'Section Heading',
        content: '<p>This is a paragraph of text. You can edit this text to say anything you want.</p>',
      };
    case 'image':
      return {
        imageUrl: 'https://images.unsplash.com/photo-1498409785966-ab341407de6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        altText: 'Image description',
        caption: '',
      };
    case 'features':
      return {
        heading: 'Our Features',
        subheading: 'What makes us special',
        features: [
          {
            id: generateId(),
            title: 'Feature 1',
            description: 'This is a description of the first feature.',
            icon: 'star',
          },
          {
            id: generateId(),
            title: 'Feature 2',
            description: 'This is a description of the second feature.',
            icon: 'check',
          },
          {
            id: generateId(),
            title: 'Feature 3',
            description: 'This is a description of the third feature.',
            icon: 'lightning',
          },
        ],
      };
    case 'cta':
      return {
        heading: 'Ready to get started?',
        subheading: 'Join thousands of satisfied customers today.',
        buttonText: 'Sign Up Now',
        buttonLink: '#',
        secondaryButtonText: 'Learn More',
        secondaryButtonLink: '#',
      };
    case 'pricing':
      return {
        heading: 'Pricing Plans',
        subheading: 'Choose the plan that works for you',
        plans: [
          {
            id: generateId(),
            name: 'Basic',
            price: '9',
            billingPeriod: 'month',
            description: 'Perfect for individuals',
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            buttonText: 'Get Started',
            buttonLink: '#',
            highlighted: false,
          },
          {
            id: generateId(),
            name: 'Pro',
            price: '29',
            billingPeriod: 'month',
            description: 'For growing businesses',
            features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5'],
            buttonText: 'Get Started',
            buttonLink: '#',
            highlighted: true,
          },
          {
            id: generateId(),
            name: 'Enterprise',
            price: '99',
            billingPeriod: 'month',
            description: 'For large organizations',
            features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5', 'Feature 6', 'Feature 7'],
            buttonText: 'Contact Us',
            buttonLink: '#',
            highlighted: false,
          },
        ],
      };
    case 'testimonials':
      return {
        heading: 'What Our Customers Say',
        subheading: 'Testimonials from real users',
        testimonials: [
          {
            id: generateId(),
            quote: 'This product has completely transformed how we work. Highly recommended!',
            author: 'Jane Smith',
            role: 'CEO, Company Inc',
            avatarUrl: 'https://randomuser.me/api/portraits/women/17.jpg',
          },
          {
            id: generateId(),
            quote: 'The best solution we\'ve found after trying many alternatives.',
            author: 'John Doe',
            role: 'CTO, Startup LLC',
            avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
          },
          {
            id: generateId(),
            quote: 'Excellent customer support and a fantastic product!',
            author: 'Sarah Johnson',
            role: 'Marketing Director, Enterprise Co',
            avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
          },
        ],
      };
    case 'contact':
      return {
        heading: 'Contact Us',
        subheading: 'We\'d love to hear from you',
        address: '123 Main St, City, Country',
        email: 'contact@example.com',
        phone: '+1 (555) 123-4567',
        formEnabled: true,
        mapEnabled: true,
        mapLocation: '40.7128,-74.0060',
      };
    case 'gallery':
      return {
        heading: 'Our Gallery',
        subheading: 'Check out our latest work',
        images: [
          {
            id: generateId(),
            url: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            alt: 'Gallery image 1',
            caption: 'Project 1',
          },
          {
            id: generateId(),
            url: 'https://images.unsplash.com/photo-1563089145-599997674d42?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            alt: 'Gallery image 2',
            caption: 'Project 2',
          },
          {
            id: generateId(),
            url: 'https://images.unsplash.com/photo-1576153192396-180ecef2a715?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80',
            alt: 'Gallery image 3',
            caption: 'Project 3',
          },
          {
            id: generateId(),
            url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            alt: 'Gallery image 4',
            caption: 'Project 4',
          },
        ],
      };
    case 'custom':
      return {
        html: '<div class="p-8 text-center"><h2 class="text-2xl mb-4">Custom HTML Section</h2><p>You can edit this section with your own HTML code.</p></div>',
      };
    default:
      return {};
  }
}

function getDefaultSettingsForElement(type: ElementData['type']) {
  const commonSettings = {
    padding: {
      top: 'py-12',
      bottom: 'py-12',
    },
    backgroundColor: 'bg-white',
    textColor: 'text-gray-800',
    animation: 'none',
  };
  
  switch (type) {
    case 'hero':
      return {
        ...commonSettings,
        fullHeight: false,
        textAlignment: 'text-left',
        imagePosition: 'right',
      };
    case 'text':
      return {
        ...commonSettings,
        textAlignment: 'text-left',
        maxWidth: 'max-w-4xl',
        headingSize: 'text-2xl',
      };
    case 'image':
      return {
        ...commonSettings,
        imageSize: 'medium',
        borderRadius: 'rounded-lg',
        shadow: 'shadow-md',
      };
    case 'features':
      return {
        ...commonSettings,
        columns: 3,
        iconSize: 'medium',
        iconColor: 'text-primary-600',
      };
    case 'cta':
      return {
        ...commonSettings,
        backgroundColor: 'bg-primary-600',
        textColor: 'text-white',
        textAlignment: 'text-center',
        buttonStyle: 'rounded-full',
      };
    case 'pricing':
      return {
        ...commonSettings,
        columns: 3,
        pricingStyle: 'cards',
        showToggle: true,
      };
    case 'testimonials':
      return {
        ...commonSettings,
        style: 'cards',
        columns: 3,
        showImages: true,
      };
    case 'contact':
      return {
        ...commonSettings,
        layout: 'split',
        formPosition: 'left',
      };
    case 'gallery':
      return {
        ...commonSettings,
        columns: 4,
        gap: 'gap-4',
        aspectRatio: 'aspect-square',
      };
    case 'custom':
      return {
        ...commonSettings,
        maxWidth: 'max-w-full',
      };
    default:
      return commonSettings;
  }
}

function createDemoWebsite(id: string): WebsiteData {
  return {
    id,
    name: 'Demo Website',
    template: 'business',
    status: 'draft',
    pages: [
      {
        id: 'home-page',
        name: 'Home',
        slug: '',
        isHome: true,
        seo: {
          title: 'Demo Website | Home',
          description: 'Welcome to our demo website created with Landing Pad Digital.',
        },
        elements: [
          {
            id: 'hero-section',
            type: 'hero',
            position: 0,
            content: getDefaultContentForElement('hero'),
            settings: getDefaultSettingsForElement('hero'),
          },
          {
            id: 'features-section',
            type: 'features',
            position: 1,
            content: getDefaultContentForElement('features'),
            settings: getDefaultSettingsForElement('features'),
          },
          {
            id: 'cta-section',
            type: 'cta',
            position: 2,
            content: getDefaultContentForElement('cta'),
            settings: getDefaultSettingsForElement('cta'),
          },
        ],
      },
      {
        id: 'about-page',
        name: 'About',
        slug: 'about',
        isHome: false,
        seo: {
          title: 'Demo Website | About Us',
          description: 'Learn more about our company and our mission.',
        },
        elements: [
          {
            id: 'about-text',
            type: 'text',
            position: 0,
            content: {
              heading: 'About Us',
              content: '<p>We are a company dedicated to providing the best services to our customers. Our mission is to create value and satisfaction through innovative solutions.</p><p>Founded in 2022, we have grown rapidly and now serve customers worldwide.</p>',
            },
            settings: getDefaultSettingsForElement('text'),
          },
          {
            id: 'team-gallery',
            type: 'gallery',
            position: 1,
            content: {
              heading: 'Our Team',
              subheading: 'Meet the people behind our success',
              images: [
                {
                  id: generateId(),
                  url: 'https://randomuser.me/api/portraits/men/32.jpg',
                  alt: 'John Doe',
                  caption: 'John Doe, CEO',
                },
                {
                  id: generateId(),
                  url: 'https://randomuser.me/api/portraits/women/44.jpg',
                  alt: 'Jane Smith',
                  caption: 'Jane Smith, CTO',
                },
                {
                  id: generateId(),
                  url: 'https://randomuser.me/api/portraits/men/68.jpg',
                  alt: 'Robert Johnson',
                  caption: 'Robert Johnson, CFO',
                },
              ],
            },
            settings: {
              ...getDefaultSettingsForElement('gallery'),
              columns: 3,
            },
          },
        ],
      },
      {
        id: 'contact-page',
        name: 'Contact',
        slug: 'contact',
        isHome: false,
        seo: {
          title: 'Demo Website | Contact Us',
          description: 'Get in touch with our team for any questions or inquiries.',
        },
        elements: [
          {
            id: 'contact-form',
            type: 'contact',
            position: 0,
            content: getDefaultContentForElement('contact'),
            settings: getDefaultSettingsForElement('contact'),
          },
        ],
      },
    ],
    settings: {
      colors: {
        primary: '#3B82F6',
        secondary: '#1E293B',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1E293B',
      },
      fonts: {
        heading: 'Montserrat',
        body: 'Inter',
      },
      globalStyles: {
        borderRadius: 'rounded',
        buttonStyle: 'rounded-md',
      },
    },
  };
}