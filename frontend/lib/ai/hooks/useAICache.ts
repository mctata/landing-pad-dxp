/**
 * useAICache - Custom hook for caching AI-generated content and suggestions
 * 
 * This hook provides caching functionality for AI-generated content to:
 * - Reduce redundant API calls for identical requests
 * - Improve perceived performance
 * - Save on API usage costs
 */

import { useState, useCallback } from 'react';

// Type definitions for cache keys and entries
type ContentKey = string;
type SuggestionKey = string;
type CachedContent = {
  content: any;
  timestamp: number;
  expiresAt: number;
};

// Cache expiration time in milliseconds (default: 5 minutes)
const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000;

export function useAICache(expiryTime = DEFAULT_CACHE_EXPIRY) {
  // Content cache: stores generated content
  const [contentCache, setContentCache] = useState<Record<ContentKey, CachedContent>>({});
  
  // Suggestions cache: stores generated suggestions
  const [suggestionCache, setSuggestionCache] = useState<Record<SuggestionKey, CachedContent>>({});

  /**
   * Generate a cache key for content based on request parameters
   */
  const getContentCacheKey = useCallback((params: any): ContentKey => {
    const keyParts = [
      params.websiteId || 'default',
      params.pageId || 'default',
      params.elementType || 'generic',
      params.prompt || '',
      params.tone || 'default',
      params.length || 'medium'
    ];
    return keyParts.join('::');
  }, []);

  /**
   * Generate a cache key for suggestions based on request parameters
   */
  const getSuggestionCacheKey = useCallback(
    (websiteId: string, pageId: string, type: string, prompt: string): SuggestionKey => {
      return `${websiteId}::${pageId}::${type}::${prompt}`;
    },
    []
  );

  /**
   * Check if the cached entry is still valid (not expired)
   */
  const isValidCacheEntry = useCallback(
    (entry: CachedContent): boolean => {
      return Date.now() < entry.expiresAt;
    },
    []
  );

  /**
   * Get content from cache if available and not expired
   */
  const getCachedContent = useCallback(
    (params: any): { hit: boolean; content: any | null } => {
      const key = getContentCacheKey(params);
      const cachedEntry = contentCache[key];

      if (cachedEntry && isValidCacheEntry(cachedEntry)) {
        return { hit: true, content: cachedEntry.content };
      }

      return { hit: false, content: null };
    },
    [contentCache, getContentCacheKey, isValidCacheEntry]
  );

  /**
   * Get suggestions from cache if available and not expired
   */
  const getCachedSuggestions = useCallback(
    (websiteId: string, pageId: string, type: string, prompt: string): { hit: boolean; suggestions: any[] | null } => {
      const key = getSuggestionCacheKey(websiteId, pageId, type, prompt);
      const cachedEntry = suggestionCache[key];

      if (cachedEntry && isValidCacheEntry(cachedEntry)) {
        return { hit: true, suggestions: cachedEntry.content };
      }

      return { hit: false, suggestions: null };
    },
    [suggestionCache, getSuggestionCacheKey, isValidCacheEntry]
  );

  /**
   * Cache generated content with expiry time
   */
  const cacheContent = useCallback(
    (params: any, content: any): void => {
      const key = getContentCacheKey(params);
      const now = Date.now();
      
      setContentCache((prevCache) => ({
        ...prevCache,
        [key]: {
          content,
          timestamp: now,
          expiresAt: now + expiryTime
        }
      }));
    },
    [getContentCacheKey, expiryTime]
  );

  /**
   * Cache generated suggestions with expiry time
   */
  const cacheSuggestions = useCallback(
    (websiteId: string, pageId: string, type: string, prompt: string, suggestions: any[]): void => {
      const key = getSuggestionCacheKey(websiteId, pageId, type, prompt);
      const now = Date.now();
      
      setSuggestionCache((prevCache) => ({
        ...prevCache,
        [key]: {
          content: suggestions,
          timestamp: now,
          expiresAt: now + expiryTime
        }
      }));
    },
    [getSuggestionCacheKey, expiryTime]
  );

  /**
   * Clear expired cache entries
   */
  const clearExpiredCache = useCallback((): void => {
    const now = Date.now();
    
    setContentCache((prevCache) => {
      const newCache = { ...prevCache };
      let hasChanges = false;
      
      for (const key in newCache) {
        if (newCache[key].expiresAt < now) {
          delete newCache[key];
          hasChanges = true;
        }
      }
      
      return hasChanges ? newCache : prevCache;
    });
    
    setSuggestionCache((prevCache) => {
      const newCache = { ...prevCache };
      let hasChanges = false;
      
      for (const key in newCache) {
        if (newCache[key].expiresAt < now) {
          delete newCache[key];
          hasChanges = true;
        }
      }
      
      return hasChanges ? newCache : prevCache;
    });
  }, []);

  /**
   * Clear all cached data
   */
  const clearAllCache = useCallback((): void => {
    setContentCache({});
    setSuggestionCache({});
  }, []);

  return {
    getCachedContent,
    getCachedSuggestions,
    cacheContent,
    cacheSuggestions,
    clearExpiredCache,
    clearAllCache
  };
}
