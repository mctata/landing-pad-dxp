'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Use the hook directly with the fallback provided in the hook itself
  const { user, isLoading, logout } = useAuth();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white border-b border-secondary-200">
      <div className="container-wide py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-10 h-10">
              <Image 
                src="/images/logo.svg" 
                alt="Landing Pad Digital" 
                fill 
                priority
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-secondary-900">Landing Pad</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/templates" 
              className={`text-sm font-medium ${isActive('/templates') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'}`}
            >
              Templates
            </Link>
            <Link 
              href="/features" 
              className={`text-sm font-medium ${isActive('/features') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'}`}
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className={`text-sm font-medium ${isActive('/pricing') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'}`}
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className={`text-sm font-medium ${isActive('/blog') ? 'text-primary-600' : 'text-secondary-600 hover:text-secondary-900'}`}
            >
              Blog
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="h-10 w-20 bg-secondary-100 animate-pulse rounded-md"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium text-secondary-600 hover:text-secondary-900"
                >
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link 
                    href="/admin/dashboard" 
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => logout()}
                  className="text-sm font-medium bg-secondary-100 px-4 py-2 rounded-md hover:bg-secondary-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link 
                  href="/auth/login" 
                  className="text-sm font-medium text-secondary-600 hover:text-secondary-900"
                >
                  Log in
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/templates" 
                className={`text-sm font-medium ${isActive('/templates') ? 'text-primary-600' : 'text-secondary-600'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Templates
              </Link>
              <Link 
                href="/features" 
                className={`text-sm font-medium ${isActive('/features') ? 'text-primary-600' : 'text-secondary-600'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className={`text-sm font-medium ${isActive('/pricing') ? 'text-primary-600' : 'text-secondary-600'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/blog" 
                className={`text-sm font-medium ${isActive('/blog') ? 'text-primary-600' : 'text-secondary-600'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </Link>
              
              <div className="pt-4 border-t border-secondary-200 flex flex-col space-y-4">
                {isLoading ? (
                  <div className="h-10 w-full bg-secondary-100 animate-pulse rounded-md"></div>
                ) : user ? (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="text-sm font-medium text-secondary-600 hover:text-secondary-900"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {user?.role === 'admin' && (
                      <Link 
                        href="/admin/dashboard" 
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="text-sm font-medium bg-secondary-100 px-4 py-2 rounded-md hover:bg-secondary-200 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/auth/login" 
                      className="text-sm font-medium text-secondary-600 hover:text-secondary-900"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link 
                      href="/auth/signup" 
                      className="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}