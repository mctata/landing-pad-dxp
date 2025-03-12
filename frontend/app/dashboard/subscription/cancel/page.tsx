'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { useToast } from '@/components/ui/toast';

export default function SubscriptionCancelPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const { toast } = useToast();
  
  useEffect(() => {
    // Show info toast
    toast({
      title: 'Info',
      message: 'Subscription process was canceled',
      type: 'info',
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
            <XCircleIcon className="h-16 w-16 text-yellow-500 mx-auto" aria-hidden="true" />
            <h3 className="mt-5 text-2xl font-medium text-gray-900">Subscription Canceled</h3>
            <div className="mt-3">
              <p className="text-sm text-gray-500">
                You've canceled the subscription process. No charges were made to your account.
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
            <h3 className="text-lg font-medium text-gray-900">Need Help?</h3>
            <div className="mt-3 text-sm text-gray-500">
              <p>If you encountered any issues during the subscription process or have questions about our plans, here are some resources that might help:</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Check our <a href="/dashboard/subscription" className="text-blue-600 hover:text-blue-500">subscription plans</a> for detailed information</li>
                <li>Refer to the FAQ section on the subscription page</li>
                <li>Contact our <a href="/help" className="text-blue-600 hover:text-blue-500">support team</a> for assistance</li>
              </ul>
              <p className="mt-3">
                You can try subscribing again at any time from your subscription page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}