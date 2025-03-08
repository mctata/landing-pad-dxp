import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create an axios instance
export const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add to headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle different error types
    if (response) {
      // Server responded with error status
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and reload
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
          toast.error('Your session has expired. Please log in again.');
          break;
          
        case 403:
          // Forbidden
          toast.error('You don\'t have permission to perform this action.');
          break;
          
        case 404:
          // Not found
          toast.error('The requested resource was not found.');
          break;
          
        case 422:
          // Validation errors
          if (data.errors) {
            const errorMessages = Object.values(data.errors).flat();
            errorMessages.forEach((message: any) => toast.error(String(message)));
          } else {
            toast.error(data.message || 'Validation failed.');
          }
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          // Other errors
          toast.error(data.message || 'Something went wrong.');
      }
    } else {
      // Network error
      toast.error('Network error. Please check your connection and try again.');
    }
    
    return Promise.reject(error);
  }
);

// API helper functions
export const apiHelpers = {
  // Generic GET request
  get: async (url: string, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Generic POST request
  post: async (url: string, data = {}) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Generic PUT request
  put: async (url: string, data = {}) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Generic DELETE request
  delete: async (url: string) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;