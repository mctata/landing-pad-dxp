import axios from 'axios';
import { logger, trackApiTiming, trackClientError } from './monitoring';
import * as Sentry from '@sentry/nextjs';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
