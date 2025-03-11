/**
 * Monitoring utilities for the application
 * Provides logging, error tracking, and performance monitoring
 */
import * as Sentry from '@sentry/nextjs';
import { createLogger, format, transports } from 'winston';
import { ReportHandler } from 'web-vitals';

// Winston logger configuration
export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  defaultMeta: { service: 'landing-pad-frontend' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `[${timestamp}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
    }),
  ],
});

// Initialize Sentry if SENTRY_DSN is provided
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

// Simple client-side request tracking
let clientRequestCount = 0;
let clientErrorCount = 0;

/**
 * Track a client-side request for metrics
 * @param path The path being requested
 * @param metadata Additional information about the request
 */
export function trackClientRequest(path: string, metadata?: Record<string, any>): void {
  clientRequestCount++;
  
  logger.info(`Client request: ${path}`, { 
    type: 'client_request',
    path, 
    ...metadata 
  });
  
  // If we're in a browser environment, we can send the data to the server
  if (typeof window !== 'undefined') {
    try {
      // Use sendBeacon for non-blocking tracking
      navigator.sendBeacon('/api/metrics/track', JSON.stringify({ 
        path,
        metadata,
        timestamp: new Date().toISOString() 
      }));
    } catch (error) {
      logger.error('Failed to track request', { error, path });
    }
  }
}

/**
 * Track a client-side error for metrics
 * @param error The error that occurred
 * @param context Additional context about where the error occurred
 */
export function trackClientError(error: Error | string, context?: string): void {
  clientErrorCount++;
  
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error(`Client error: ${errorMessage}`, {
    type: 'client_error',
    error: errorMessage,
    stack: errorStack,
    context
  });
  
  // Report to Sentry if available
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (error instanceof Error) {
      Sentry.captureException(error, { 
        tags: { context } 
      });
    } else {
      Sentry.captureMessage(error, {
        level: 'error',
        tags: { context }
      });
    }
  }
  
  // If we're in a browser environment, we can send the data to the server
  if (typeof window !== 'undefined') {
    try {
      // Use sendBeacon for non-blocking tracking
      navigator.sendBeacon('/api/metrics/track-error', JSON.stringify({ 
        error: errorMessage,
        stack: errorStack,
        context,
        timestamp: new Date().toISOString() 
      }));
    } catch (e) {
      logger.error('Failed to track error', { error: e });
    }
  }
}

/**
 * Get client-side metrics
 * This is primarily for development and debugging
 */
export function getClientMetrics(): { requests: number, errors: number } {
  return {
    requests: clientRequestCount,
    errors: clientErrorCount
  };
}

/**
 * Track Web Vitals metrics for performance monitoring
 */
export const reportWebVitals: ReportHandler = (metric) => {
  logger.info('Web Vitals metric', {
    type: 'web_vitals',
    name: metric.name,
    value: metric.value,
    id: metric.id,
    navigationType: (metric as any).navigationType || 'unknown'
  });

  // Send to analytics endpoint if available
  if (typeof window !== 'undefined') {
    try {
      navigator.sendBeacon('/api/metrics/web-vitals', JSON.stringify({
        ...metric,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      logger.error('Failed to report Web Vitals', { error });
    }
  }
};

/**
 * Track API request timing
 * @param url The URL being requested
 * @param method The HTTP method
 * @param duration The request duration in milliseconds
 * @param status The response status code
 */
export function trackApiTiming(url: string, method: string, duration: number, status: number): void {
  logger.info(`API timing: ${method} ${url}`, {
    type: 'api_timing',
    url,
    method,
    duration,
    status
  });

  // Report to Sentry as span if available
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const transaction = Sentry.startTransaction({ 
      name: `${method} ${url}`,
      op: 'http.client'
    });
    
    transaction.setData('status', status);
    transaction.setData('duration', duration);
    transaction.finish();
  }
}