'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authAPI } from '../api';

interface User {
  id: string;
  name: string;
  email: string;
  subscription: 'free' | 'pro' | 'enterprise';
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get stored user data first (most reliable)
        const userData = localStorage.getItem('userData');
        
        if (userData) {
          try {
            // Parse stored user data
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            console.log('Using stored user data from localStorage');
            setIsLoading(false);
            return;
          } catch (e) {
            console.warn('Failed to parse userData from localStorage');
          }
        }
        
        // Fallback to legacy storage
        const token = localStorage.getItem('token');
        const userEmail = localStorage.getItem('userEmail');
        const userRole = localStorage.getItem('userRole');
        
        if (!token || !userEmail) {
          setIsLoading(false);
          return;
        }
        
        try {
          // Try to get user from API as a last resort
          const response = await authAPI.getCurrentUser();
          setUser(response.data.user);
        } catch (error) {
          // If API fails, create user from local storage
          if (userEmail && userRole) {
            // Create a mock user from localStorage data for demo purposes
            const mockUser = {
              id: 'mock-user-id',
              name: userEmail.split('@')[0],
              email: userEmail,
              subscription: userRole === 'admin' ? 'enterprise' : 'pro',
              role: userRole,
            };
            
            // Store it in the new format for next time
            localStorage.setItem('userData', JSON.stringify(mockUser));
            
            setUser(mockUser);
            console.log('Using mock user from localStorage (legacy format)');
          }
        }
      } catch (error) {
        // Clear all tokens if something went wrong
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        console.error('Auth check failed completely:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      
      // For social login, this might be in response.data.accessToken instead
      const token = response.data.token || response.data.accessToken;
      
      // Save token
      localStorage.setItem('token', token);
      
      // Save complete user data in a structured way to reduce API calls
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      
      // Legacy support - these are still used in some places
      localStorage.setItem('userEmail', response.data.user.email);
      localStorage.setItem('userRole', response.data.user.role);
      
      // Set user in state
      setUser(response.data.user);
      
      // Show success message
      toast.success('Login successful');
      
      // Add a small delay to ensure localStorage is updated before redirect
      // This helps prevent middleware auth issues
      setTimeout(() => {
        // Redirect based on user role - use direct navigation for more reliable redirection
        if (response.data.user.role === 'admin') {
          // Admin goes to admin dashboard - add fromLogin to prevent middleware redirect loops
          window.location.href = '/admin/dashboard?fromLogin=true';
        } else {
          // Regular users go to create page - add fromLogin to prevent middleware redirect loops
          window.location.href = '/dashboard/create?fromLogin=true';
        }
      }, 200);
    } catch (error: any) {
      // Handle specific error cases
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      
      // Handle specific error scenarios
      if (error.response?.status === 403 && error.response?.data?.verificationRequired) {
        toast.error('Email verification required. Please check your inbox for verification link.');
      } else if (error.response?.status === 429) {
        toast.error('Too many login attempts. Please try again later.');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const [firstName, lastName] = name.split(' ');
      
      const response = await authAPI.register(
        firstName || name, 
        lastName || '', 
        email, 
        password
      );
      
      // For backend API compatibility
      const token = response.data.token || response.data.accessToken;
      
      // Save token
      localStorage.setItem('token', token);
      
      // Save complete user data in structured format
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      
      // Legacy support - these are still used in some places
      localStorage.setItem('userEmail', response.data.user.email);
      localStorage.setItem('userRole', response.data.user.role || 'user');
      
      // Set user
      setUser(response.data.user);
      
      // Check if verification is required
      if (response.data.verificationRequired) {
        toast.success('Registration successful! Please check your email to verify your account.');
        
        // Go to verification pending page
        setTimeout(() => {
          // Use window.location for more reliable redirects
          window.location.href = '/auth/verify-email?email=' + encodeURIComponent(email);
        }, 200);
      } else {
        // Standard success message
        toast.success('Registration successful');
        
        // Add a small delay to ensure localStorage is updated
        setTimeout(() => {
          // Redirect to dashboard - use window.location for more reliable redirects
          window.location.href = '/dashboard?fromRegister=true';
        }, 200);
      }
    } catch (error: any) {
      // Handle specific error cases
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      
      if (error.response?.status === 400 && error.response?.data?.errors) {
        // Validation errors
        const validationErrors = error.response.data.errors;
        // Show first validation error
        toast.error(validationErrors[0]?.msg || errorMessage);
      } else if (error.response?.status === 409) {
        // Conflict - user already exists
        toast.error('An account with this email already exists.');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear all storage related to authentication
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      
      // Clear user state
      setUser(null);
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Add a small delay to ensure toast is shown
      setTimeout(() => {
        // Redirect to home - use direct navigation
        window.location.replace('/');
      }, 500);
    } catch (error) {
      // Even if there's an error, make sure we clear everything
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      setUser(null);
      
      // Redirect after a small delay
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth was called outside of AuthProvider. This could cause errors if not handled.');
    // Return a minimal default context instead of throwing
    // This helps when components unmount during navigation
    return {
      user: null,
      isLoading: false,
      login: async () => { console.error('Auth not initialized'); },
      signup: async () => { console.error('Auth not initialized'); },
      logout: async () => { console.error('Auth not initialized'); },
      isAuthenticated: false,
    } as AuthContextType;
  }
  return context;
}
