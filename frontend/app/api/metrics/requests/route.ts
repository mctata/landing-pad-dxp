import { NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring';
import { verifyAuth } from '@/lib/auth/auth-utils';

// This is a placeholder that would be replaced with actual database queries
// in a production environment
const requestMetrics: any[] = [];

export async function GET(request: Request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get('startTime') ? parseInt(searchParams.get('startTime') as string) : undefined;
    const endTime = searchParams.get('endTime') ? parseInt(searchParams.get('endTime') as string) : undefined;
    
    // Filter metrics by time range if provided
    let filteredMetrics = [...requestMetrics];
    if (startTime) {
      filteredMetrics = filteredMetrics.filter(metric => 
        metric.timestamp >= startTime
      );
    }
    
    if (endTime) {
      filteredMetrics = filteredMetrics.filter(metric => 
        metric.timestamp <= endTime
      );
    }
    
    return NextResponse.json(filteredMetrics);
  } catch (error) {
    logger.error('Error fetching request metrics', { error });
    return NextResponse.json({ error: 'Failed to fetch request metrics' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { path, method, duration, status } = data;
    
    if (!path || !method || duration === undefined || status === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Add request metric
    requestMetrics.push({
      path,
      method,
      duration,
      status,
      timestamp: Date.now()
    });
    
    // Limit stored metrics to prevent memory issues
    if (requestMetrics.length > 1000) {
      requestMetrics.shift(); // Remove oldest entry
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error tracking request metric', { error });
    return NextResponse.json({ error: 'Failed to track request' }, { status: 500 });
  }
}