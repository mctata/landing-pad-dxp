import React from 'react';
import AdminDashboard from '../../../components/admin/AdminDashboard';
import DashboardLayout from '../../../components/layout/DashboardLayout';

export const metadata = {
  title: 'Admin Dashboard - Landing Pad',
  description: 'Admin dashboard for managing websites, deployments, and domains',
};

export default function AdminDashboardPage() {
  return (
    <DashboardLayout>
      <AdminDashboard />
    </DashboardLayout>
  );
}