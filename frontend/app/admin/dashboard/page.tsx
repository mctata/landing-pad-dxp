'use client';

import AdminDashboard from '@/components/admin/AdminDashboard';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}

// Server metadata
export const metadata = {
  title: 'Admin Dashboard - Landing Pad',
  description: 'Admin dashboard for managing websites, deployments, and domains',
};