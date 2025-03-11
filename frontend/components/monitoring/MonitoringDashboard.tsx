import React from 'react';
import WebVitalsPanel from './panels/WebVitalsPanel';
import ErrorsPanel from './panels/ErrorsPanel';
import RequestsPanel from './panels/RequestsPanel';
import SystemHealthPanel from './panels/SystemHealthPanel';
import AIFeaturesPanel from './panels/AIFeaturesPanel';

interface MonitoringDashboardProps {
  isLoading: boolean;
  selectedMetrics: string[];
  timeRange: string;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64 w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  isLoading,
  selectedMetrics,
  timeRange,
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (selectedMetrics.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">Please select at least one metric category to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedMetrics.includes('webVitals') && (
        <WebVitalsPanel timeRange={timeRange} />
      )}
      
      {selectedMetrics.includes('errors') && (
        <ErrorsPanel timeRange={timeRange} />
      )}
      
      {selectedMetrics.includes('requests') && (
        <RequestsPanel timeRange={timeRange} />
      )}
      
      {selectedMetrics.includes('system') && (
        <SystemHealthPanel timeRange={timeRange} />
      )}
      
      {selectedMetrics.includes('ai') && (
        <AIFeaturesPanel timeRange={timeRange} />
      )}
    </div>
  );
};

export default MonitoringDashboard;