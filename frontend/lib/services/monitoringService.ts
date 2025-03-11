import axios from 'axios';

export interface WebVitalMetric {
  name: string;
  value: number;
  timestamp: number;
  path?: string;
}

export interface ErrorMetric {
  type: string;
  message: string;
  count: number;
  lastOccurred: number;
  path?: string;
  browser?: string;
  stack?: string;
}

export interface RequestMetric {
  path: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

export interface SystemMetric {
  name: string;
  value: number;
  timestamp: number;
  unit?: string;
}

export interface AIMetric {
  feature: string;
  action: string;
  duration: number;
  success: boolean;
  timestamp: number;
}

export interface TimeRangeParams {
  startTime?: number;
  endTime?: number;
}

// Helper to convert time range string to actual timestamps
export const getTimeRange = (rangeStr: string): TimeRangeParams => {
  const now = Date.now();
  let startTime: number;
  
  switch(rangeStr) {
    case '6h':
      startTime = now - 6 * 60 * 60 * 1000;
      break;
    case '7d':
      startTime = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case '30d':
      startTime = now - 30 * 24 * 60 * 60 * 1000;
      break;
    case '24h':
    default:
      startTime = now - 24 * 60 * 60 * 1000;
  }

  return { startTime, endTime: now };
};

// Fetch Web Vitals metrics
export const fetchWebVitals = async (timeRange: string): Promise<WebVitalMetric[]> => {
  const { startTime, endTime } = getTimeRange(timeRange);
  try {
    const response = await axios.get('/api/metrics/web-vitals', {
      params: { startTime, endTime }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Web Vitals metrics:', error);
    return [];
  }
};

// Fetch Error metrics
export const fetchErrors = async (timeRange: string): Promise<ErrorMetric[]> => {
  const { startTime, endTime } = getTimeRange(timeRange);
  try {
    const response = await axios.get('/api/metrics/errors', {
      params: { startTime, endTime }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching error metrics:', error);
    return [];
  }
};

// Fetch Request metrics
export const fetchRequests = async (timeRange: string): Promise<RequestMetric[]> => {
  const { startTime, endTime } = getTimeRange(timeRange);
  try {
    const response = await axios.get('/api/metrics/requests', {
      params: { startTime, endTime }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching request metrics:', error);
    return [];
  }
};

// Fetch System Health metrics
export const fetchSystemHealth = async (timeRange: string): Promise<SystemMetric[]> => {
  const { startTime, endTime } = getTimeRange(timeRange);
  try {
    const response = await axios.get('/api/health/metrics', {
      params: { startTime, endTime }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching system health metrics:', error);
    return [];
  }
};

// Fetch AI Usage metrics
export const fetchAIMetrics = async (timeRange: string): Promise<AIMetric[]> => {
  const { startTime, endTime } = getTimeRange(timeRange);
  try {
    const response = await axios.get('/api/metrics/ai', {
      params: { startTime, endTime }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI metrics:', error);
    return [];
  }
};

// Generate mock data for development purposes
export const generateMockWebVitals = (timeRange: string): WebVitalMetric[] => {
  const { startTime, endTime } = getTimeRange(timeRange);
  const metrics = [];
  const vitalTypes = ['FCP', 'LCP', 'CLS', 'FID', 'TTFB'];
  const interval = (endTime - startTime) / 20;
  
  for (let timestamp = startTime; timestamp <= endTime; timestamp += interval) {
    vitalTypes.forEach(type => {
      let baseValue;
      // Set reasonable base values for each metric type
      switch (type) {
        case 'FCP':
          baseValue = 1200; // 1.2 seconds
          break;
        case 'LCP':
          baseValue = 2500; // 2.5 seconds
          break;
        case 'CLS':
          baseValue = 0.1; // 0.1 units
          break;
        case 'FID':
          baseValue = 100; // 100ms
          break;
        case 'TTFB':
          baseValue = 300; // 300ms
          break;
        default:
          baseValue = 1000;
      }
      
      // Add some randomness
      const value = baseValue * (0.8 + Math.random() * 0.4);
      
      metrics.push({
        name: type,
        value: type === 'CLS' ? Number(value.toFixed(3)) : Math.round(value),
        timestamp,
        path: ['/dashboard', '/dashboard/editor', '/'][Math.floor(Math.random() * 3)]
      });
    });
  }
  
  return metrics;
};

export const generateMockErrors = (timeRange: string): ErrorMetric[] => {
  const errorTypes = [
    { type: 'TypeError', message: 'Cannot read property of undefined' },
    { type: 'SyntaxError', message: 'Unexpected token in JSON' },
    { type: 'NetworkError', message: 'Failed to fetch' },
    { type: 'ReferenceError', message: 'Variable is not defined' },
    { type: 'RangeError', message: 'Invalid array length' }
  ];
  
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  const paths = ['/dashboard', '/dashboard/editor', '/', '/auth/login'];
  
  return errorTypes.map(error => ({
    type: error.type,
    message: error.message,
    count: Math.floor(Math.random() * 10) + 1,
    lastOccurred: Date.now() - Math.floor(Math.random() * 86400000),
    path: paths[Math.floor(Math.random() * paths.length)],
    browser: browsers[Math.floor(Math.random() * browsers.length)]
  }));
};

export const generateMockRequests = (timeRange: string): RequestMetric[] => {
  const { startTime, endTime } = getTimeRange(timeRange);
  const metrics = [];
  const interval = (endTime - startTime) / 50;
  
  const endpoints = [
    { path: '/api/projects', method: 'GET' },
    { path: '/api/auth/user', method: 'GET' },
    { path: '/api/templates', method: 'GET' },
    { path: '/api/projects', method: 'POST' },
    { path: '/api/deployments', method: 'POST' }
  ];
  
  for (let timestamp = startTime; timestamp <= endTime; timestamp += interval) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const duration = Math.floor(Math.random() * 500) + 50;
    const status = Math.random() > 0.9 ? (Math.random() > 0.5 ? 404 : 500) : 200;
    
    metrics.push({
      path: endpoint.path,
      method: endpoint.method,
      duration,
      status,
      timestamp
    });
  }
  
  return metrics;
};

export const generateMockSystemHealth = (timeRange: string): SystemMetric[] => {
  const { startTime, endTime } = getTimeRange(timeRange);
  const metrics = [];
  const interval = (endTime - startTime) / 30;
  
  const metricTypes = [
    { name: 'CPU Usage', unit: '%', baseValue: 25 },
    { name: 'Memory Usage', unit: '%', baseValue: 60 },
    { name: 'Request Rate', unit: 'req/s', baseValue: 12 },
    { name: 'Error Rate', unit: '%', baseValue: 2 }
  ];
  
  for (let timestamp = startTime; timestamp <= endTime; timestamp += interval) {
    metricTypes.forEach(type => {
      // Add some randomness and a slight trend upward over time
      const trend = (timestamp - startTime) / (endTime - startTime) * 10;
      const value = type.baseValue * (0.8 + Math.random() * 0.4) + trend;
      
      metrics.push({
        name: type.name,
        value: Number(value.toFixed(2)),
        unit: type.unit,
        timestamp
      });
    });
  }
  
  return metrics;
};

export const generateMockAIMetrics = (timeRange: string): AIMetric[] => {
  const { startTime, endTime } = getTimeRange(timeRange);
  const metrics = [];
  const interval = (endTime - startTime) / 40;
  
  const aiFeatures = [
    { feature: 'Content Generation', action: 'generate' },
    { feature: 'Content Enhancement', action: 'enhance' },
    { feature: 'Image Generation', action: 'generate_image' },
    { feature: 'SEO Suggestions', action: 'suggest' }
  ];
  
  for (let timestamp = startTime; timestamp <= endTime; timestamp += interval) {
    const feature = aiFeatures[Math.floor(Math.random() * aiFeatures.length)];
    const duration = Math.floor(Math.random() * 4000) + 1000;
    const success = Math.random() > 0.05;
    
    metrics.push({
      feature: feature.feature,
      action: feature.action,
      duration,
      success,
      timestamp
    });
  }
  
  return metrics;
};