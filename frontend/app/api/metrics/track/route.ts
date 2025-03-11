import { NextRequest, NextResponse } from 'next/server';
import { trackRequest } from '../route';
import { logger } from '@/lib/monitoring';

// In-memory store for request metrics
// In production, this would be replaced with a proper time-series database
const requestMetrics: any[] = [];

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Track the request in prometheus metrics
    if (data && data.path) {
      trackRequest(data.path);
    }
    
    // Add the request to metrics with additional request data
    const requestData = {
      ...data,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      receivedAt: new Date().toISOString()
    };
    
    requestMetrics.push(requestData);
    
    // Limit the size of in-memory metrics
    if (requestMetrics.length > 1000) {
      requestMetrics.shift();
    }
    
    // Debug log
    logger.debug('Tracked client request', {
      path: data.path,
      metadata: data.metadata
    });
    
    // Return a 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Log the error but still return success to the client
    logger.error('Error tracking request', { error });
    return new NextResponse(null, { status: 204 });
  }
}

/**
 * GET endpoint to retrieve request metrics
 * This endpoint should be protected in production
 */
export async function GET() {
  return NextResponse.json({
    requests: requestMetrics,
    count: requestMetrics.length
  });
}