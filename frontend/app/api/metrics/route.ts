import { NextResponse } from 'next/server';
import os from 'os';

// Simple in-memory metrics collection
let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();
const pathCounters: Record<string, number> = {};

// Track request for a specific path
export function trackRequest(path: string) {
  requestCount++;
  pathCounters[path] = (pathCounters[path] || 0) + 1;
}

// Track error for monitoring
export function trackError() {
  errorCount++;
}

export async function GET() {
  try {
    // Calculate uptime
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get CPU load averages
    const cpuUsage = os.loadavg();
    
    // Format metrics in Prometheus format
    let metrics = '';
    
    // Add application info
    metrics += '# HELP app_info Information about the application\n';
    metrics += '# TYPE app_info gauge\n';
    metrics += `app_info{version="${process.env.npm_package_version || '1.0.0'}", service="landing-pad-frontend"} 1\n\n`;
    
    // Add uptime
    metrics += '# HELP app_uptime_seconds The uptime of the application in seconds\n';
    metrics += '# TYPE app_uptime_seconds counter\n';
    metrics += `app_uptime_seconds ${uptime}\n\n`;
    
    // Add memory metrics
    metrics += '# HELP app_memory_usage_bytes Memory usage in bytes\n';
    metrics += '# TYPE app_memory_usage_bytes gauge\n';
    metrics += `app_memory_usage_bytes{type="rss"} ${memoryUsage.rss}\n`;
    metrics += `app_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}\n`;
    metrics += `app_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}\n\n`;
    
    // Add CPU metrics
    metrics += '# HELP app_cpu_load CPU load averages\n';
    metrics += '# TYPE app_cpu_load gauge\n';
    metrics += `app_cpu_load{interval="1m"} ${cpuUsage[0]}\n`;
    metrics += `app_cpu_load{interval="5m"} ${cpuUsage[1]}\n`;
    metrics += `app_cpu_load{interval="15m"} ${cpuUsage[2]}\n\n`;
    
    // Add request metrics
    metrics += '# HELP app_http_requests_total Total number of HTTP requests\n';
    metrics += '# TYPE app_http_requests_total counter\n';
    metrics += `app_http_requests_total ${requestCount}\n\n`;
    
    // Add path-specific request metrics
    metrics += '# HELP app_http_requests_by_path_total Total number of HTTP requests by path\n';
    metrics += '# TYPE app_http_requests_by_path_total counter\n';
    Object.entries(pathCounters).forEach(([path, count]) => {
      metrics += `app_http_requests_by_path_total{path="${path}"} ${count}\n`;
    });
    metrics += '\n';
    
    // Add error metrics
    metrics += '# HELP app_http_errors_total Total number of HTTP errors\n';
    metrics += '# TYPE app_http_errors_total counter\n';
    metrics += `app_http_errors_total ${errorCount}\n\n`;
    
    // Add system metrics
    metrics += '# HELP app_system_memory_bytes System memory information in bytes\n';
    metrics += '# TYPE app_system_memory_bytes gauge\n';
    metrics += `app_system_memory_bytes{type="total"} ${os.totalmem()}\n`;
    metrics += `app_system_memory_bytes{type="free"} ${os.freemem()}\n\n`;
    
    metrics += '# HELP app_system_cpu_count Number of CPUs\n';
    metrics += '# TYPE app_system_cpu_count gauge\n';
    metrics += `app_system_cpu_count ${os.cpus().length}\n`;
    
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    errorCount++;
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}