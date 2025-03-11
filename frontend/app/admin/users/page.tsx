'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { UserManagement } from '@/components/admin/UserManagement';

export default function UsersPage() {
  return (
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  );
}