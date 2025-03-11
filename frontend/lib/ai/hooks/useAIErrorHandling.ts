/**
 * useAIErrorHandling - Custom hook for AI operation error handling
 * 
 * This hook provides comprehensive error handling for AI operations:
 * - Categorises errors by type (network, API, resource, etc.)
 * - Provides user-friendly error messages
 * - Supports retry functionality with exponential backoff
 * - Tracks error metrics for analytics
 */

import { useState, useCallback } from 'react';

// Error categories for AI operations
export enum AIErrorType {
  NETWORK = 'network',
  API_UNAVAILABLE = 'api_unavailable',
  INVALID_REQUEST = 'invalid_request',
  CONTENT_POLICY = 'content_policy',
  RATE_LIMIT = 'rate_limit',
  RESOURCE_EXHAUSTED = 'resource_exhausted',
  UNKNOWN = 'unknown'
}

// Error details
export interface AIError {
  type: AIErrorType;
  message: string;
  code?: string;
  retryable: boolean;
  originalError?: any;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 15000 // 15 seconds
};

export function useAIErrorHandling() {
  // Error state
  const [currentError, setCurrentError] = useState<AIError | null>(null);
  
  // Retry counter
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // Error counts for analytics
  const [errorCounts, setErrorCounts] = useState<Record<AIErrorType, number>>({
    [AIErrorType.NETWORK]: 0,
    [AIErrorType.API_UNAVAILABLE]: 0,
    [AIErrorType.INVALID_REQUEST]: 0,
    [AIErrorType.CONTENT_POLICY]: 0,
    [AIErrorType.RATE_LIMIT]: 0,
    [AIErrorType.RESOURCE_EXHAUSTED]: 0,
    [AIErrorType.UNKNOWN]: 0
  });

  /**
   * Categorise an error based on its characteristics
   */
  const categoriseError = useCallback((error: any): AIError => {
    // Network errors
    if (!navigator.onLine || error.message?.includes('network') || error.message?.includes('connection')) {
      return {
        type: AIErrorType.NETWORK,
        message: 'Network connection issue. Please check your internet connection.',
        retryable: true,
        originalError: error
      };
    }

    // Handle API response errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle different status codes
      switch (status) {
        case 400:
          return {
            type: AIErrorType.INVALID_REQUEST,
            message: 'The request was invalid. Please check your inputs.',
            code: data?.code,
            retryable: false,
            originalError: error
          };
        case 403:
          if (data?.code === 'content_policy_violation') {
            return {
              type: AIErrorType.CONTENT_POLICY,
              message: 'Your request contained content that violates our content policy.',
              code: data?.code,
              retryable: false,
              originalError: error
            };
          }
          break;
        case 429:
          return {
            type: AIErrorType.RATE_LIMIT,
            message: 'You\'ve reached the rate limit. Please try again later.',
            code: 'rate_limit_exceeded',
            retryable: true,
            originalError: error
          };
        case 503:
          return {
            type: AIErrorType.API_UNAVAILABLE,
            message: 'The AI service is temporarily unavailable. Please try again later.',
            retryable: true,
            originalError: error
          };
        case 507:
          return {
            type: AIErrorType.RESOURCE_EXHAUSTED,
            message: 'Your AI usage quota has been exhausted for this period.',
            retryable: false,
            originalError: error
          };
      }
    }

    // Default to unknown error
    return {
      type: AIErrorType.UNKNOWN,
      message: error.message || 'An unexpected error occurred with the AI service.',
      retryable: true,
      originalError: error
    };
  }, []);

  /**
   * Handle an error, categorise it, and update error state
   */
  const handleError = useCallback((error: any): AIError => {
    const categorisedError = categoriseError(error);
    
    // Update error state
    setCurrentError(categorisedError);
    
    // Track error for analytics
    setErrorCounts(prev => ({
      ...prev,
      [categorisedError.type]: prev[categorisedError.type] + 1
    }));
    
    return categorisedError;
  }, [categoriseError]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setCurrentError(null);
    setRetryCount(0);
  }, []);

  /**
   * Determine if we should retry based on error type and retry count
   */
  const shouldRetry = useCallback((
    error: AIError, 
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): boolean => {
    return error.retryable && retryCount < retryConfig.maxRetries;
  }, [retryCount]);

  /**
   * Calculate backoff delay for retry
   */
  const getRetryDelay = useCallback((
    retryCount: number,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): number => {
    // Exponential backoff with jitter
    const exponentialDelay = retryConfig.baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    return Math.min(exponentialDelay + jitter, retryConfig.maxDelay);
  }, []);

  /**
   * Retry the operation with backoff
   */
  const retryOperation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
    ): Promise<T> => {
      try {
        // Reset state for new operation
        clearError();
        
        // Attempt the operation
        return await operation();
      } catch (error) {
        // Handle and categorise the error
        const aiError = handleError(error);
        
        // Check if we should retry
        if (shouldRetry(aiError, retryConfig)) {
          // Increment retry counter
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          
          // Calculate delay based on retry count
          const delay = getRetryDelay(newRetryCount, retryConfig);
          
          // Wait for the calculated delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the operation
          return retryOperation(operation, retryConfig);
        }
        
        // If we shouldn't retry or have exhausted retries, throw the error
        throw aiError;
      }
    },
    [clearError, handleError, shouldRetry, getRetryDelay, retryCount]
  );

  /**
   * Get user-friendly message for the current error
   */
  const getUserFriendlyErrorMessage = useCallback((error: AIError | null = currentError): string => {
    if (!error) return '';
    
    // Default messages for different error types
    switch (error.type) {
      case AIErrorType.NETWORK:
        return 'Please check your internet connection and try again.';
      case AIErrorType.API_UNAVAILABLE:
        return 'Our AI service is taking a short break. Please try again in a few moments.';
      case AIErrorType.RATE_LIMIT:
        return 'You\'ve made too many requests in a short time. Please wait a minute before trying again.';
      case AIErrorType.CONTENT_POLICY:
        return 'Your request couldn\'t be processed due to content policy restrictions.';
      case AIErrorType.RESOURCE_EXHAUSTED:
        return 'You\'ve reached your AI usage limit for this period. Please upgrade your plan or try again later.';
      case AIErrorType.INVALID_REQUEST:
        return 'There was a problem with your request. Please check your inputs and try again.';
      case AIErrorType.UNKNOWN:
      default:
        return 'Something unexpected happened. Please try again or contact support if the issue persists.';
    }
  }, [currentError]);

  return {
    currentError,
    errorCounts,
    handleError,
    clearError,
    retryOperation,
    getUserFriendlyErrorMessage
  };
}
