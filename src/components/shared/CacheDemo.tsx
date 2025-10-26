'use client';

import { useCache } from '@/hooks/use-cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CacheDemo() {
  const { 
    isOnline, 
    isOnlineOnly, 
    setIsOnlineOnly, 
    getCachedData, 
    setCachedData, 
    clearAllCachedData 
  } = useCache();

  const handleTestCache = () => {
    // Store some test data
    setCachedData('test_key', { message: 'Hello from cache!', timestamp: new Date().toISOString() });
    
    // Retrieve the data
    const cachedData = getCachedData<{ message: string; timestamp: string }>('test_key');
    console.log('Cached data:', cachedData);
  };

  const handleClearCache = () => {
    clearAllCachedData();
    console.log('Cache cleared');
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Cache & Offline Status</CardTitle>
        <CardDescription>Current status and cache testing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>Network Status: {isOnline ? 'Online' : 'Offline'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isOnlineOnly ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          <span>Mode: {isOnlineOnly ? 'Online Only' : 'Cache Enabled'}</span>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button onClick={handleTestCache} variant="outline">
            Test Cache
          </Button>
          <Button onClick={handleClearCache} variant="outline">
            Clear Cache
          </Button>
          <Button 
            onClick={() => setIsOnlineOnly(!isOnlineOnly)} 
            variant={isOnlineOnly ? "default" : "outline"}
          >
            {isOnlineOnly ? 'Disable Online Only' : 'Enable Online Only'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}