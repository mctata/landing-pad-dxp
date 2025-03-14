'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { DashboardNavigation } from '@/components/dashboard/Navigation';
import { ToastProvider } from '@/components/ui/toast';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Show loading state when changing routes
  useEffect(() => {
    // Set loading to true immediately when path changes
    setIsLoading(true);

    // Then set it to false after a delay to simulate page loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastProvider>
        <DashboardNavigation />
        {isLoading ? (
          <div className="fixed inset-0 bg-white/70 z-50 flex items-center justify-center">
            <LoadingIndicator size="lg" message="Loading..." />
          </div>
        ) : null}
        <main>{children}</main>
      </ToastProvider>
    </div>
  );
}