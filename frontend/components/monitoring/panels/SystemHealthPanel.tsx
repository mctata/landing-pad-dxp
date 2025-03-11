'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';
import { fetchSystemHealth, generateMockSystemHealth, SystemMetric } from '@/lib/services/monitoringService';

interface SystemHealthPanelProps {
  timeRange: string;
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  });
};

const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ timeRange }) => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>('CPU Usage');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // In a real app, use fetchSystemHealth(timeRange) instead
        const data = generateMockSystemHealth(timeRange);
        setMetrics(data);
      } catch (error) {
        console.error('Error loading system health metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  // Get current values for each metric type
  const getCurrentValues = () => {
    const metricTypes = ['CPU Usage', 'Memory Usage', 'Request Rate', 'Error Rate'];
    const latestTimestamp = metrics.length > 0
      ? Math.max(...metrics.map(m => m.timestamp))
      : Date.now();
    
    return metricTypes.map(type => {
      // Find the latest value for this metric type
      const matchingMetrics = metrics.filter(m => m.name === type);
      const latestMetric = matchingMetrics.length > 0
        ? matchingMetrics.reduce((latest, current) => 
            current.timestamp > latest.timestamp ? current : latest, 
            matchingMetrics[0])
        : null;
      
      const unit = latestMetric?.unit || '';
      const value = latestMetric?.value || 0;
      
      // Determine status threshold based on metric type
      let status = 'healthy';
      if (type === 'CPU Usage' && value > 70) status = 'warning';
      if (type === 'CPU Usage' && value > 90) status = 'critical';
      if (type === 'Memory Usage' && value > 80) status = 'warning';
      if (type === 'Memory Usage' && value > 95) status = 'critical';
      if (type === 'Error Rate' && value > 5) status = 'warning';
      if (type === 'Error Rate' && value > 10) status = 'critical';
      
      return {
        name: type,
        value,
        unit,
        status
      };
    });
  };

  // Filter metrics by the selected metric type
  const filteredMetrics = metrics.filter(metric => metric.name === selectedMetric);
  
  // Format data for the chart
  const chartData = filteredMetrics.map(metric => ({
    timestamp: metric.timestamp,
    formattedTime: formatTimestamp(metric.timestamp),
    value: metric.value
  }));

  // Format data for the gauge chart
  const currentValues = getCurrentValues();
  const gaugeData = currentValues.map(metric => ({
    name: metric.name,
    value: metric.value,
    fill: metric.status === 'healthy' ? '#10b981' : 
          metric.status === 'warning' ? '#f59e0b' : '#ef4444'
  }));

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">System Health</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Server performance metrics and health indicators
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border-b border-gray-200">
            {currentValues.map((metric) => (
              <button
                key={metric.name}
                className={`p-3 rounded-lg border ${
                  selectedMetric === metric.name 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMetric(metric.name)}
              >
                <div className="text-xs text-gray-500 mb-1">{metric.name}</div>
                <div className={`text-lg font-semibold ${getStatusClass(metric.status)}`}>
                  {metric.value.toFixed(1)}{metric.unit}
                </div>
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formattedTime" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      `${value.toFixed(2)}${filteredMetrics[0]?.unit || ''}`,
                      selectedMetric
                    ]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={selectedMetric}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="20%" 
                  outerRadius="90%" 
                  barSize={20} 
                  data={gaugeData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    label={{ fill: '#666', position: 'insideStart' }}
                    background
                    dataKey="value"
                    nameKey="name"
                  />
                  <Legend 
                    iconSize={10} 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}${
                        currentValues.find(m => m.name === name)?.unit || ''
                      }`,
                      name
                    ]}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="px-4 py-4 border-t border-gray-200">
            <h4 className="text-base font-medium text-gray-900 mb-3">System Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-1">Server Status</div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <div className="text-sm font-medium">Operational</div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-1">Database Status</div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <div className="text-sm font-medium">Connected</div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-1">Cache Status</div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <div className="text-sm font-medium">Available</div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-1">Storage</div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="text-sm font-medium">75% Used</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemHealthPanel;