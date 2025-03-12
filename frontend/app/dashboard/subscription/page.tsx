'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { subscriptionAPI } from '../../../lib/api';
import { useToast } from '@/components/ui/toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  current: boolean;
}

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch subscription plans
        const plansResponse = await subscriptionAPI.getPlans();
        setPlans(plansResponse.data.plans);
        
        // Fetch current subscription
        const subscriptionResponse = await subscriptionAPI.getCurrentSubscription();
        setSubscription(subscriptionResponse.data.subscription);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Failed to load subscription data. Please try again later.');
        toast({
          title: 'Error',
          message: 'Failed to load subscription data',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const handleSubscribe = async (planId: string) => {
    try {
      setCheckoutLoading(true);
      setError(null);
      
      // Create Stripe checkout session
      const response = await subscriptionAPI.createCheckoutSession(planId);
      
      // Redirect to Stripe checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Failed to create checkout session. Please try again later.');
      toast({
        title: 'Error',
        message: 'Failed to start subscription process',
        type: 'error',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true);
      setError(null);
      
      // Cancel subscription
      await subscriptionAPI.cancelSubscription();
      
      // Refresh subscription data
      const subscriptionResponse = await subscriptionAPI.getCurrentSubscription();
      setSubscription(subscriptionResponse.data.subscription);
      
      toast({
        title: 'Success',
        message: 'Your subscription will be canceled at the end of the billing period',
        type: 'success',
      });
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError('Failed to cancel subscription. Please try again later.');
      toast({
        title: 'Error',
        message: 'Failed to cancel subscription',
        type: 'error',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setResumeLoading(true);
      setError(null);
      
      // Resume subscription
      await subscriptionAPI.resumeSubscription();
      
      // Refresh subscription data
      const subscriptionResponse = await subscriptionAPI.getCurrentSubscription();
      setSubscription(subscriptionResponse.data.subscription);
      
      toast({
        title: 'Success',
        message: 'Your subscription has been resumed',
        type: 'success',
      });
    } catch (err) {
      console.error('Error resuming subscription:', err);
      setError('Failed to resume subscription. Please try again later.');
      toast({
        title: 'Error',
        message: 'Failed to resume subscription',
        type: 'error',
      });
    } finally {
      setResumeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center mb-3">
                    <div className="h-5 w-5 bg-gray-200 rounded-full mr-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
                <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-gray-900">Subscription Plans</h1>
          <p className="mt-2 text-sm text-gray-500">
            Choose the right plan for your website building needs
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Current subscription information */}
      {subscription && subscription.plan !== 'free' && (
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Current Subscription</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>You are currently on the <span className="font-semibold">{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</span> plan.</p>
              {subscription.currentPeriodEnd && (
                <p className="mt-1">
                  Your billing period ends on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                </p>
              )}
              {subscription.cancelAtPeriodEnd && (
                <p className="mt-2 text-yellow-600">
                  Your subscription is set to cancel at the end of the current billing period.
                </p>
              )}
            </div>
            <div className="mt-4">
              {subscription.cancelAtPeriodEnd ? (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleResumeSubscription}
                  disabled={resumeLoading}
                >
                  {resumeLoading ? 'Processing...' : 'Resume Subscription'}
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Processing...' : 'Cancel Subscription'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscription plans */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow overflow-hidden ${
              plan.current ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
              </div>
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-sm text-gray-500">{feature}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <button
                  type="button"
                  className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    plan.current
                      ? 'bg-green-600 hover:bg-green-700 cursor-default'
                      : plan.id === 'free_plan'
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.current || checkoutLoading || plan.id === 'free_plan'}
                >
                  {plan.current
                    ? 'Current Plan'
                    : checkoutLoading
                    ? 'Processing...'
                    : plan.id === 'free_plan'
                    ? 'Default Plan'
                    : 'Subscribe'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900">How do I cancel my subscription?</h3>
            <p className="mt-2 text-sm text-gray-500">
              You can cancel your subscription at any time from this page. Your plan will remain active until the end of your current billing period.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Can I change my plan?</h3>
            <p className="mt-2 text-sm text-gray-500">
              Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the new plan will be effective immediately. If you downgrade, the new plan will be effective at the end of your current billing period.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">What payment methods do you accept?</h3>
            <p className="mt-2 text-sm text-gray-500">
              We accept all major credit cards: Visa, Mastercard, American Express, and Discover.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Do you offer refunds?</h3>
            <p className="mt-2 text-sm text-gray-500">
              We don't offer refunds for subscription payments, but you can cancel your subscription at any time to prevent future charges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}