'use client';

import { ThemeProvider } from "next-themes";
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { useEffect } from 'react';
import { syncOfflineChanges } from '@/lib/offline-sync';
import { OfflineProvider } from '@/contexts/OfflineContext';
import emailjs from '@emailjs/browser';

export function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Initialize EmailJS
    emailjs.init('_cWbp6XU7bcCojDbF'); // Public Key

    // Performance optimizations
    // Remove loading attributes from images for better performance
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.setAttribute('loading', 'lazy');
    });

    // Add performance monitoring
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        console.log(`Page load time: ${perfData.loadEventEnd - perfData.fetchStart}ms`);
      });
    }

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
    <ReactQueryProvider>
      <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        <OfflineProvider>
          {children}
        </OfflineProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  );
}