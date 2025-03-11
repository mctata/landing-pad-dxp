import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware will run for all routes
export function middleware(request: NextRequest) {
  // We'll implement request tracking in the frontend
  // This is a placeholder for future metrics tracking middleware
  // Actual tracking happens in the metrics endpoint since Next.js middleware 
  // doesn't share memory with the application
  
  // Continue to the next middleware or route handler
  return NextResponse.next();
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    // Exclude files and API routes that handle metrics
    '/((?!api/metrics|api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};