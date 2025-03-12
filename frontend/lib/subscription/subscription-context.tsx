'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscriptionAPI } from '../api';
import { useToast } from '@/components/ui/toast';
import { trackClientError } from '../monitoring';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  current: boolean;
}

interface Subscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

interface SubscriptionContextType {
  plans: Plan[];
  currentSubscription: Subscription | null;
  isLoading: boolean;
  fetchPlans: () => Promise<void>;
  fetchCurrentSubscription: () => Promise<void>;
  createCheckoutSession: (planId: string) => Promise<{ sessionId: string; url: string }>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    // Only fetch if we're in the browser
    if (typeof window !== 'undefined') {
      fetchPlans();
      fetchCurrentSubscription();
    }
  }, []);

  // Fetch subscription plans
  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await subscriptionAPI.getPlans();
      setPlans(response.data.plans);
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to fetch subscription plans',
        type: 'error'
      });
      trackClientError(error, 'Failed to fetch subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current subscription
  const fetchCurrentSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await subscriptionAPI.getCurrentSubscription();
      setCurrentSubscription(response.data.subscription);
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to fetch current subscription',
        type: 'error'
      });
      trackClientError(error, 'Failed to fetch current subscription');
    } finally {
      setIsLoading(false);
    }
  };

  // Create checkout session for new subscription
  const createCheckoutSession = async (planId: string) => {
    setIsLoading(true);
    try {
      const response = await subscriptionAPI.createCheckoutSession(planId);
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create checkout session',
        type: 'error'
      });
      trackClientError(error, 'Failed to create checkout session');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    setIsLoading(true);
    try {
      await subscriptionAPI.cancelSubscription();
      
      // Update current subscription
      if (currentSubscription) {
        setCurrentSubscription({
          ...currentSubscription,
          cancelAtPeriodEnd: true,
        });
      }
      
      toast({
        title: 'Success',
        message: 'Subscription will be canceled at the end of the current billing period',
        type: 'success'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to cancel subscription',
        type: 'error'
      });
      trackClientError(error, 'Failed to cancel subscription');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Resume subscription
  const resumeSubscription = async () => {
    setIsLoading(true);
    try {
      await subscriptionAPI.resumeSubscription();
      
      // Update current subscription
      if (currentSubscription) {
        setCurrentSubscription({
          ...currentSubscription,
          cancelAtPeriodEnd: false,
        });
      }
      
      toast({
        title: 'Success',
        message: 'Subscription resumed successfully',
        type: 'success'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to resume subscription',
        type: 'error'
      });
      trackClientError(error, 'Failed to resume subscription');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    plans,
    currentSubscription,
    isLoading,
    fetchPlans,
    fetchCurrentSubscription,
    createCheckoutSession,
    cancelSubscription,
    resumeSubscription,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
