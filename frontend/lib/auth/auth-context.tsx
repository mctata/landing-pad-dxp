'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authAPI } from '../api';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  name: string;
  email: string;
  subscription: 'free' | 'pro' | 'enterprise';
  role: string;
  firstName?: string;
  lastName?: string;
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if token is about to expire
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      // Check if the token will expire in the next 5 minutes
      return decoded.exp < (Date.now() / 1000) + 300;
    } catch (error) {
      return true;
    }
  };

  // Get token from storage
  const getStoredToken = (): string | null => {
    return localStorage.getItem('token');
  };

  // Save token to storage
  const saveToken = (token: string) => {
    localStorage.setItem('token', token);
  };

  // Save user data to storage
  const saveUserData = (userData: User) => {
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  // Clear all auth data from storage
  const clearAuthData = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    
    // Clear all cookies that might be related to auth
    document.cookie = 'refreshToken=; Max-Age=0; path=/; domain=' + window.location.hostname;
    document.cookie = 'token=; Max-Age=0; path=/; domain=' + window.location.hostname;
    document.cookie = 'userData=; Max-Age=0; path=/; domain=' + window.location.hostname;
    
    // Also try without specific domain for local development
    document.cookie = 'refreshToken=; Max-Age=0; path=/;';
    document.cookie = 'token=; Max-Age=0; path=/;';
    document.cookie = 'userData=; Max-Age=0; path=/;';
  };

  // Refresh the access token
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const response = await authAPI.refreshToken();
      const newToken = response.data.accessToken;
      if (newToken) {
        saveToken(newToken);
        return newToken;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      clearAuthData();
      setUser(null);
      return null;
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get stored token first
        const token = getStoredToken();
        
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Check if token is expired or about to expire
        if (isTokenExpired(token)) {
          // Try to refresh the token
          const newToken = await refreshAccessToken();
          if (!newToken) {
            setIsLoading(false);
            return;
          }
        }
        
        // Try to get stored user data
        const userData = localStorage.getItem('userData');
        
        if (userData) {
          try {
            // Parse stored user data
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            console.log('Using stored user data from localStorage');
            
            // Validate user data by making an API call
            try {
              const response = await authAPI.getCurrentUser();
              // Update user data if needed
              setUser(response.data.user);
              saveUserData(response.data.user);
            } catch (error) {
              console.warn('Could not validate user with API, using stored data');
            }
            
            setIsLoading(false);
            return;
          } catch (e) {
            console.warn('Failed to parse userData from localStorage');
          }
        }
        
        // If we have a token but no user data, get it from the API
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data.user);
          saveUserData(response.data.user);
        } catch (error) {
          console.error('Failed to get user data from API:', error);
          clearAuthData();
        }
      } catch (error) {
        console.error('Auth check failed completely:', error);
        clearAuthData();
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
      const token = response.data.accessToken || response.data.token;
      
      // Save token
      saveToken(token);
      
      // Save complete user data in a structured way to reduce API calls
      saveUserData(response.data.user);
      
      // Legacy support - these are still used in some places
      localStorage.setItem('userEmail', response.data.user.email);
      localStorage.setItem('userRole', response.data.user.role);
      
      // Set user in state
      setUser(response.data.user);
      
      // Show success message
      toast.success('Login successful');
      
      // Add a longer delay to ensure localStorage is updated before redirect
      // This helps prevent middleware auth issues
      setTimeout(() => {
        // Redirect based on user role - use direct navigation for more reliable redirection
        if (response.data.user.role === 'admin') {
          // Admin goes to admin dashboard - add fromLogin to prevent middleware redirect loops
          window.location.href = '/admin/dashboard?fromLogin=true&timestamp=' + Date.now();
        } else {
          // Regular users go to create page - add fromLogin to prevent middleware redirect loops
          window.location.href = '/dashboard/create?fromLogin=true&timestamp=' + Date.now();
        }
      }, 500);
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
      const token = response.data.accessToken || response.data.token;
      
      // Save token
      saveToken(token);
      
      // Save complete user data in structured format
      saveUserData(response.data.user);
      
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
        
        // Add a longer delay to ensure localStorage is updated
        setTimeout(() => {
          // Redirect to dashboard - use window.location for more reliable redirects
          window.location.href = '/dashboard?fromRegister=true&timestamp=' + Date.now();
        }, 500);
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
      // Try to call the logout API to invalidate the token on the server
      try {
        await authAPI.logout();
      } catch (error) {
        console.warn('Could not reach logout API:', error);
      }
      
      // Clear all storage related to authentication
      clearAuthData();
      
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
      clearAuthData();
      setUser(null);
      
      // Redirect after a small delay
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifyEmail(token);
      toast.success(response.data.message || 'Email verified successfully. You can now log in.');
      
      // Redirect to login page
      setTimeout(() => {
        window.location.replace('/auth/login');
      }, 1000);
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify email. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      toast.success(response.data.message || 'Password reset link sent. Please check your email.');
      return response.data;
    } catch (error: any) {
      // Don't expose if the email exists or not
      toast.success('If your email exists in our system, a password reset link will be sent.');
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (token: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.resetPassword(token, newPassword);
      toast.success(response.data.message || 'Password has been reset successfully. You can now log in.');
      
      // Redirect to login page
      setTimeout(() => {
        window.location.replace('/auth/login');
      }, 1000);
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      toast.error(errorMessage);
      throw error;
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
    refreshAccessToken,
    verifyEmail,
    forgotPassword,
    resetPassword,
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
