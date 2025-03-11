import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import os from 'os';
import { logger } from '@/lib/monitoring';
import { getClientMetrics } from '@/lib/monitoring';

// Simple in-memory metrics collection
let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();

// Track external dependencies
const dependencies = {
  database: { status: 'unknown', lastCheck: null },
  api: { status: 'unknown', lastCheck: null },
  storage: { status: 'unknown', lastCheck: null },
};

export async function GET() {
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'unknown';
  
  // Increment request counter
  requestCount++;
  
  try {
    // Basic system metrics
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const memoryUsage = process.memoryUsage();
    const cpuUsage = os.loadavg();
    
    // Check if process memory usage is high
    const totalMemory = os.totalmem();
    const processMemoryUsage = memoryUsage.rss;
    const memoryUsagePercent = (processMemoryUsage / totalMemory) * 100;
    
    // Determine status based on metrics
    let status = 'healthy';
    const statusDetails = [];
    
    if (memoryUsagePercent > 80) {
      status = 'degraded';
      statusDetails.push('High memory usage');
    }
    
    if (cpuUsage[0] > 0.8 * os.cpus().length) {
      status = 'degraded';
      statusDetails.push('High CPU usage');
    }
    
    if (errorCount > 100) {
      status = 'degraded';
      statusDetails.push('High error count');
    }
    
    // Get client-side metrics
    const clientMetrics = getClientMetrics();
    
    // Create health response
    const healthResponse = {
      status,
      statusDetails: statusDetails.length > 0 ? statusDetails : undefined,
      service: 'landing-pad-frontend',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      metrics: {
        uptime, // seconds
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          percentUsed: Math.round(memoryUsagePercent * 100) / 100, // Percentage with 2 decimal places
        },
        cpu: {
          load1: cpuUsage[0],
          load5: cpuUsage[1],
          load15: cpuUsage[2],
        },
        requests: {
          server: {
            total: requestCount,
            errors: errorCount,
          },
          client: clientMetrics,
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          cpus: os.cpus().length,
          totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
          freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
        },
        dependencies,
      }
    };
    
    // Log health check
    logger.info('Health check', {
      status,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        percentUsed: Math.round(memoryUsagePercent * 100) / 100,
      },
      cpu: cpuUsage[0],
      requests: requestCount,
      errors: errorCount,
      userAgent,
    });
    
    return NextResponse.json(healthResponse, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    // Increment error counter
    errorCount++;
    
    // Log error
    logger.error('Health check error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userAgent,
    });
    
    return NextResponse.json({
      status: 'error',
      service: 'landing-pad-frontend',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}