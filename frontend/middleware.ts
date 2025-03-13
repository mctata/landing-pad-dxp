import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';
import * as Sentry from '@sentry/nextjs';

// Track request counts for metrics
const metrics = {
  totalRequests: 0,
  routeCounts: new Map<string, number>(),
  statusCounts: new Map<string, number>(),
  startTime: Date.now(),
};

// Helper function to increment metric counters
function incrementMetric(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

// Helper function to track timing
function trackTiming(start: number, pathname: string) {
  const duration = Date.now() - start;
  
  // Could add more sophisticated tracking here, like percentiles
  const routeTimings = metrics.routeTimings || new Map<string, number[]>();
  const timings = routeTimings.get(pathname) || [];
  timings.push(duration);
  routeTimings.set(pathname, timings);
  metrics.routeTimings = routeTimings;
  
  return duration;
}

// This middleware will run for all routes
export async function middleware(request: NextRequest) {
  // Track performance
  const startTime = Date.now();
  
  // Get the pathname and create a transaction for tracing
  const path = request.nextUrl.pathname;
  
  // Using a simple tracing approach for now until Sentry setup is complete
  let transaction = null;
  
  try {
    // Track request metrics
    metrics.totalRequests++;
    incrementMetric(metrics.routeCounts, path);
    
    // Always allow root page without auth
    if (path === '/') {
      return NextResponse.next();
    }
    
    // Handle specific redirects
    // Redirect /app to root
    if (path === '/app') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Redirect /index.html to root
    if (path === '/index.html') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Redirect static HTML files to their Next.js counterparts
    if (path.endsWith('.html') && !path.includes('/public/')) {
      const newPath = path.replace('.html', '');
      return NextResponse.redirect(new URL(newPath, request.url));
    }
    
    // Check if it's an admin route
    if (path.startsWith('/admin')) {
      // DEVELOPMENT MODE: Skip admin auth checks to prevent redirect loops
      // In production, you would enable this code
      
      // Parse URL to check for query parameters
      const url = new URL(request.url);
      
      // Skip auth check if explicitly told not to redirect or coming from login
      const noRedirect = url.searchParams.get('noRedirect') === '1';
      const isComingFromLogin = url.searchParams.get('fromLogin') === 'true';
      
      if (noRedirect || isComingFromLogin) {
        return NextResponse.next();
      }
      
      // Check for our custom auth mechanism first
      const userRole = request.cookies.get('userRole')?.value || '';
      const userData = request.cookies.get('userData')?.value || '';
      
      let isAdmin = false;
      
      // First try with userData JSON
      if (userData) {
        try {
          const user = JSON.parse(userData);
          isAdmin = user.role === 'admin';
        } catch (e) {
          console.warn('Failed to parse userData cookie');
        }
      }
      
      // Fallback to legacy userRole
      if (!isAdmin && userRole) {
        isAdmin = userRole === 'admin';
      }
      
      // If not an admin, try localStorage check on client-side
      if (!isAdmin) {
        // Get local storage data from client side - we'll check in a client component
        // For now, continue and let client-side handle redirect if needed
      }
      
      // FOR DEV MODE: Return next regardless
      return NextResponse.next();
    }
    
    // Check for authenticated routes
    if (path.startsWith('/dashboard') || path.startsWith('/projects')) {
      // DEVELOPMENT MODE: Skip all auth checks to prevent redirect loops
      // In production, you would enable this code
      
      // FOR DEV MODE: Always allow access to dashboard routes
      return NextResponse.next();
      
      /* 
      // Parse URL to check for query parameters
      const url = new URL(request.url);
      
      // Skip auth check if explicitly told not to redirect or coming from login
      const noRedirect = url.searchParams.get('noRedirect') === '1';
      const isComingFromLogin = url.searchParams.get('fromLogin') === 'true';
      
      if (noRedirect || isComingFromLogin) {
        return NextResponse.next();
      }
      
      // Get the session token - check for both next-auth and our custom token
      const nextAuthToken = request.cookies.get('next-auth.session-token')?.value || '';
      const hasToken = nextAuthToken || request.cookies.get('token')?.value;
      
      // If no token, redirect to login
      if (!hasToken) {
        // Track unauthorized attempts
        incrementMetric(metrics.statusCounts, 'redirect-auth');
        
        // Include the current path as redirectTo parameter
        return NextResponse.redirect(new URL(`/auth/login?redirectTo=${path}`, request.url));
      }
      */
    }
    
    // Track success
    incrementMetric(metrics.statusCounts, 'success');
    
    // Add response headers for tracking
    const response = NextResponse.next();
    
    // Add Server-Timing header for debugging
    const duration = trackTiming(startTime, path);
    response.headers.set('Server-Timing', `route;dur=${duration}`);
    
    // Continue to the next middleware or route handler
    return response;
  } catch (error) {
    // Track errors
    incrementMetric(metrics.statusCounts, 'error');
    
    // Log or report error
    console.error('Middleware error:', error);
    
    // In case of error, continue to the next middleware
    return NextResponse.next();
  }
}

// Add metrics to the global object for the health endpoint
if (typeof global !== 'undefined') {
  (global as any).__routeMetrics = metrics;
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    // Only apply middleware to these specific protected routes
    '/admin/:path*',
    '/dashboard/:path*',
    '/projects/:path*',
    
    // Static redirects
    '/app',
    '/index.html',
    '/:path*.html',
  ],
};