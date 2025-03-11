'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { fetchErrors, generateMockErrors, ErrorMetric } from '@/lib/services/monitoringService';

interface ErrorsPanelProps {
  timeRange: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

const ErrorsPanel: React.FC<ErrorsPanelProps> = ({ timeRange }) => {
  const [metrics, setMetrics] = useState<ErrorMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'type' | 'path'>('type');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // In a real app, use fetchErrors(timeRange) instead
        const data = generateMockErrors(timeRange);
        setMetrics(data);
      } catch (error) {
        console.error('Error loading error metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  // Format data for the chart based on error type
  const typeData = metrics.reduce((acc, error) => {
    const existingItem = acc.find(item => item.name === error.type);
    if (existingItem) {
      existingItem.count += error.count;
    } else {
      acc.push({ name: error.type, count: error.count });
    }
    return acc;
  }, [] as { name: string; count: number }[]);

  // Format data for the chart based on path
  const pathData = metrics.reduce((acc, error) => {
    const path = error.path || 'Unknown';
    const existingItem = acc.find(item => item.name === path);
    if (existingItem) {
      existingItem.count += error.count;
    } else {
      acc.push({ name: path, count: error.count });
    }
    return acc;
  }, [] as { name: string; count: number }[]);

  // Format data for the browser chart
  const browserData = metrics.reduce((acc, error) => {
    const browser = error.browser || 'Unknown';
    const existingItem = acc.find(item => item.name === browser);
    if (existingItem) {
      existingItem.count += error.count;
    } else {
      acc.push({ name: browser, count: error.count });
    }
    return acc;
  }, [] as { name: string; count: number }[]);

  // Calculate the total error count
  const totalErrors = metrics.reduce((sum, error) => sum + error.count, 0);

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    
    if (diffMs < 60000) { // Less than a minute
      return 'Just now';
    } else if (diffMs < 3600000) { // Less than an hour
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffMs < 86400000) { // Less than a day
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMs / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Error Tracking</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Application errors by type, location, and frequency
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-gray-900">{totalErrors}</div>
              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === 'type' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                  onClick={() => setViewMode('type')}
                >
                  By Type
                </button>
                <button
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === 'path' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                  onClick={() => setViewMode('path')}
                >
                  By Route
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={viewMode === 'type' ? typeData : pathData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Error Count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={browserData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {browserData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} errors`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
            <h4 className="text-base font-medium text-gray-900 mb-3">Recent Errors</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Message</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Count</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Occurred</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {metrics.sort((a, b) => b.lastOccurred - a.lastOccurred).slice(0, 5).map((error, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{error.type}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{error.message}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{error.count}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatRelativeTime(error.lastOccurred)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ErrorsPanel;