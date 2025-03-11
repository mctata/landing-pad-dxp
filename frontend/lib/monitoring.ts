/**
 * Monitoring utilities for the application
 */

// Simple client-side request tracking
let clientRequestCount = 0;
let clientErrorCount = 0;

/**
 * Track a client-side request for metrics
 * @param path The path being requested
 */
export function trackClientRequest(path: string): void {
  clientRequestCount++;
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Metrics] Tracked request: ${path}`);
  }
  
  // If we're in a browser environment, we can send the data to the server
  if (typeof window !== 'undefined') {
    try {
      // Use sendBeacon for non-blocking tracking
      navigator.sendBeacon('/api/metrics/track', JSON.stringify({ 
        path,
        timestamp: new Date().toISOString() 
      }));
    } catch (error) {
      console.error('[Metrics] Failed to track request:', error);
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
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Metrics] Tracked error: ${context || 'unknown'}`, error);
  }
  
  // If we're in a browser environment, we can send the data to the server
  if (typeof window !== 'undefined') {
    try {
      // Use sendBeacon for non-blocking tracking
      navigator.sendBeacon('/api/metrics/track-error', JSON.stringify({ 
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        context,
        timestamp: new Date().toISOString() 
      }));
    } catch (e) {
      console.error('[Metrics] Failed to track error:', e);
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