import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import os from 'os';

// Simple in-memory metrics collection
let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();

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
    
    return NextResponse.json({
      status: 'ok',
      service: 'landing-pad-frontend',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      metrics: {
        uptime, // seconds
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        },
        cpu: {
          load1: cpuUsage[0],
          load5: cpuUsage[1],
          load15: cpuUsage[2],
        },
        requests: {
          total: requestCount,
          errors: errorCount,
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          cpus: os.cpus().length,
          totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
          freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
        }
      }
    });
  } catch (error) {
    // Increment error counter
    errorCount++;
    
    return NextResponse.json({
      status: 'error',
      service: 'landing-pad-frontend',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}