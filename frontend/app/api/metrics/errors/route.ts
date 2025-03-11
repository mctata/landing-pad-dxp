import { NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring';
import { verifyAuth } from '@/lib/auth/auth-utils';

// This is a placeholder that would be replaced with actual database queries
// in a production environment
const errorMetrics: any[] = [];

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
    let filteredMetrics = [...errorMetrics];
    if (startTime) {
      filteredMetrics = filteredMetrics.filter(metric => 
        metric.lastOccurred >= startTime
      );
    }
    
    if (endTime) {
      filteredMetrics = filteredMetrics.filter(metric => 
        metric.lastOccurred <= endTime
      );
    }
    
    return NextResponse.json(filteredMetrics);
  } catch (error) {
    logger.error('Error fetching error metrics', { error });
    return NextResponse.json({ error: 'Failed to fetch error metrics' }, { status: 500 });
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
    const { type, message, path, browser, stack } = data;
    
    if (!type || !message) {
      return NextResponse.json({ error: 'Type and message are required' }, { status: 400 });
    }
    
    // Check if error already exists
    const existingErrorIndex = errorMetrics.findIndex(
      err => err.type === type && err.message === message
    );
    
    if (existingErrorIndex >= 0) {
      // Update existing error
      errorMetrics[existingErrorIndex].count++;
      errorMetrics[existingErrorIndex].lastOccurred = Date.now();
      
      // Update path and browser if provided
      if (path) errorMetrics[existingErrorIndex].path = path;
      if (browser) errorMetrics[existingErrorIndex].browser = browser;
      if (stack) errorMetrics[existingErrorIndex].stack = stack;
    } else {
      // Add new error
      errorMetrics.push({
        type,
        message,
        count: 1,
        lastOccurred: Date.now(),
        path,
        browser,
        stack
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error tracking error metric', { error });
    return NextResponse.json({ error: 'Failed to track error' }, { status: 500 });
  }
}