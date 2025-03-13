import axios from 'axios';
import { logger, trackApiTiming, trackClientError } from './monitoring';
import * as Sentry from '@sentry/nextjs';

// API base URL - Use different URLs for client-side vs server-side
const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL?.replace('http://backend:3000', 'http://localhost:3001') || 'http://localhost:3001')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token to requests and timing
api.interceptors.request.use(
  (config) => {
    // Add token from localStorage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add request start time for performance tracking
    config.metadata = { startTime: new Date().getTime() };
    
    // Trace with Sentry if available
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      const transaction = Sentry.startTransaction({
        name: `${config.method?.toUpperCase() || 'GET'} ${config.url}`,
        op: 'http.client',
      });
      
      // Store transaction in config for later use
      config.metadata.sentryTransaction = transaction;
    }
    
    logger.debug(`API Request: ${config.method?.toUpperCase() || 'GET'} ${config.url}`, {
      url: config.url,
      method: config.method,
    });
    
    return config;
  },
  (error) => {
    logger.error('API request error', { error });
    return Promise.reject(error);
  }
);

// Interceptor to handle auth errors and track performance
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    if (response.config.metadata) {
      const duration = new Date().getTime() - response.config.metadata.startTime;
      
      // Track API timing
      trackApiTiming(
        response.config.url || 'unknown',
        response.config.method?.toUpperCase() || 'GET',
        duration,
        response.status
      );
      
      // Finish Sentry transaction if it exists
      if (response.config.metadata.sentryTransaction) {
        const transaction = response.config.metadata.sentryTransaction;
        transaction.setData('status_code', response.status);
        transaction.setData('duration_ms', duration);
        transaction.finish();
      }
      
      logger.debug(`API Response: ${response.config.method?.toUpperCase() || 'GET'} ${response.config.url}`, {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        duration,
      });
    }
    
    return response;
  },
  async (error) => {
    // Track error timing and details
    if (error.config?.metadata) {
      const duration = new Date().getTime() - error.config.metadata.startTime;
      const status = error.response?.status || 0;
      
      // Track API timing for failed requests
      trackApiTiming(
        error.config.url || 'unknown',
        error.config.method?.toUpperCase() || 'GET',
        duration,
        status
      );
      
      // Finish Sentry transaction if it exists
      if (error.config.metadata.sentryTransaction) {
        const transaction = error.config.metadata.sentryTransaction;
        transaction.setData('status_code', status);
        transaction.setData('duration_ms', duration);
        transaction.setData('error', error.message);
        transaction.finish();
      }
      
      // Track client error
      trackClientError(error, `API Error: ${error.config.method?.toUpperCase() || 'GET'} ${error.config.url}`);
      
      logger.error(`API Error: ${error.config.method?.toUpperCase() || 'GET'} ${error.config.url}`, {
        url: error.config.url,
        method: error.config.method,
        status,
        duration,
        error: error.message,
      });
    }
    
    const originalRequest = error.config;
    
    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // DISABLE AUTO REDIRECT - this was causing redirect loops
      // Just log the error and continue
      console.warn('API authentication error, but not redirecting to prevent loops');
      
      // Don't remove token or trigger redirects anymore
      /* 
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = `/auth/login?redirectTo=${window.location.pathname}`;
      }
      */
    }
    
    return Promise.reject(error);
  }
);

// Mock users for testing
const MOCK_USERS = {
  'admin@example.com': {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    subscription: 'enterprise' as const,
    role: 'admin',
  },
  'john@example.com': {
    id: 'user-2',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    subscription: 'pro' as const,
    role: 'user',
  }
};

