'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import context providers
import { AuthProvider } from '@/lib/auth/auth-context';
import { ProjectProvider } from '@/lib/project/project-context';
import { TemplateProvider } from '@/lib/template/template-context';
import { AIProvider } from '@/lib/ai/ai-context';
import { SubscriptionProvider } from '@/lib/subscription/subscription-context';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProjectProvider>
          <TemplateProvider>
            <AIProvider>
              <SubscriptionProvider>
                {children}
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                />
              </SubscriptionProvider>
            </AIProvider>
          </TemplateProvider>
        </ProjectProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
