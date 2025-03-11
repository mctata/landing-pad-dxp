import axios from 'axios';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Add token from localStorage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Logout user and redirect to login page
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        
        // If not on login page, redirect to login
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = `/auth/login?redirectTo=${window.location.pathname}`;
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  register: (name: string, email: string, password: string) => api.post('/api/auth/register', { name, email, password }),
  getCurrentUser: () => api.get('/api/auth/me'),
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
  changePassword: (currentPassword: string, newPassword: string) => api.post('/api/auth/change-password', { currentPassword, newPassword }),
};

// Project API
export const projectAPI = {
  getProjects: () => api.get('/api/projects'),
  getProjectById: (id: string) => api.get(`/api/projects/${id}`),
  createProject: (data: { name: string, description?: string, templateId: string }) => api.post('/api/projects', data),
  updateProject: (id: string, data: any) => api.patch(`/api/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/api/projects/${id}`),
  publishProject: (id: string, customDomain?: string) => api.post(`/api/projects/${id}/publish`, { customDomain }),
};

// Template API
export const templateAPI = {
  getTemplates: () => api.get('/api/templates'),
  getTemplateById: (id: string) => api.get(`/api/templates/${id}`),
  getTemplatesByCategory: (category: string) => api.get(`/api/templates/category/${category}`),
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

// Subscription API
export const subscriptionAPI = {
  getPlans: () => api.get('/api/stripe/plans'),
  createCheckoutSession: (planId: string) => api.post('/api/stripe/create-checkout-session', { planId }),
  getCurrentSubscription: () => api.get('/api/stripe/subscription'),
  cancelSubscription: () => api.post('/api/stripe/subscription/cancel'),
  resumeSubscription: () => api.post('/api/stripe/subscription/resume'),
};

export { api };
