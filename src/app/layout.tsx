
'use client';

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { useEffect } from 'react';
import { syncOfflineChanges } from '@/lib/offline-sync';

// This metadata is now for reference, as manifest.json takes precedence for PWAs.
// export const metadata: Metadata = {
//   title: 'TaskMaster',
//   description: 'Manage your tasks, assignments, and deadlines efficiently.',
//   manifest: '/manifest.json',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Listen for messages from the service worker.
          navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SYNC_OFFLINE_DATA') {
              console.log('Received sync message from service worker. Triggering sync.');
              syncOfflineChanges();
            }
          });

        }).catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      });
    }

    // Attempt to sync any offline changes when the app loads
    syncOfflineChanges();

    // Add an event listener to sync when the app comes back online
    window.addEventListener('online', syncOfflineChanges);
    
    // Listen for custom event to refetch data after sync
    const handleDataChange = () => {
      // You could use this to trigger a global refetch if needed,
      // but react-query's invalidation handles this more granularly.
      console.log('Data changed event received.');
    };
    window.addEventListener('datachanged', handleDataChange);
    
    return () => {
      window.removeEventListener('online', syncOfflineChanges);
      window.removeEventListener('datachanged', handleDataChange);
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Passion+One:wght@400;700;900&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3F51B5" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <ReactQueryProvider>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
            {children}
            <Toaster />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
