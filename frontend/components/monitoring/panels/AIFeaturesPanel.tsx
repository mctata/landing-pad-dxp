'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { fetchAIMetrics, generateMockAIMetrics, AIMetric } from '@/lib/services/monitoringService';

interface AIFeaturesPanelProps {
  timeRange: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  });
};

const AIFeaturesPanel: React.FC<AIFeaturesPanelProps> = ({ timeRange }) => {
  const [metrics, setMetrics] = useState<AIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'usage' | 'performance' | 'success'>('usage');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // In a real app, use fetchAIMetrics(timeRange) instead
        const data = generateMockAIMetrics(timeRange);
        setMetrics(data);
      } catch (error) {
        console.error('Error loading AI metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  // Calculate AI feature usage by feature type
  const getFeatureUsageData = () => {
    return metrics.reduce((acc, metric) => {
      const existingFeature = acc.find(item => item.name === metric.feature);
      if (existingFeature) {
        existingFeature.count++;
      } else {
        acc.push({ name: metric.feature, count: 1 });
      }
      return acc;
    }, [] as { name: string; count: number }[]);
  };

  // Calculate AI performance (average duration) by feature
  const getPerformanceData = () => {
    const featureDurations = metrics.reduce((acc, metric) => {
      if (!acc[metric.feature]) {
        acc[metric.feature] = { totalDuration: 0, count: 0 };
      }
      acc[metric.feature].totalDuration += metric.duration;
      acc[metric.feature].count++;
      return acc;
    }, {} as Record<string, { totalDuration: number; count: number }>);

    return Object.entries(featureDurations).map(([feature, data]) => ({
      name: feature,
      avgDuration: Math.round(data.totalDuration / data.count)
    }));
  };

  // Calculate success rate data
  const getSuccessRateData = () => {
    const featureOutcomes = metrics.reduce((acc, metric) => {
      if (!acc[metric.feature]) {
        acc[metric.feature] = { success: 0, failure: 0, total: 0 };
      }
      if (metric.success) {
        acc[metric.feature].success++;
      } else {
        acc[metric.feature].failure++;
      }
      acc[metric.feature].total++;
      return acc;
    }, {} as Record<string, { success: number; failure: number; total: number }>);

    return Object.entries(featureOutcomes).map(([feature, data]) => ({
      name: feature,
      successRate: (data.success / data.total) * 100,
      successCount: data.success,
      failureCount: data.failure
    }));
  };

  // Get usage over time data
  const getUsageOverTimeData = () => {
    if (metrics.length === 0) return [];
    
    // Sort metrics by timestamp
    const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);
    
    // Group metrics by time interval (hourly for short ranges, daily for longer ranges)
    const isShortRange = timeRange === '6h' || timeRange === '24h';
    const intervalMs = isShortRange ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 hour or 1 day
    
    const timeIntervals: { [key: string]: { timestamp: number; counts: Record<string, number> } } = {};
    
    sortedMetrics.forEach(metric => {
      const intervalTimestamp = Math.floor(metric.timestamp / intervalMs) * intervalMs;
      const timeKey = intervalTimestamp.toString();
      
      if (!timeIntervals[timeKey]) {
        timeIntervals[timeKey] = { 
          timestamp: intervalTimestamp,
          counts: {}
        };
      }
      
      if (!timeIntervals[timeKey].counts[metric.feature]) {
        timeIntervals[timeKey].counts[metric.feature] = 0;
      }
      
      timeIntervals[timeKey].counts[metric.feature]++;
    });
    
    // Convert to array format for chart
    return Object.values(timeIntervals).map(interval => ({
      timestamp: interval.timestamp,
      formattedTime: formatTimestamp(interval.timestamp),
      ...interval.counts
    }));
  };

  // Generate data based on selected view
  const featureUsageData = getFeatureUsageData();
  const performanceData = getPerformanceData();
  const successRateData = getSuccessRateData();
  const usageOverTimeData = getUsageOverTimeData();

  // Calculate overall stats
  const totalAIRequests = metrics.length;
  const successfulRequests = metrics.filter(m => m.success).length;
  const overallSuccessRate = totalAIRequests > 0 ? (successfulRequests / totalAIRequests) * 100 : 0;
  const avgDuration = totalAIRequests > 0 
    ? Math.round(metrics.reduce((sum, m) => sum + m.duration, 0) / totalAIRequests) 
    : 0;

  // Get unique AI features from the data
  const aiFeatures = [...new Set(metrics.map(m => m.feature))];
  
  // Use distinct colors for timeline chart
  const featureColors: Record<string, string> = {};
  aiFeatures.forEach((feature, index) => {
    featureColors[feature] = COLORS[index % COLORS.length];
  });

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">AI Features</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          AI usage statistics and performance metrics
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
              <div className="text-sm text-gray-500">Total AI Requests</div>
              <div className="text-2xl font-bold text-gray-900">{totalAIRequests}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">{overallSuccessRate.toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Avg Response Time</div>
              <div className="text-2xl font-bold text-gray-900">{avgDuration}ms</div>
            </div>
          </div>
          
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'usage' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('usage')}
              >
                Usage
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'performance' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('performance')}
              >
                Performance
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === 'success' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('success')}
              >
                Success Rate
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {viewMode === 'usage' && (
              <>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={featureUsageData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {featureUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} requests`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={usageOverTimeData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="formattedTime" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {aiFeatures.map((feature, index) => (
                        <Line
                          key={feature}
                          type="monotone"
                          dataKey={feature}
                          name={feature}
                          stroke={featureColors[feature]}
                          activeDot={{ r: 8 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
            
            {viewMode === 'performance' && (
              <div className="h-80 col-span-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 12 }}
                      width={150}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} ms`, 'Average Duration']}
                    />
                    <Legend />
                    <Bar 
                      dataKey="avgDuration" 
                      name="Average Duration (ms)" 
                      fill="#3b82f6" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {viewMode === 'success' && (
              <>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={successRateData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Success Rate']} />
                      <Legend />
                      <Bar 
                        dataKey="successRate" 
                        name="Success Rate (%)" 
                        fill="#10b981" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={successRateData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      stackOffset="sign"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="successCount" 
                        name="Successful" 
                        stackId="a" 
                        fill="#10b981" 
                      />
                      <Bar 
                        dataKey="failureCount" 
                        name="Failed" 
                        stackId="a" 
                        fill="#ef4444" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
          
          <div className="px-4 py-4 border-t border-gray-200">
            <h4 className="text-base font-medium text-gray-900 mb-3">Feature Details</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Usage Count</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Avg Duration</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {aiFeatures.map((feature) => {
                    const usageCount = featureUsageData.find(d => d.name === feature)?.count || 0;
                    const avgDuration = performanceData.find(d => d.name === feature)?.avgDuration || 0;
                    const successRate = successRateData.find(d => d.name === feature)?.successRate || 0;
                    
                    return (
                      <tr key={feature}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{feature}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{usageCount}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{avgDuration}ms</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`${
                            successRate > 95 ? 'text-green-600' :
                            successRate > 80 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {successRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIFeaturesPanel;