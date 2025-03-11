import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring';

// Store for Web Vitals metrics
// In production, this would be replaced with a proper time-series database
const webVitalsMetrics: any[] = [];

/**
 * Web Vitals metrics collection endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json();
    
    // Add the web vitals metric with additional request data
    const metricData = {
      ...data,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      receivedAt: new Date().toISOString()
    };
    
    webVitalsMetrics.push(metricData);
    
    // Limit the size of in-memory metrics
    if (webVitalsMetrics.length > 1000) {
      webVitalsMetrics.shift();
    }
    
    // Log the metric
    logger.debug('Tracked Web Vitals metric', {
      name: data.name,
      value: data.value,
      id: data.id
    });
    
    // Return a 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Log the error but still return success to the client
    logger.error('Error tracking Web Vitals', { error });
    return new NextResponse(null, { status: 204 });
  }
}

/**
 * GET endpoint to retrieve Web Vitals metrics
 * This endpoint should be protected in production
 */
export async function GET() {
  // Aggregate metrics by name
  const aggregatedMetrics: Record<string, { sum: number, count: number, avg: number, min: number, max: number }> = {};
  
  webVitalsMetrics.forEach(metric => {
    if (!aggregatedMetrics[metric.name]) {
      aggregatedMetrics[metric.name] = {
        sum: 0,
        count: 0,
        avg: 0,
        min: Number.MAX_VALUE,
        max: 0
      };
    }
    
    const value = Number(metric.value);
    if (!isNaN(value)) {
      aggregatedMetrics[metric.name].sum += value;
      aggregatedMetrics[metric.name].count++;
      aggregatedMetrics[metric.name].min = Math.min(aggregatedMetrics[metric.name].min, value);
      aggregatedMetrics[metric.name].max = Math.max(aggregatedMetrics[metric.name].max, value);
      aggregatedMetrics[metric.name].avg = aggregatedMetrics[metric.name].sum / aggregatedMetrics[metric.name].count;
    }
  });
  
  return NextResponse.json({
    metrics: webVitalsMetrics,
    aggregated: aggregatedMetrics,
    count: webVitalsMetrics.length
  });
}