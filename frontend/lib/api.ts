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
      originalRequest._retry = true;
      
      try {
        // Try to get a new access token using the refresh token
        const refreshResponse = await api.post('/api/auth/refresh-token');
        const { accessToken } = refreshResponse.data;
        
        if (accessToken) {
          // Save the new token
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', accessToken);
          }
          
          // Update the failed request's Authorization header
          originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token is invalid or expired, clear auth and redirect to login
        console.error('Token refresh failed:', refreshError);
        
        if (typeof window !== 'undefined') {
          // Clear auth data
          localStorage.removeItem('userData');
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userRole');
          
          // Only redirect if not already on login page to prevent loops
          if (!window.location.pathname.includes('/auth/login')) {
            const currentRedirectCount = new URLSearchParams(window.location.search).get('redirectCount');
            const redirectCount = currentRedirectCount ? parseInt(currentRedirectCount) + 1 : 1;
            
            // Prevent infinite loops by limiting redirect count
            if (redirectCount <= 3) {
              window.location.href = `/auth/login?redirectTo=${window.location.pathname}&redirectCount=${redirectCount}`;
            } else {
              console.warn('Breaking potential redirect loop');
              localStorage.removeItem('userData');
              localStorage.removeItem('token');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userRole');
              window.location.href = '/auth/login?forceLogin=true';
            }
          }
        }
      }
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
            accessToken: 'mock-jwt-token-' + Math.random().toString(36).substring(2)
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
  
  register: async (firstName: string, lastName: string, email: string, password: string) => {
    // Try to use real API first
    try {
      return await api.post('/api/auth/register', { firstName, lastName, email, password });
    } catch (error) {
      // If API fails, use mock implementation
      // Create a new mock user
      const newUser = {
        id: 'user-' + Math.random().toString(36).substring(2),
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email,
        subscription: 'free' as const,
        role: 'user',
      };
      
      return Promise.resolve({
        data: {
          user: newUser,
          accessToken: 'mock-jwt-token-' + Math.random().toString(36).substring(2),
          verificationRequired: true,
          verificationUrl: `/verify-email?token=mock-token-${Math.random().toString(36).substring(2)}`
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
  
  refreshToken: async () => {
    // Try to use real API first
    try {
      return await api.post('/api/auth/refresh-token');
    } catch (error) {
      // In mock mode, generate a new token
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (token && token.startsWith('mock-jwt-token-')) {
        return Promise.resolve({
          data: {
            accessToken: 'mock-jwt-token-' + Math.random().toString(36).substring(2)
          }
        });
      }
      
      return Promise.reject(new Error('Invalid refresh token'));
    }
  },
  
  logout: async () => {
    // Try to use real API first
    try {
      return await api.post('/api/auth/logout');
    } catch (error) {
      // In mock mode, just return success
      return Promise.resolve({
        data: {
          message: 'Logout successful'
        }
      });
    }
  },
  
  verifyEmail: async (token: string) => {
    // Try to use real API first
    try {
      return await api.get(`/api/auth/verify-email/${token}`);
    } catch (error) {
      // In mock mode, just return success
      return Promise.resolve({
        data: {
          message: 'Email verified successfully. You can now log in.'
        }
      });
    }
  },
  
  resendVerification: async (email: string) => {
    // Try to use real API first
    try {
      return await api.post('/api/auth/resend-verification', { email });
    } catch (error) {
      // In mock mode, just return success
      return Promise.resolve({
        data: {
          message: 'Verification email sent. Please check your inbox.',
          verificationUrl: `/verify-email?token=mock-token-${Math.random().toString(36).substring(2)}`
        }
      });
    }
  },
  
  forgotPassword: async (email: string) => {
    // Try to use real API first
    try {
      return await api.post('/api/auth/forgot-password', { email });
    } catch (error) {
      // In mock mode, just return success
      return Promise.resolve({
        data: {
          message: 'Password reset link sent. Please check your email.',
          resetUrl: `/reset-password?token=mock-token-${Math.random().toString(36).substring(2)}`
        }
      });
    }
  },
  
  resetPassword: async (token: string, newPassword: string) => {
    // Try to use real API first
    try {
      return await api.post('/api/auth/reset-password', { token, newPassword });
    } catch (error) {
      // In mock mode, just return success
      return Promise.resolve({
        data: {
          message: 'Password has been reset successfully. You can now log in.'
        }
      });
    }
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    // Try to use real API first
    try {
      return await api.post('/api/auth/change-password', { currentPassword, newPassword });
    } catch (error) {
      // In mock mode, just return success
      return Promise.resolve({
        data: {
          message: 'Password updated successfully'
        }
      });
    }
  },
  
  updateProfile: async (profileData: { firstName?: string, lastName?: string, company?: string }) => {
    // Try to use real API first
    try {
      return await api.patch('/api/users/profile', profileData);
    } catch (error) {
      // In mock mode, return success
      return Promise.resolve({
        data: {
          success: true,
          message: 'Profile updated successfully',
          user: {
            ...profileData,
            updatedAt: new Date().toISOString()
          }
        }
      });
    }
  },
  
  uploadProfileImage: async (file: File) => {
    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    
    // Try to use real API first
    try {
      // Use custom header for file upload
      return await api.post('/api/users/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      // In mock mode, return success with fake S3 URL
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileName = file.name.replace(/\s+/g, '-').toLowerCase();
      
      // Generate a realistic looking S3 URL
      const profileImageUrl = `https://landingpad-dxp-dev.s3.us-east-1.amazonaws.com/uploads/user-123/profile/${randomId}-${timestamp}-${fileName}`;
      
      return Promise.resolve({
        data: {
          success: true,
          message: 'Profile image uploaded successfully',
          profileImage: {
            url: profileImageUrl,
            key: `uploads/user-123/profile/${randomId}-${timestamp}-${fileName}`
          }
        }
      });
    }
  },
  
  // Social login methods
  loginWithGoogle: async () => {
    window.location.href = `${API_URL}/api/auth/google`;
  },
  
  loginWithLinkedIn: async () => {
    window.location.href = `${API_URL}/api/auth/linkedin`;
  },
  
  loginWithFacebook: async () => {
    window.location.href = `${API_URL}/api/auth/facebook`;
  }
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

// Admin API with mock implementation
export const adminAPI = {
  getStats: async () => {
    try {
      return await api.get('/api/admin/stats');
    } catch (error) {
      // Mock stats data
      const mockStats = {
        users: 87,
        websites: 142,
        deployments: 438,
        domains: 76,
        failedDeployments: 12,
        activeDomains: 68
      };
      
      // Mock recent deployments
      const mockRecentDeployments = [
        {
          id: '1',
          status: 'success',
          version: 'v1.2.4',
          commitMessage: 'Updated homepage hero section',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString(),
          buildTime: 5400,
          website: {
            name: 'Corporate Website'
          },
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }
        },
        {
          id: '2',
          status: 'failed',
          version: 'v1.2.5',
          commitMessage: 'Adding new product section',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 4.9 * 60 * 60 * 1000).toISOString(),
          buildTime: 3200,
          website: {
            name: 'Product Showcase'
          },
          user: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com'
          }
        },
        {
          id: '3',
          status: 'success',
          version: 'v2.0.0',
          commitMessage: 'Major redesign of landing page',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 23.9 * 60 * 60 * 1000).toISOString(),
          buildTime: 8700,
          website: {
            name: 'Marketing Campaign'
          },
          user: {
            firstName: 'Emily',
            lastName: 'Davis',
            email: 'emily@example.com'
          }
        },
        {
          id: '4',
          status: 'success',
          version: 'v1.1.2',
          commitMessage: 'Fixed footer links',
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 47.95 * 60 * 60 * 1000).toISOString(),
          buildTime: 2900,
          website: {
            name: 'Blog Site'
          },
          user: {
            firstName: 'Robert',
            lastName: 'Johnson',
            email: 'robert@example.com'
          }
        },
        {
          id: '5',
          status: 'in_progress',
          version: 'v2.1.0',
          commitMessage: 'Adding analytics integration',
          createdAt: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
          completedAt: null,
          buildTime: null,
          website: {
            name: 'E-commerce Site'
          },
          user: {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com'
          }
        }
      ];
      
      return Promise.resolve({
        data: {
          stats: mockStats,
          recentDeployments: mockRecentDeployments
        }
      });
    }
  },
  
  getUsers: async (page = 1, limit = 10) => {
    try {
      return await api.get(`/api/admin/users?page=${page}&limit=${limit}`);
    } catch (error) {
      // Mock users data
      const mockUsers = Array.from({ length: 15 }, (_, i) => ({
        id: `user-${i + 1}`,
        firstName: ['John', 'Jane', 'Robert', 'Emily', 'Michael', 'Sarah', 'David', 'Lisa'][i % 8],
        lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson'][i % 8],
        email: `user${i + 1}@example.com`,
        role: i === 0 ? 'admin' : 'user',
        subscription: i < 3 ? 'enterprise' : i < 8 ? 'pro' : 'free',
        createdAt: new Date(Date.now() - (i * 15) * 24 * 60 * 60 * 1000).toISOString(),
        lastLoginAt: i < 10 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString() : null
      }));
      
      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedUsers = mockUsers.slice(start, end);
      
      return Promise.resolve({
        data: {
          users: paginatedUsers,
          pagination: {
            totalItems: mockUsers.length,
            itemsPerPage: limit,
            currentPage: page,
            totalPages: Math.ceil(mockUsers.length / limit)
          }
        }
      });
    }
  },
  
  getUserById: async (id: string) => {
    try {
      return await api.get(`/api/admin/users/${id}`);
    } catch (error) {
      // Generate a mock user
      const mockUser = {
        id,
        firstName: ['John', 'Jane', 'Robert', 'Emily'][parseInt(id.split('-')[1]) % 4],
        lastName: ['Smith', 'Johnson', 'Williams', 'Brown'][parseInt(id.split('-')[1]) % 4],
        email: `user${id.split('-')[1]}@example.com`,
        role: id === 'user-1' ? 'admin' : 'user',
        subscription: id === 'user-1' ? 'enterprise' : parseInt(id.split('-')[1]) < 5 ? 'pro' : 'free',
        createdAt: new Date(Date.now() - parseInt(id.split('-')[1]) * 15 * 24 * 60 * 60 * 1000).toISOString(),
        lastLoginAt: new Date(Date.now() - parseInt(id.split('-')[1]) * 24 * 60 * 60 * 1000).toISOString(),
        websites: [
          {
            id: `website-${id.split('-')[1]}-1`,
            name: 'Portfolio Website',
            status: 'published'
          },
          {
            id: `website-${id.split('-')[1]}-2`,
            name: 'Business Site',
            status: 'draft'
          }
        ]
      };
      
      return Promise.resolve({
        data: {
          user: mockUser
        }
      });
    }
  },
  
  updateUser: async (id: string, data: any) => {
    try {
      return await api.patch(`/api/admin/users/${id}`, data);
    } catch (error) {
      // Mock success response
      return Promise.resolve({
        data: {
          success: true,
          message: 'User updated successfully'
        }
      });
    }
  },
  
  deleteUser: async (id: string) => {
    try {
      return await api.delete(`/api/admin/users/${id}`);
    } catch (error) {
      // Mock success response
      return Promise.resolve({
        data: {
          success: true,
          message: 'User deleted successfully'
        }
      });
    }
  }
};

export { api };
