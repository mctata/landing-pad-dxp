// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampleRate for greater accuracy
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Enable server-side performance monitoring
  enableTracing: true,
  
  // Add custom tags
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
  
  // Only capture errors in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Set a custom server name
  serverName: process.env.HOSTNAME || 'unknown-server',
  
  // Ignore certain errors that are not actionable
  ignoreErrors: [
    // Next.js specific errors that aren't useful
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
    // Request cancellations
    'AbortError',
    'The operation was aborted',
  ],
  
  // Optionally capture HTTP request bodies for debugging
  // Warning: May contain sensitive information, use with caution
  includeHttpRequestBody: false,
  
  // Set custom sanitization options
  beforeSend(event) {
    // Don't send events in development unless explicitly enabled for testing
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV) {
      return null;
    }
    
    // Remove sensitive data
    if (event.request && event.request.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }
    
    // Remove potentially sensitive query parameters
    if (event.request && event.request.query_string) {
      // This is a simple example - you might want to be more selective
      delete event.request.query_string;
    }
    
    return event;
  },
});