'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { fetchWebVitals, generateMockWebVitals, WebVitalMetric } from '@/lib/services/monitoringService';

interface WebVitalsPanelProps {
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

const WebVitalsPanel: React.FC<WebVitalsPanelProps> = ({ timeRange }) => {
  const [metrics, setMetrics] = useState<WebVitalMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<string>('LCP');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // In a real app, use fetchWebVitals(timeRange) instead
        const data = generateMockWebVitals(timeRange);
        setMetrics(data);
      } catch (error) {
        console.error('Error loading Web Vitals metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  const webVitalThresholds = {
    LCP: { good: 2500, needsImprovement: 4000 }, // milliseconds
    FID: { good: 100, needsImprovement: 300 },   // milliseconds
    CLS: { good: 0.1, needsImprovement: 0.25 },  // unitless
    FCP: { good: 1800, needsImprovement: 3000 }, // milliseconds
    TTFB: { good: 800, needsImprovement: 1800 }  // milliseconds
  };

  const getStatusColor = (name: string, value: number) => {
    if (!webVitalThresholds[name as keyof typeof webVitalThresholds]) return 'text-gray-600';
    
    const thresholds = webVitalThresholds[name as keyof typeof webVitalThresholds];
    
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.needsImprovement) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Filter metrics by the selected web vital
  const filteredMetrics = metrics.filter(metric => metric.name === activeMetric);

  // Format data for the chart
  const chartData = filteredMetrics.map(metric => ({
    timestamp: metric.timestamp,
    formattedTime: formatTimestamp(metric.timestamp),
    value: metric.value,
    path: metric.path
  }));

  // Calculate averages for each web vital type
  const averages = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = { sum: 0, count: 0 };
    }
    acc[metric.name].sum += metric.value;
    acc[metric.name].count += 1;
    return acc;
  }, {} as Record<string, { sum: number, count: number }>);

  const vitalLabels = {
    LCP: 'Largest Contentful Paint',
    FID: 'First Input Delay',
    CLS: 'Cumulative Layout Shift',
    FCP: 'First Contentful Paint',
    TTFB: 'Time to First Byte'
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Web Vitals</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Core Web Vitals performance metrics over time
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-4 border-b border-gray-200">
            {Object.keys(vitalLabels).map((metric) => {
              const average = averages[metric] 
                ? Number((averages[metric].sum / averages[metric].count).toFixed(metric === 'CLS' ? 3 : 0)) 
                : 0;
              
              const statusColor = getStatusColor(metric, average);
              
              return (
                <button
                  key={metric}
                  className={`p-3 rounded-lg border ${
                    activeMetric === metric 
                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveMetric(metric)}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {vitalLabels[metric as keyof typeof vitalLabels]}
                  </div>
                  <div className={`text-lg font-semibold ${statusColor}`}>
                    {metric === 'CLS' ? average : `${average}ms`}
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedTime" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={activeMetric === 'CLS' ? [0, 'auto'] : ['auto', 'auto']}
                  tickFormatter={(value) => activeMetric === 'CLS' ? value.toFixed(2) : `${value}ms`}
                />
                <Tooltip 
                  formatter={(value: number) => [
                    activeMetric === 'CLS' ? value.toFixed(3) : `${value}ms`,
                    activeMetric
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={vitalLabels[activeMetric as keyof typeof vitalLabels]}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default WebVitalsPanel;