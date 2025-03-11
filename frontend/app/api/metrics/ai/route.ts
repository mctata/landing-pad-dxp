import { NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring';
import { verifyAuth } from '@/lib/auth/auth-utils';

// This is a placeholder that would be replaced with actual database queries
// in a production environment
const aiMetrics: any[] = [];

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
    let filteredMetrics = [...aiMetrics];
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
    logger.error('Error fetching AI metrics', { error });
    return NextResponse.json({ error: 'Failed to fetch AI metrics' }, { status: 500 });
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
    const { feature, action, duration, success } = data;
    
    if (!feature || !action || duration === undefined || success === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Add AI metric
    aiMetrics.push({
      feature,
      action,
      duration,
      success,
      timestamp: Date.now()
    });
    
    // Limit stored metrics to prevent memory issues
    if (aiMetrics.length > 1000) {
      aiMetrics.shift(); // Remove oldest entry
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error tracking AI metric', { error });
    return NextResponse.json({ error: 'Failed to track AI usage' }, { status: 500 });
  }
}