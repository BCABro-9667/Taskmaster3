'use client';

import { useCallback } from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import { getCache, setCache, clearCache, clearAllCache } from '@/lib/cache-utils';

export function useCache() {
  const { isOnline, isOnlineOnly, setIsOnlineOnly } = useOffline();

  const getCachedData = useCallback(<T>(key: string): T | null => {
    // If online-only mode is enabled, don't use cache
    if (isOnlineOnly) {
      return null;
    }
    
    return getCache<T>(key);
  }, [isOnlineOnly]);

  const setCachedData = useCallback(<T>(key: string, data: T): void => {
    // Only cache data when online
    if (isOnline) {
      setCache<T>(key, data);
    }
  }, [isOnline]);

  const clearCachedData = useCallback((key: string): void => {
    clearCache(key);
  }, []);

  const clearAllCachedData = useCallback((): void => {
    clearAllCache();
  }, []);

  return {
    isOnline,
    isOnlineOnly,
    setIsOnlineOnly,
    getCachedData,
    setCachedData,
    clearCachedData,
    clearAllCachedData,
  };
}