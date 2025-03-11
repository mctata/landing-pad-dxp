import React from 'react';

interface MetricsSelectorProps {
  selectedMetrics: string[];
  onChange: (metrics: string[]) => void;
}

const availableMetrics = [
  { id: 'webVitals', name: 'Web Vitals', description: 'Core web performance metrics (FCP, LCP, CLS, etc.)' },
  { id: 'requests', name: 'API Requests', description: 'API request volume, duration and success rates' },
  { id: 'errors', name: 'Errors', description: 'Application errors by type, source and frequency' },
  { id: 'system', name: 'System Health', description: 'Server health metrics (CPU, Memory, etc.)' },
  { id: 'ai', name: 'AI Features', description: 'AI generation usage and performance' },
];

const MetricsSelector: React.FC<MetricsSelectorProps> = ({ selectedMetrics, onChange }) => {
  const toggleMetric = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      onChange(selectedMetrics.filter(id => id !== metricId));
    } else {
      onChange([...selectedMetrics, metricId]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Metrics Categories</h3>
      <div className="space-y-2">
        {availableMetrics.map((metric) => (
          <div key={metric.id} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id={`metric-${metric.id}`}
                type="checkbox"
                checked={selectedMetrics.includes(metric.id)}
                onChange={() => toggleMetric(metric.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor={`metric-${metric.id}`} className="font-medium text-gray-700">
                {metric.name}
              </label>
              <p className="text-gray-500">{metric.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricsSelector;