/**
 * useAIAnalytics - Custom hook for tracking AI feature usage
 * 
 * This hook provides analytics tracking functionality for AI features:
 * - Tracks AI feature usage (content generation, suggestions, editing)
 * - Measures suggestion acceptance rates
 * - Records performance metrics (response times, error rates)
 * - Captures user engagement with AI features
 */

import { useState, useCallback, useEffect } from 'react';
import { AIErrorType } from './useAIErrorHandling';

// AI Event types for analytics
export enum AIEventType {
  CONTENT_GENERATION = 'ai_content_generation',
  SUGGESTION_GENERATION = 'ai_suggestion_generation',
  CONTENT_MODIFICATION = 'ai_content_modification',
  SUGGESTION_ACCEPTED = 'ai_suggestion_accepted',
  SUGGESTION_REJECTED = 'ai_suggestion_rejected',
  ERROR_OCCURRED = 'ai_error_occurred'
}

// Event data interface
export interface AIEventData {
  eventType: AIEventType;
  timestamp: number;
  duration?: number;
  elementType?: string;
  operation?: string;
  promptLength?: number;
  responseLength?: number;
  errorType?: AIErrorType;
  suggestionType?: string;
  suggestionId?: string;
  websiteId?: string;
  pageId?: string;
  [key: string]: any; // Allow for additional custom properties
}

interface AnalyticsConfig {
  enabled: boolean;
  trackingEndpoint?: string;
  batchInterval?: number; // in milliseconds
  batchSize?: number;
  autoFlush?: boolean;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  batchInterval: 30000, // 30 seconds
  batchSize: 10,
  autoFlush: true
};