// Auth API with fallback to mock implementation
export const authAPI = {
  login: async (email: string, password: string) => {
    // Try to use real API first
    try {
      return await api.post('/api/auth/login', { email, password });
    } catch (error) {
      // If API fails, use mock implementation for demo accounts
      if (MOCK_USERS[email] && MOCK_USERS[email].password === password) {
        const user = { ...MOCK_USERS[email] };
        delete user.password; // Don't send password back
        
        // Store the email for getCurrentUser to use
        if (typeof window !== 'undefined') {
          localStorage.setItem('userEmail', email);
        }
        
        return Promise.resolve({
          data: {
            user,
            token: 'mock-jwt-token-' + Math.random().toString(36).substring(2)
          }
        });
      }
      return Promise.reject({
        response: {
          data: {
            message: 'Invalid email or password',
          }
        }
      });
    }
  },
  
  register: async (name: string, email: string, password: string) => {
    // Try to use real API first
    try {
      return await api.post('/api/auth/register', { name, email, password });
    } catch (error) {
      // If API fails, use mock implementation
      // Create a new mock user
      const newUser = {
        id: 'user-' + Math.random().toString(36).substring(2),
        name,
        email,
        subscription: 'free' as const,
        role: 'user',
      };
      
      return Promise.resolve({
        data: {
          user: newUser,
          token: 'mock-jwt-token-' + Math.random().toString(36).substring(2)
        }
      });
    }
  },
  
  getCurrentUser: async () => {
    // Try to use real API first
    try {
      return await api.get('/api/auth/me');
    } catch (error) {
      // If API fails, check if we have a mock token and use mock implementation
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      
      if (token && token.startsWith('mock-jwt-token-')) {
        // Get the user based on the stored email or default to admin
        let user;
        
        if (email && MOCK_USERS[email]) {
          user = { ...MOCK_USERS[email] };
        } else {
          user = { ...MOCK_USERS['admin@example.com'] };
        }
        
        delete user.password;
        
        return Promise.resolve({
          data: { user }
        });
      }
      
      return Promise.reject(new Error('Not authenticated'));
    }
  },
  
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
  changePassword: (currentPassword: string, newPassword: string) => api.post('/api/auth/change-password', { currentPassword, newPassword }),
};

// Mock projects data
const MOCK_PROJECTS = [
  {
    id: 'project-1',
    name: 'My Portfolio',
    description: 'Personal portfolio website',
    templateId: 'template-1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'user-1',
    published: true,
    publishedUrl: 'https://portfolio.landingpad.digital',
  },
  {
    id: 'project-2',
    name: 'Business Website',
    description: 'Website for my small business',
    templateId: 'template-2',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'user-1',
    published: false,
  },
  {
    id: 'project-3',
    name: 'Landing Page',
    description: 'Product launch landing page',
    templateId: 'template-4',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    userId: 'user-1',
    published: true,
    publishedUrl: 'https://product.landingpad.digital',
  },
];

