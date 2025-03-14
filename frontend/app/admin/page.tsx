'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is just a redirect page for the /admin route
export default function AdminPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin inline-block w-12 h-12 border-4 border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
        <h2 className="mt-4 text-lg font-medium text-gray-900">Redirecting to admin dashboard...</h2>
      </div>
    </div>
  );
}