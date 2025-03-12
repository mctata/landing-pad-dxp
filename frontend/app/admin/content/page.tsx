'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { ContentManagement } from '@/components/admin/ContentManagement';

export default function ContentPage() {
  return (
    <AdminLayout>
      <ContentManagement />
    </AdminLayout>
  );
}