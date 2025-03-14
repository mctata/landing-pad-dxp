'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { 
  Cog6ToothIcon, 
  UsersIcon, 
  RectangleGroupIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  CurrencyDollarIcon,
  PaintBrushIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  
  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/auth/login?redirectTo=' + pathname);
    }
  }, [user, isLoading, router, pathname]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4 inline-block"></div>
          <p className="text-gray-600 font-medium">Loading admin portal...</p>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return null; // Will redirect due to the useEffect
  }
  
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: <ChartBarIcon className="h-5 w-5" aria-hidden="true" />,
      current: pathname === '/admin/dashboard'
    },
    { 
      name: 'Users', 
      href: '/admin/users', 
      icon: <UsersIcon className="h-5 w-5" aria-hidden="true" />,
      current: pathname === '/admin/users' || pathname?.startsWith('/admin/users/')
    },
    { 
      name: 'Content', 
      href: '/admin/content', 
      icon: <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />,
      current: pathname === '/admin/content' || pathname?.startsWith('/admin/content/')
    },
    { 
      name: 'Templates', 
      href: '/admin/templates', 
      icon: <RectangleGroupIcon className="h-5 w-5" aria-hidden="true" />,
      current: pathname === '/admin/templates' || pathname?.startsWith('/admin/templates/')
    },
    { 
      name: 'Appearance', 
      href: '/admin/appearance', 
      icon: <PaintBrushIcon className="h-5 w-5" aria-hidden="true" />,
      current: pathname === '/admin/appearance'
    },
    { 
      name: 'Subscriptions', 
      href: '/admin/subscriptions', 
      icon: <CurrencyDollarIcon className="h-5 w-5" aria-hidden="true" />,
      current: pathname === '/admin/subscriptions'
    },
    { 
      name: 'Notifications', 
      href: '/admin/notifications', 
      icon: <BellIcon className="h-5 w-5" aria-hidden="true" />,
      current: pathname === '/admin/notifications'
    },
    { 
      name: 'Security', 
      href: '/admin/security', 
      icon: <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />,
      current: pathname === '/admin/security'
    },
    { 
      name: 'Settings', 
      href: '/admin/settings', 
      icon: <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />,
      current: pathname === '/admin/settings'
    },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} 
        role="dialog" 
        aria-modal="true"
      >
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
        
        {/* Sidebar */}
        <div className="fixed inset-0 flex z-40">
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white focus:outline-none">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <Link href="/admin/dashboard" className="flex items-center space-x-2">
                  <div className="relative w-8 h-8">
                    <Image 
                      src="/images/logo.svg" 
                      alt="Landing Pad Admin" 
                      fill 
                      className="object-contain"
                    />
                  </div>
                  <span className="text-lg font-bold text-gray-900">Admin Portal</span>
                </Link>
              </div>
              <nav className="mt-5 px-2 space-y-1" aria-label="Sidebar">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      item.current
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    <span className="mr-3 flex-shrink-0 text-gray-500">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 group block">
                <div className="flex items-center">
                  <div className="inline-block h-9 w-9 rounded-full bg-gray-200 text-gray-600 text-center leading-9">
                    {user.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-700">{user.name}</p>
                    <div className="flex">
                      <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-700 mr-3">
                        Exit Admin
                      </Link>
                      <button
                        onClick={() => logout()}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </div>
      </div>
      
      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link href="/admin/dashboard" className="flex items-center space-x-2">
                <div className="relative w-8 h-8">
                  <Image 
                    src="/images/logo.svg" 
                    alt="Landing Pad Admin" 
                    fill 
                    className="object-contain"
                  />
                </div>
                <span className="text-lg font-bold text-gray-900">Admin Portal</span>
              </Link>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1" aria-label="Sidebar">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  <span className="mr-3 flex-shrink-0 text-gray-500">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="inline-block h-9 w-9 rounded-full bg-gray-200 text-gray-600 text-center leading-9" aria-hidden="true">
                  {user.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700" id="user-name">{user.name}</p>
                  <div className="flex text-xs">
                    <Link href="/dashboard" className="font-medium text-gray-500 hover:text-gray-700 mr-3">
                      Exit Admin
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="font-medium text-gray-500 hover:text-gray-700"
                      aria-label="Sign out"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="sticky top-0 z-10 lg:hidden bg-white border-b border-gray-200 flex items-center justify-between px-4 py-2">
        <button
          type="button"
          className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </button>
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg font-semibold text-gray-900">Admin Portal</h1>
        </div>
        <div className="flex items-center">
          <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900 mr-4">
            Exit
          </Link>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64 flex flex-col">
        <main className="flex-1">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}