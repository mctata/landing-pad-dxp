'use client';

import React, { useEffect, ErrorInfo, ComponentType, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/nextjs';
import { usePathname, useSearchParams } from 'next/navigation';

// Import context providers
import { AuthProvider } from '@/lib/auth/auth-context';
import { ProjectProvider } from '@/lib/project/project-context';
import { TemplateProvider } from '@/lib/template/template-context';
import { AIProvider } from '@/lib/ai/ai-context';
import { SubscriptionProvider } from '@/lib/subscription/subscription-context';
import { trackClientError } from '@/lib/monitoring';
import { Toaster } from 'react-hot-toast';
import { PageTransition } from '@/components/ui/LoadingIndicator';

// Create a client with error tracking
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error: unknown) => {
        trackClientError(error instanceof Error ? error : new Error(String(error)), 'React Query Error');
      },
    },
    mutations: {
      onError: (error: unknown) => {
        trackClientError(error instanceof Error ? error : new Error(String(error)), 'React Query Mutation Error');
      },
    },
  },
});

// Error boundary component for capturing React errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: ComponentType<{ error: Error; resetError: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: ComponentType<{ error: Error; resetError: () => void }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track the error
    trackClientError(error, 'React Error Boundary');
    
    // Report to Sentry if available
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, { 
        contexts: { 
          react: { 
            componentStack: errorInfo.componentStack 
          } 
        } 
      });
    }
    
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Fallback component to show when errors occur
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="error-boundary p-4 m-4 border border-red-500 rounded bg-red-50">
      <h2 className="text-lg font-bold text-red-800">Something went wrong</h2>
      <p className="text-red-600 mb-4">{error.message}</p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
}

// Loading provider to handle page transitions
function LoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Listen for route changes
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    // For route change detection in App Router
    handleComplete(); // Reset on component mount and on pathname/searchParams change
    
    return () => {
      // Cleanup if needed
    };
  }, [pathname, searchParams]);

  return (
    <>
      {isLoading && <PageTransition />}
      {children}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize performance monitoring
  useEffect(() => {
    // Report initial page load
    if (typeof window !== 'undefined') {
      // Import dynamically to avoid SSR issues
      import('web-vitals').then((webVitals) => {
        // Web Vitals v4+ has a different API
        webVitals.onCLS(metric => trackMetric('CLS', metric));
        webVitals.onFID(metric => trackMetric('FID', metric));
        webVitals.onFCP(metric => trackMetric('FCP', metric));
        webVitals.onLCP(metric => trackMetric('LCP', metric));
        webVitals.onTTFB(metric => trackMetric('TTFB', metric));
      }).catch(err => {
        console.error('Failed to load web-vitals:', err);
      });
    }
    
    function trackMetric(name: string, metric: any) {
      // Use window.sa() or other analytics if needed
      if (typeof window !== 'undefined') {
        // Import dynamically to avoid SSR issues
        import('@/lib/monitoring').then(({ reportWebVitals }) => {
          reportWebVitals({ name, value: metric.value, id: metric.id, navigationType: metric.navigationType });
        });
      }
    }
  }, []);
  
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProjectProvider>
            <TemplateProvider>
              <AIProvider>
                <SubscriptionProvider>
                  <LoadingProvider>
                    {children}
                    <Toaster position="top-right" />
                  </LoadingProvider>
                </SubscriptionProvider>
              </AIProvider>
            </TemplateProvider>
          </ProjectProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