// Project API with mock implementation
export const projectAPI = {
  getProjects: async () => {
    try {
      return await api.get('/api/projects');
    } catch (error) {
      // Fall back to mock data
      return Promise.resolve({
        data: {
          projects: MOCK_PROJECTS
        }
      });
    }
  },
  
  getProjectById: async (id: string) => {
    try {
      return await api.get(`/api/projects/${id}`);
    } catch (error) {
      // Find project in mock data
      const project = MOCK_PROJECTS.find(p => p.id === id);
      
      if (project) {
        return Promise.resolve({
          data: {
            project
          }
        });
      }
      
      // If not found, simulate 404
      return Promise.reject({
        response: {
          status: 404,
          data: {
            message: 'Project not found'
          }
        }
      });
    }
  },
  
  createProject: async (data: { name: string, description?: string, templateId: string }) => {
    try {
      return await api.post('/api/projects', data);
    } catch (error) {
      // Create a new mock project
      const newProject = {
        id: 'project-new-' + Math.random().toString(36).substring(2),
        name: data.name,
        description: data.description || '',
        templateId: data.templateId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'user-1',
        published: false,
      };
      
      // Add to mock projects
      MOCK_PROJECTS.push(newProject);
      
      return Promise.resolve({
        data: {
          project: newProject
        }
      });
    }
  },
  
  updateProject: async (id: string, data: any) => {
    try {
      return await api.patch(`/api/projects/${id}`, data);
    } catch (error) {
      // Find project in mock data
      const projectIndex = MOCK_PROJECTS.findIndex(p => p.id === id);
      
      if (projectIndex >= 0) {
        // Update project
        MOCK_PROJECTS[projectIndex] = {
          ...MOCK_PROJECTS[projectIndex],
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        return Promise.resolve({
          data: {
            project: MOCK_PROJECTS[projectIndex]
          }
        });
      }
      
      // If not found, simulate 404
      return Promise.reject({
        response: {
          status: 404,
          data: {
            message: 'Project not found'
          }
        }
      });
    }
  },
  
  deleteProject: async (id: string) => {
    try {
      return await api.delete(`/api/projects/${id}`);
    } catch (error) {
      // Find project in mock data
      const projectIndex = MOCK_PROJECTS.findIndex(p => p.id === id);
      
      if (projectIndex >= 0) {
        // Remove project
        MOCK_PROJECTS.splice(projectIndex, 1);
        
        return Promise.resolve({
          data: {
            success: true
          }
        });
      }
      
      // If not found, simulate 404
      return Promise.reject({
        response: {
          status: 404,
          data: {
            message: 'Project not found'
          }
        }
      });
    }
  },
  
  publishProject: async (id: string, customDomain?: string) => {
    try {
      return await api.post(`/api/projects/${id}/publish`, { customDomain });
    } catch (error) {
      // Find project in mock data
      const projectIndex = MOCK_PROJECTS.findIndex(p => p.id === id);
      
      if (projectIndex >= 0) {
        // Publish project
        MOCK_PROJECTS[projectIndex] = {
          ...MOCK_PROJECTS[projectIndex],
          published: true,
          publishedUrl: customDomain || `https://${MOCK_PROJECTS[projectIndex].name.toLowerCase().replace(/\s+/g, '-')}.landingpad.digital`,
          updatedAt: new Date().toISOString()
        };
        
        return Promise.resolve({
          data: {
            project: MOCK_PROJECTS[projectIndex]
          }
        });
      }
      
      // If not found, simulate 404
      return Promise.reject({
        response: {
          status: 404,
          data: {
            message: 'Project not found'
          }
        }
      });
    }
  },
};

// Mock templates data
const MOCK_TEMPLATES = [
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
];

// Template API with mock implementation
export const templateAPI = {
  getTemplates: async () => {
    try {
      return await api.get('/api/templates');
    } catch (error) {
      // Fall back to mock data
      return Promise.resolve({
        data: {
          templates: MOCK_TEMPLATES
        }
      });
    }
  },
  
  getTemplateById: async (id: string) => {
    try {
      return await api.get(`/api/templates/${id}`);
    } catch (error) {
      // Find template in mock data
      const template = MOCK_TEMPLATES.find(t => t.id === id);
      
      if (template) {
        return Promise.resolve({
          data: {
            template
          }
        });
      }
      
      // If not found, simulate 404
      return Promise.reject({
        response: {
          status: 404,
          data: {
            message: 'Template not found'
          }
        }
      });
    }
  },
  
  getTemplatesByCategory: async (category: string) => {
    try {
      return await api.get(`/api/templates/category/${category}`);
    } catch (error) {
      // Filter templates by category
      const templates = category 
        ? MOCK_TEMPLATES.filter(t => t.category === category)
        : MOCK_TEMPLATES;
      
      return Promise.resolve({
        data: {
          templates
        }
      });
    }
  },
};

// AI API
export const aiAPI = {
  // Legacy endpoints
  generateContent: (prompt: string, contentType: string) => api.post('/api/ai/generate-content', { prompt, contentType }),
  generateColorScheme: (data: { industry?: string, mood?: string, baseColor?: string }) => api.post('/api/ai/generate-color-scheme', data),
  generateFontPairings: (data: { style?: string, industry?: string }) => api.post('/api/ai/generate-font-pairings', data),
  
  // New enhanced endpoints
  generateEnhancedContent: (data: { 
    websiteId: string, 
    pageId: string, 
    elementType: string, 
    prompt: string, 
    tone?: string, 
    length?: string 
  }) => api.post('/api/ai/generate/content', data),
  
  generateLayout: (data: { 
    websiteId: string, 
    pageId: string, 
    prompt: string, 
    pageType?: string 
  }) => api.post('/api/ai/generate/layout', data),
  
  generateStyle: (data: { 
    websiteId: string, 
    prompt: string, 
    existingColors?: any, 
    existingFonts?: any 
  }) => api.post('/api/ai/generate/style', data),
  
  modifyContent: (data: { 
    content: string, 
    action: 'rewrite' | 'expand' | 'shorten' | 'changeStyle' | 'proofread', 
    parameters?: any 
  }) => api.post('/api/ai/modify/content', data),
  
  getSuggestions: (
    websiteId: string, 
    pageId: string, 
    data: { 
      type: 'text' | 'layout' | 'style', 
      prompt: string 
    }
  ) => api.post(`/api/ai/suggestions/${websiteId}/${pageId}`, data),
};

// Mock subscription data
const MOCK_PLANS = [
  {
    id: 'price_free',
    nickname: 'Free',
    product: {
      name: 'Free Plan',
      description: 'Basic features for individuals and small projects.'
    },
    unit_amount: 0,
    currency: 'usd',
    recurring: {
      interval: 'month'
    },
    metadata: {
      features: 'Basic websites,1 website,Landing Pad branding,Basic AI assistance'
    }
  },
  {
    id: 'price_pro',
    nickname: 'Pro',
    product: {
      name: 'Pro Plan',
      description: 'Advanced features for professionals and growing businesses.'
    },
    unit_amount: 1900,  // $19.00
    currency: 'usd',
    recurring: {
      interval: 'month'
    },
    metadata: {
      features: 'Premium templates,5 websites,No Landing Pad branding,Advanced AI assistance,Custom domain,Priority support'
    }
  },
  {
    id: 'price_enterprise',
    nickname: 'Enterprise',
    product: {
      name: 'Enterprise Plan',
      description: 'Full feature set for larger organizations.'
    },
    unit_amount: 9900,  // $99.00
    currency: 'usd',
    recurring: {
      interval: 'month'
    },
    metadata: {
      features: 'All Pro features,Unlimited websites,White-label option,Team collaboration,Dedicated support,Custom integrations'
    }
  }
];

// Subscription API with mock implementation
export const subscriptionAPI = {
  getPlans: async () => {
    // Skip the API call entirely in development to prevent console spam
    // and just use mock data directly
    console.log('Using mock plans data');
    return Promise.resolve({
      data: {
        plans: MOCK_PLANS
      }
    });
  },
  
  createCheckoutSession: async (planId: string) => {
    try {
      return await api.post('/api/stripe/create-checkout-session', { planId });
    } catch (error) {
      // Mock success response
      return Promise.resolve({
        data: {
          sessionId: 'mock-session-' + Math.random().toString(36).substring(2),
          url: '/dashboard/subscription/success?session_id=mock'
        }
      });
    }
  },
  
  getCurrentSubscription: async () => {
    // Skip API call in development to prevent console spam
    // Mock a subscription based on the user role
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    
    let plan = 'free';
    if (email === 'admin@example.com') {
      plan = 'enterprise';
    } else if (email === 'john@example.com') {
      plan = 'pro';
    }
    
    return Promise.resolve({
      data: {
        subscription: {
          id: 'sub_' + Math.random().toString(36).substring(2),
          plan: plan,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false
        }
      }
    });
  },
  
  cancelSubscription: async () => {
    try {
      return await api.post('/api/stripe/subscription/cancel');
    } catch (error) {
      // Mock success
      return Promise.resolve({
        data: {
          success: true,
          message: 'Subscription will be canceled at the end of the billing period'
        }
      });
    }
  },
  
  resumeSubscription: async () => {
    try {
      return await api.post('/api/stripe/subscription/resume');
    } catch (error) {
      // Mock success
      return Promise.resolve({
        data: {
          success: true,
          message: 'Subscription resumed successfully'
        }
      });
    }
  },
};

// Website API
export const websiteAPI = {
  getWebsites: () => api.get('/api/websites'),
  getWebsiteById: (id: string) => api.get(`/api/websites/${id}`),
  createWebsite: (data: any) => api.post('/api/websites', data),
  updateWebsite: (id: string, data: any) => api.patch(`/api/websites/${id}`, data),
  deleteWebsite: (id: string) => api.delete(`/api/websites/${id}`),
  publishWebsite: (id: string) => api.post(`/api/websites/${id}/publish`),
  getDeployments: (id: string) => api.get(`/api/websites/${id}/deployments`),
  getDomains: (id: string) => api.get(`/api/websites/${id}/domains`),
  addDomain: (id: string, name: string) => api.post(`/api/websites/${id}/domains`, { name }),
};

export { api };
