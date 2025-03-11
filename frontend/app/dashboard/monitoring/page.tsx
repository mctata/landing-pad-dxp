'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard';
import MetricsSelector from '@/components/monitoring/MetricsSelector';
import { TimeRangeSelector } from '@/components/monitoring/TimeRangeSelector';

export default function MonitoringPage() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['webVitals', 'errors', 'requests']);
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedMetrics, timeRange]);

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">System Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track performance metrics and system health across your application.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="md:w-2/3">
            <MetricsSelector 
              selectedMetrics={selectedMetrics}
              onChange={setSelectedMetrics}
            />
          </div>
          <div className="md:w-1/3">
            <TimeRangeSelector
              value={timeRange}
              onChange={setTimeRange}
            />
          </div>
        </div>

        <MonitoringDashboard 
          isLoading={isLoading}
          selectedMetrics={selectedMetrics}
          timeRange={timeRange}
        />
      </div>
    </DashboardLayout>
  );
}