'use client';

import { DashboardNavigation } from '@/components/dashboard/Navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation />
      <main>{children}</main>
    </div>
  );
}