'use client';

import AdminDashboard from '@/components/admin/AdminDashboard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  useEffect(() => {
    console.log('Admin dashboard page loaded');
    
    // Log storage data for debugging
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('User from localStorage:', user);
      } else {
        console.log('No userData found in localStorage');
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
  }, []);

  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}