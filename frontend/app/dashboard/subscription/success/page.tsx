'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useToast } from '@/components/ui/toast';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const { toast } = useToast();
  
  useEffect(() => {
    // Show success toast
    toast({
      title: 'Success',
      message: 'Your subscription has been successfully processed',
      type: 'success',
    });
    
    // Countdown timer to redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard/subscription');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [router, toast]);
  
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" aria-hidden="true" />
            <h3 className="mt-5 text-2xl font-medium text-gray-900">Subscription Successful!</h3>
            <div className="mt-3">
              <p className="text-sm text-gray-500">
                Thank you for subscribing to our service. Your subscription has been processed successfully.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                You will receive a confirmation email shortly with all the details.
              </p>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                You will be redirected to your subscription page in {countdown} seconds...
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => router.push('/dashboard/subscription')}
              >
                Go to Subscription Page
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-50 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">What's Next?</h3>
            <div className="mt-3 text-sm text-gray-500">
              <p>With your new subscription, you can now:</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Create up to 10 websites</li>
                <li>Access all premium templates</li>
                <li>Configure custom domains</li>
                <li>Remove Landing Pad branding</li>
                <li>Get priority support</li>
              </ul>
              <p className="mt-3">
                If you have any questions about your subscription, please check the FAQ section on your subscription page or contact our support team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}