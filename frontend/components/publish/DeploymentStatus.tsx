'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export interface DeploymentStatusProps {
  websiteId: string;
  deploymentId?: string;
  initialStatus?: 'queued' | 'building' | 'deploying' | 'success' | 'failed' | 'canceled';
  onComplete?: (success: boolean) => void;
}

export function DeploymentStatus({
  websiteId,
  deploymentId,
  initialStatus = 'queued',
  onComplete,
}: DeploymentStatusProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Simulate deployment status updates
  useEffect(() => {
    if (!deploymentId) return;
    
    // In a real app, this would be a WebSocket or polling API call
    // For now, we'll just simulate the deployment process
    const simulateDeployment = () => {
      // Reset state
      setStatus('queued');
      setProgress(0);
      setError(null);
      setLogs(['Initializing deployment...']);
      
      const steps = [
        { status: 'queued', message: 'Deployment queued, waiting for resources...', progress: 5 },
        { status: 'building', message: 'Building website...', progress: 20 },
        { status: 'building', message: 'Compiling assets...', progress: 30 },
        { status: 'building', message: 'Optimizing for production...', progress: 50 },
        { status: 'deploying', message: 'Deploying to CDN...', progress: 70 },
        { status: 'deploying', message: 'Configuring domain settings...', progress: 85 },
        { status: 'deploying', message: 'Running final checks...', progress: 95 },
        { status: 'success', message: 'Deployment completed successfully!', progress: 100 },
      ];
      
      let currentStep = 0;
      
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          const step = steps[currentStep];
          setStatus(step.status);
          setProgress(step.progress);
          setLogs(prev => [...prev, step.message]);
          currentStep++;
        } else {
          clearInterval(interval);
          if (onComplete) onComplete(true);
        }
      }, 1500);
      
      return () => clearInterval(interval);
    };
    
    const timer = setTimeout(simulateDeployment, 500);
    return () => clearTimeout(timer);
  }, [deploymentId, onComplete]);

  // Helper functions to render status badge
  const getStatusBadgeClasses = () => {
    switch (status) {
      case 'queued':
        return 'bg-secondary-100 text-secondary-800';
      case 'building':
      case 'deploying':
        return 'bg-primary-100 text-primary-800';
      case 'success':
        return 'bg-success-100 text-success-800';
      case 'failed':
      case 'canceled':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses()}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <span className="text-sm text-secondary-500">
            Deployment ID: {deploymentId || 'N/A'}
          </span>
        </div>
        
        {status === 'building' || status === 'deploying' ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setStatus('canceled');
              setError('Deployment canceled by user');
              if (onComplete) onComplete(false);
            }}
          >
            Cancel
          </Button>
        ) : null}
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-secondary-200 rounded-full h-2.5">
        <div 
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Deployment logs */}
      <div className="mt-4 bg-secondary-900 text-white rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-secondary-800">
          <h3 className="text-sm font-medium">Deployment Logs</h3>
          <span className="text-xs text-secondary-400">{logs.length} entries</span>
        </div>
        <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-1">
          {logs.map((log, index) => (
            <div key={index} className="flex">
              <span className="text-secondary-500 mr-2">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
          
          {error && (
            <div className="flex text-error-400">
              <span className="text-error-500 mr-2">&gt;</span>
              <span>{error}</span>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex text-success-400 font-semibold">
              <span className="text-success-500 mr-2">&gt;</span>
              <span>Deployment completed successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
