import { NextRequest, NextResponse } from 'next/server';
import { trackError } from '../route';
import { logger } from '@/lib/monitoring';
import * as Sentry from '@sentry/nextjs';

// In-memory store for error metrics
// In production, this would be replaced with a proper time-series database
const errorMetrics: any[] = [];

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Track the error in prometheus metrics
    trackError();
    
    // Add the error to metrics with additional request data
    const errorData = {
      ...data,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      receivedAt: new Date().toISOString()
    };
    
    errorMetrics.push(errorData);
    
    // Limit the size of in-memory metrics
    if (errorMetrics.length > 1000) {
      errorMetrics.shift();
    }
    
    // Log the error details for potential investigation
    logger.error('Client-side error', {
      context: data.context || 'unknown',
      error: data.error,
      stack: data.stack,
      userAgent: request.headers.get('user-agent')
    });
    
    // Report to Sentry if configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureMessage(`Client Error: ${data.error}`, {
        level: 'error',
        extra: {
          stack: data.stack,
          context: data.context,
          timestamp: data.timestamp
        }
      });
    }
    
    // Return a 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Log the error but still return success to the client
    logger.error('Error tracking client error', { error });
    return new NextResponse(null, { status: 204 });
  }
}

/**
 * GET endpoint to retrieve error metrics
 * This endpoint should be protected in production
 */
export async function GET() {
  return NextResponse.json({
    errors: errorMetrics,
    count: errorMetrics.length
  });
}