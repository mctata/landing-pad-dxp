'use client';

import { DashboardNavigation } from '@/components/dashboard/Navigation';
import { ToastProvider } from '@/components/ui/toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastProvider>
        <DashboardNavigation />
        <main>{children}</main>
      </ToastProvider>
    </div>
  );
}