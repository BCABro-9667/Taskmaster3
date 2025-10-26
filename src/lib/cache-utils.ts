// Utility functions for caching data in localStorage

const CACHE_PREFIX = 'taskmaster_cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache expiry

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export function setCache<T>(key: string, data: T, expiry: number = CACHE_EXPIRY): void {
  if (typeof window === 'undefined') return;
  
  const cacheItem: CacheItem<T> = {
    data,
    timestamp: Date.now(),
    expiry: Date.now() + expiry
  };
  
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
  } catch (error) {
    console.warn('Failed to set cache item:', error);
  }
}

export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;
    
    const cacheItem: CacheItem<T> = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() > cacheItem.expiry) {
      // Remove expired cache
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    
    return cacheItem.data;
  } catch (error) {
    console.warn('Failed to get cache item:', error);
    return null;
  }
}

export function clearCache(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.warn('Failed to clear cache item:', error);
  }
}

export function clearAllCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}