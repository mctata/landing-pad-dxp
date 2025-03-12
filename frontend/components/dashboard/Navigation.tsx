'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  RocketLaunchIcon, 
  CreditCardIcon, 
  ChartBarIcon, 
  Cog6ToothIcon, 
  UserCircleIcon,
  BuildingStorefrontIcon,
  GlobeAltIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

export function DashboardNavigation() {
  const pathname = usePathname();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Websites', href: '/dashboard', icon: BuildingStorefrontIcon, current: pathname === '/dashboard' },
    { name: 'Templates', href: '/dashboard/templates', icon: DocumentIcon, current: pathname?.includes('/dashboard/templates') },
    { name: 'Publishing', href: '/dashboard/publish', icon: RocketLaunchIcon, current: pathname?.includes('/dashboard/publish') },
    { name: 'Domains', href: '/dashboard/domains', icon: GlobeAltIcon, current: pathname?.includes('/dashboard/domains') },
    { name: 'Subscription', href: '/dashboard/subscription', icon: CreditCardIcon, current: pathname?.includes('/dashboard/subscription') },
    { name: 'Monitoring', href: '/dashboard/monitoring', icon: ChartBarIcon, current: pathname?.includes('/dashboard/monitoring') },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, current: pathname?.includes('/dashboard/settings') },
  ];
  
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="h-8 w-auto sm:h-10 font-bold text-lg text-primary-600">
                  Landing Pad
                </span>
              </Link>
            </div>
            <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'border-primary-500 text-primary-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  <item.icon className="h-4 w-4 mr-1" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className="sm:hidden" id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                item.current
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              aria-current={item.current ? 'page' : undefined}
            >
              <span className="flex items-center">
                <item.icon className="h-5 w-5 mr-2" />
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}