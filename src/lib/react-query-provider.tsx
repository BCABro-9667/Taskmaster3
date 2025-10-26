'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 5 * 60 * 1000, // 5 minutes (increased from 1 minute)
        gcTime: 10 * 60 * 1000, // 10 minutes (increased from 5 minutes)
        retry: 2, // Retry failed requests up to 2 times
        retryDelay: 1000, // Wait 1 second between retries
        refetchOnWindowFocus: false, // Disable refetching on window focus to reduce API calls
        refetchOnReconnect: true, // Refetch when reconnecting
        refetchOnMount: 'always', // Always refetch on mount for fresh data
        networkMode: 'always', // Always fetch from network when online
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}