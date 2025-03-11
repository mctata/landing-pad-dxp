import { NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring';
import { verifyAuth } from '@/lib/auth/auth-utils';
import os from 'os';

// This is a placeholder that would be replaced with actual database queries
// in a production environment
const systemMetrics: any[] = [];

// Collect metrics every minute to avoid overwhelming memory
let lastCollectionTime = 0;
const COLLECTION_INTERVAL = 60000; // 1 minute

// Collect system metrics
const collectSystemMetrics = () => {
  const now = Date.now();
  
  // Only collect metrics if it's been at least COLLECTION_INTERVAL since last collection
  if (now - lastCollectionTime < COLLECTION_INTERVAL) {
    return;
  }
  
  lastCollectionTime = now;
  
  try {
    // CPU Usage (simplified calculation)
    const cpuCount = os.cpus().length;
    const loadAvg = os.loadavg()[0]; // 1 minute load average
    const cpuUsage = (loadAvg / cpuCount) * 100; // As percentage
    
    // Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;
    
    // Request Rate (dummy value - would be calculated from actual request metrics)
    // In a real app this would be calculated based on actual request data
    const requestRate = Math.random() * 15 + 5; // Random between 5-20 req/s
    
    // Error Rate (dummy value - would be calculated from actual error metrics)
    // In a real app this would be calculated based on actual error data
    const errorRate = Math.random() * 5; // Random between 0-5%
    
    const timestamp = Date.now();
    
    // Add metrics
    systemMetrics.push(
      {
        name: 'CPU Usage',
        value: Number(cpuUsage.toFixed(2)),
        unit: '%',
        timestamp
      },
      {
        name: 'Memory Usage',
        value: Number(memUsage.toFixed(2)),
        unit: '%',
        timestamp
      },
      {
        name: 'Request Rate',
        value: Number(requestRate.toFixed(2)),
        unit: 'req/s',
        timestamp
      },
      {
        name: 'Error Rate',
        value: Number(errorRate.toFixed(2)),
        unit: '%',
        timestamp
      }
    );
    
    // Trim old metrics
    while (systemMetrics.length > 5000) {
      systemMetrics.shift();
    }
  } catch (error) {
    logger.error('Error collecting system metrics', { error });
  }
};

export async function GET(request: Request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Collect fresh metrics
    collectSystemMetrics();

    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get('startTime') ? parseInt(searchParams.get('startTime') as string) : undefined;
    const endTime = searchParams.get('endTime') ? parseInt(searchParams.get('endTime') as string) : undefined;
    
    // Filter metrics by time range if provided
    let filteredMetrics = [...systemMetrics];
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
    logger.error('Error fetching system metrics', { error });
    return NextResponse.json({ error: 'Failed to fetch system metrics' }, { status: 500 });
  }
}