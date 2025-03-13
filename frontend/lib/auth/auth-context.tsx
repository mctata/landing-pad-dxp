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
        const token = localStorage.getItem('token');
        const userEmail = localStorage.getItem('userEmail');
        const userRole = localStorage.getItem('userRole');
        
        if (!token || !userEmail) {
          setIsLoading(false);
          return;
        }
        
        try {
          // Try to get user from API
          const response = await authAPI.getCurrentUser();
          setUser(response.data.user);
        } catch (error) {
          // If API fails, create user from local storage
          if (userEmail && userRole) {
            // Create a mock user from localStorage data for demo purposes
            setUser({
              id: 'mock-user-id',
              name: userEmail.split('@')[0],
              email: userEmail,
              subscription: userRole === 'admin' ? 'enterprise' : 'pro',
              role: userRole,
            });
            console.log('Using mock user from localStorage');
          }
        }
      } catch (error) {
        // Clear token if invalid
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
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
      
      // Save token
      localStorage.setItem('token', response.data.token);
      
      // Set user
      setUser(response.data.user);
      
      // Show success message
      toast.success('Login successful');
      
      // Redirect based on user role - use direct navigation for more reliable redirection
      if (response.data.user.role === 'admin') {
        // Admin goes to dashboard - add fromLogin to prevent middleware redirect loops
        window.location.href = '/dashboard?fromLogin=true';
      } else {
        // Regular users go to create page - add fromLogin to prevent middleware redirect loops
        window.location.href = '/dashboard/create?fromLogin=true';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(name, email, password);
      
      // Save token
      localStorage.setItem('token', response.data.token);
      
      // Set user
      setUser(response.data.user);
      
      // Show success message
      toast.success('Registration successful');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      // Call logout endpoint if needed
      // await authAPI.logout();
      
      // Clear token and user state
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      setUser(null);
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Redirect to home - use direct navigation
      window.location.href = '/';
    } catch (error) {
      // Even if API call fails, we still want to clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      setUser(null);
      window.location.href = '/';
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
