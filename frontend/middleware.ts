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
  
  // Start a Sentry transaction for this request
  const transaction = process.env.NEXT_PUBLIC_SENTRY_DSN ? 
    Sentry.startTransaction({
      name: `Route: ${path}`,
      op: 'http.server',
    }) : null;
  
  try {
    // Track request metrics
    metrics.totalRequests++;
    incrementMetric(metrics.routeCounts, path);
    
    // Check if it's an admin route
    if (path.startsWith('/admin')) {
      // Get the session token
      const token = request.cookies.get('next-auth.session-token')?.value || '';
      
      if (!token) {
        // Track unauthorized attempts
        incrementMetric(metrics.statusCounts, 'redirect-auth');
        
        // Redirect to login if no token
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      
      try {
        // Decode the JWT token
        const session = await decode({
          token,
          secret: process.env.NEXTAUTH_SECRET || 'your-secret',
        });
        
        // Check if user is admin
        if (session?.role !== 'admin') {
          // Track unauthorized admin attempts
          incrementMetric(metrics.statusCounts, 'redirect-unauthorized');
          
          // Redirect to dashboard if not admin
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (error) {
        // Track invalid token
        incrementMetric(metrics.statusCounts, 'redirect-invalid-token');
        
        // If token is invalid, redirect to login
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
    
    // Check for authenticated routes
    if (path.startsWith('/dashboard') || path.startsWith('/projects')) {
      // Get the session token
      const token = request.cookies.get('next-auth.session-token')?.value || '';
      
      if (!token) {
        // Track unauthorized attempts
        incrementMetric(metrics.statusCounts, 'redirect-auth');
        
        // Redirect to login if no token
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
    
    // Track success
    incrementMetric(metrics.statusCounts, 'success');
    
    // Add response headers for tracking
    const response = NextResponse.next();
    
    // Add Server-Timing header for debugging
    const duration = trackTiming(startTime, path);
    response.headers.set('Server-Timing', `route;dur=${duration}`);
    
    if (transaction) {
      transaction.setData('route', path);
      transaction.setData('duration_ms', duration);
      transaction.setStatus('ok');
      transaction.finish();
    }
    
    // Continue to the next middleware or route handler
    return response;
  } catch (error) {
    // Track errors
    incrementMetric(metrics.statusCounts, 'error');
    
    if (transaction) {
      transaction.setData('route', path);
      transaction.setData('error', error instanceof Error ? error.message : 'Unknown error');
      transaction.setStatus('internal_error');
      transaction.finish();
    }
    
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
    // Exclude files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|auth/login|auth/signup).*)',
  ],
};