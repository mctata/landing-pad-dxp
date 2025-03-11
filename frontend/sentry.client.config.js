// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampleRate for greater accuracy
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  replaysOnErrorSampleRate: 1.0,
  
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    new Sentry.Replay({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // This option reports performance data like page transitions, HTTP requests, browser resource loading
  // For larger applications, consider adjusting the tracesSampleRate
  enableTracing: true,
  
  // Add custom tags
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
  
  // Only capture errors in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Ignore certain errors that are not actionable
  ignoreErrors: [
    // Common browser extension errors
    'top.GLOBALS',
    // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.epicplay.com',
    'Can\'t find variable: ZiteReader',
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'http://loading.retry.widdit.com/',
    'atomicFindClose',
    // Facebook borked
    'fb_xd_fragment',
    // ISP "helpful" errors
    'Request failed.',
    // Avast
    '_avast_submit',
    // User canceled requests
    'AbortError',
    'Network request failed',
    // Common pattern for users cancelling fetch requests
    'The user aborted a request',
    // Offline mode
    'Failed to fetch',
    'NetworkError when attempting to fetch resource',
  ],
  
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
    
    // Filter out certain custom errors you don't want to track
    if (event.exception && event.exception.values && event.exception.values[0]) {
      const errorMessage = event.exception.values[0].value;
      if (errorMessage && errorMessage.includes('ResizeObserver loop limit exceeded')) {
        return null;
      }
    }
    
    return event;
  },
});