export function useAIAnalytics(config: Partial<AnalyticsConfig> = {}) {
  // Combine default config with provided config
  const mergedConfig: AnalyticsConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Event queue for batching
  const [eventQueue, setEventQueue] = useState<AIEventData[]>([]);
  
  // Metrics tracking
  const [metrics, setMetrics] = useState({
    contentGenerationCount: 0,
    suggestionGenerationCount: 0,
    contentModificationCount: 0,
    suggestionsAccepted: 0,
    suggestionsRejected: 0,
    errorCount: 0,
    averageGenerationTime: 0,
    acceptanceRate: 0
  });

  // Operation timers to measure duration
  const [operationTimers, setOperationTimers] = useState<Record<string, number>>({});

  /**
   * Start timing an operation
   */
  const startTiming = useCallback((operationId: string): void => {
    setOperationTimers(prev => ({
      ...prev,
      [operationId]: Date.now()
    }));
  }, []);

  /**
   * Stop timing an operation and get duration
   */
  const stopTiming = useCallback((operationId: string): number => {
    const startTime = operationTimers[operationId];
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime;
    
    // Clean up the timer
    setOperationTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[operationId];
      return newTimers;
    });
    
    return duration;
  }, [operationTimers]);

  /**
   * Add an event to the queue
   */
  const trackEvent = useCallback((eventData: Omit<AIEventData, 'timestamp'>): void => {
    if (!mergedConfig.enabled) return;
    
    const fullEventData: AIEventData = {
      ...eventData,
      timestamp: Date.now()
    };
    
    setEventQueue(prev => [...prev, fullEventData]);
    
    // Update metrics
    setMetrics(prev => {
      const newMetrics = { ...prev };
      
      switch (eventData.eventType) {
        case AIEventType.CONTENT_GENERATION:
          newMetrics.contentGenerationCount++;
          if (eventData.duration) {
            newMetrics.averageGenerationTime = 
              (prev.averageGenerationTime * (prev.contentGenerationCount - 1) + eventData.duration) / 
              prev.contentGenerationCount;
          }
          break;
        case AIEventType.SUGGESTION_GENERATION:
          newMetrics.suggestionGenerationCount++;
          break;
        case AIEventType.CONTENT_MODIFICATION:
          newMetrics.contentModificationCount++;
          break;
        case AIEventType.SUGGESTION_ACCEPTED:
          newMetrics.suggestionsAccepted++;
          newMetrics.acceptanceRate = 
            newMetrics.suggestionsAccepted / 
            (newMetrics.suggestionsAccepted + newMetrics.suggestionsRejected);
          break;
        case AIEventType.SUGGESTION_REJECTED:
          newMetrics.suggestionsRejected++;
          newMetrics.acceptanceRate = 
            newMetrics.suggestionsAccepted / 
            (newMetrics.suggestionsAccepted + newMetrics.suggestionsRejected);
          break;
        case AIEventType.ERROR_OCCURRED:
          newMetrics.errorCount++;
          break;
      }
      
      return newMetrics;
    });
  }, [mergedConfig.enabled]);

  /**
   * Track a content generation event
   */
  const trackContentGeneration = useCallback((
    params: any,
    duration: number,
    success: boolean,
    errorType?: AIErrorType
  ): void => {
    trackEvent({
      eventType: success ? AIEventType.CONTENT_GENERATION : AIEventType.ERROR_OCCURRED,
      elementType: params.elementType,
      promptLength: params.prompt?.length || 0,
      duration,
      websiteId: params.websiteId,
      pageId: params.pageId,
      errorType: !success ? errorType : undefined
    });
  }, [trackEvent]);

  /**
   * Track a suggestion generation event
   */
  const trackSuggestionGeneration = useCallback((
    websiteId: string,
    pageId: string,
    type: string,
    prompt: string,
    duration: number,
    count: number,
    success: boolean,
    errorType?: AIErrorType
  ): void => {
    trackEvent({
      eventType: success ? AIEventType.SUGGESTION_GENERATION : AIEventType.ERROR_OCCURRED,
      suggestionType: type,
      promptLength: prompt.length,
      suggestionsCount: count,
      duration,
      websiteId,
      pageId,
      errorType: !success ? errorType : undefined
    });
  }, [trackEvent]);

  /**
   * Track a content modification event
   */
  const trackContentModification = useCallback((
    content: string,
    action: string,
    parameters: any,
    duration: number,
    success: boolean,
    errorType?: AIErrorType
  ): void => {
    trackEvent({
      eventType: success ? AIEventType.CONTENT_MODIFICATION : AIEventType.ERROR_OCCURRED,
      operation: action,
      contentLength: content.length,
      parameters,
      duration,
      errorType: !success ? errorType : undefined
    });
  }, [trackEvent]);

  /**
   * Track a suggestion acceptance event
   */
  const trackSuggestionAccepted = useCallback((
    suggestionId: string,
    suggestionType: string,
    websiteId?: string,
    pageId?: string
  ): void => {
    trackEvent({
      eventType: AIEventType.SUGGESTION_ACCEPTED,
      suggestionId,
      suggestionType,
      websiteId,
      pageId
    });
  }, [trackEvent]);

  /**
   * Track a suggestion rejection event
   */
  const trackSuggestionRejected = useCallback((
    suggestionId: string,
    suggestionType: string,
    websiteId?: string,
    pageId?: string
  ): void => {
    trackEvent({
      eventType: AIEventType.SUGGESTION_REJECTED,
      suggestionId,
      suggestionType,
      websiteId,
      pageId
    });
  }, [trackEvent]);

  /**
   * Send events to the tracking endpoint
   */
  const flushEvents = useCallback(async (): Promise<boolean> => {
    if (!mergedConfig.enabled || eventQueue.length === 0 || !mergedConfig.trackingEndpoint) {
      return false;
    }
    
    try {
      // Clone the current queue
      const eventsToSend = [...eventQueue];
      
      // Clear the queue
      setEventQueue([]);
      
      // Send the events to the tracking endpoint
      await fetch(mergedConfig.trackingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events: eventsToSend })
      });
      
      return true;
    } catch (error) {
      // Put the events back in the queue
      setEventQueue(prev => [...eventsToSend, ...prev]);
      console.error('Failed to send analytics events:', error);
      return false;
    }
  }, [mergedConfig.enabled, mergedConfig.trackingEndpoint, eventQueue]);

  // Auto-flush events when the queue reaches the batch size
  useEffect(() => {
    if (mergedConfig.autoFlush && eventQueue.length >= (mergedConfig.batchSize || 10)) {
      flushEvents();
    }
  }, [eventQueue, mergedConfig.autoFlush, mergedConfig.batchSize, flushEvents]);

  // Set up interval for flushing events
  useEffect(() => {
    if (!mergedConfig.autoFlush || !mergedConfig.batchInterval) return;

    const intervalId = setInterval(() => {
      if (eventQueue.length > 0) {
        flushEvents();
      }
    }, mergedConfig.batchInterval);

    return () => clearInterval(intervalId);
  }, [mergedConfig.autoFlush, mergedConfig.batchInterval, eventQueue.length, flushEvents]);

  return {
    trackEvent,
    startTiming,
    stopTiming,
    trackContentGeneration,
    trackSuggestionGeneration,
    trackContentModification,
    trackSuggestionAccepted,
    trackSuggestionRejected,
    flushEvents,
    metrics,
    eventQueue
  };
}
