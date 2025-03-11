'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { fetchRequests, generateMockRequests, RequestMetric } from '@/lib/services/monitoringService';

interface RequestsPanelProps {
  timeRange: string;
}

// Function to format timestamp to readable format
const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  });
};

// Function to format HTTP status to class
const getStatusClass = (status: number) => {
  if (status < 300) return 'text-green-600';
  if (status < 400) return 'text-blue-600';
  if (status < 500) return 'text-yellow-600';
  return 'text-red-600';
};

const RequestsPanel: React.FC<RequestsPanelProps> = ({ timeRange }) => {
  const [metrics, setMetrics] = useState<RequestMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'volumeTime' | 'endpointTime' | 'status'>('volumeTime');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // In a real app, use fetchRequests(timeRange) instead
        const data = generateMockRequests(timeRange);
        setMetrics(data);
      } catch (error) {
        console.error('Error loading request metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  // Function to aggregate request volume by time interval
  const getVolumeTimeData = () => {
    if (metrics.length === 0) return [];
    
    const { startTime, endTime } = getTimeRangeFromMetrics();
    const timeInterval = Math.max(Math.floor((endTime - startTime) / 20), 60000); // At least 1 minute
    
    // Create time buckets
    const buckets: { time: number; count: number; formattedTime: string }[] = [];
    for (let time = startTime; time <= endTime; time += timeInterval) {
      buckets.push({ 
        time, 
        count: 0,
        formattedTime: formatTimestamp(time)
      });
    }
    
    // Count requests in each bucket
    metrics.forEach(req => {
      const bucketIndex = Math.floor((req.timestamp - startTime) / timeInterval);
      if (bucketIndex >= 0 && bucketIndex < buckets.length) {
        buckets[bucketIndex].count++;
      }
    });
    
    return buckets;
  };

  // Function to get time range from metrics
  const getTimeRangeFromMetrics = () => {
    if (metrics.length === 0) {
      return { startTime: Date.now() - 24 * 60 * 60 * 1000, endTime: Date.now() };
    }
    
    const timestamps = metrics.map(m => m.timestamp);
    return {
      startTime: Math.min(...timestamps),
      endTime: Math.max(...timestamps)
    };
  };

  // Function to aggregate requests by endpoint
  const getEndpointData = () => {
    return metrics.reduce((acc, req) => {
      const existing = acc.find(item => item.path === req.path && item.method === req.method);
      if (existing) {
        existing.count++;
        existing.totalDuration += req.duration;
        if (req.status >= 400) existing.errorCount++;
      } else {
        acc.push({
          path: req.path,
          method: req.method,
          count: 1,
          totalDuration: req.duration,
          avgDuration: req.duration,
          errorCount: req.status >= 400 ? 1 : 0
        });
      }
      return acc;
    }, [] as { path: string; method: string; count: number; totalDuration: number; avgDuration: number; errorCount: number }[])
    .map(item => ({
      ...item,
      avgDuration: Math.round(item.totalDuration / item.count),
      errorRate: item.count > 0 ? (item.errorCount / item.count) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);
  };

  // Function to get status code distribution
  const getStatusData = () => {
    return metrics.reduce((acc, req) => {
      const statusCategory = Math.floor(req.status / 100) * 100;
      const existingCategory = acc.find(item => item.status === statusCategory);
      
      if (existingCategory) {
        existingCategory.count++;
      } else {
        acc.push({
          status: statusCategory,
          count: 1
        });
      }
      return acc;
    }, [] as { status: number; count: number }[])
    .map(item => ({
      name: `${item.status}`,
      count: item.count
    }));
  };

  // Generate data for the selected view mode
  const volumeTimeData = getVolumeTimeData();
  const endpointData = getEndpointData();
  const statusData = getStatusData();

  // Calculate request stats
  const totalRequests = metrics.length;
  const successCount = metrics.filter(req => req.status < 400).length;
  const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;
  const avgResponseTime = totalRequests > 0 
    ? Math.round(metrics.reduce((sum, req) => sum + req.duration, 0) / totalRequests) 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">API Requests</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          API request volume, duration, and success rates
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b border-gray-200">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Total Requests</div>
              <div className="text-2xl font-bold text-gray-900">{totalRequests}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Avg Response Time</div>
              <div className="text-2xl font-bold text-gray-900">{avgResponseTime}ms</div>
            </div>
          </div>
          
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'volumeTime' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('volumeTime')}
              >
                Volume Over Time
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'endpointTime' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('endpointTime')}
              >
                By Endpoint
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'status' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('status')}
              >
                Status Codes
              </button>
            </div>
          </div>
          
          <div className="p-4 h-80">
            {viewMode === 'volumeTime' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={volumeTimeData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formattedTime" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => `Time: ${label}`} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="Request Count" 
                    stroke="#3b82f6" 
                    fill="#93c5fd" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            
            {viewMode === 'endpointTime' && (
              <div className="overflow-x-auto h-full">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Endpoint</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Method</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Count</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Avg Duration</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {endpointData.map((endpoint, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-gray-900">{endpoint.path}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                            endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                            endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                            endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {endpoint.method}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{endpoint.count}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{endpoint.avgDuration}ms</td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm">
                          <span className={`${
                            endpoint.errorRate === 0 ? 'text-green-600' :
                            endpoint.errorRate < 5 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {endpoint.errorRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {viewMode === 'status' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name="Status Code Count" 
                    fill={(entry) => {
                      const status = parseInt(entry.name);
                      if (status < 300) return '#10b981'; // green
                      if (status < 400) return '#3b82f6'; // blue
                      if (status < 500) return '#f59e0b'; // yellow
                      return '#ef4444'; // red
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RequestsPanel;