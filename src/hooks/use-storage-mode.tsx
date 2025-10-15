
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type StorageMode = 'db' | 'local';

interface StorageModeContextType {
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => void;
  isLoading: boolean;
}

const StorageModeContext = createContext<StorageModeContextType | undefined>(undefined);

const STORAGE_KEY = 'taskmaster-storage-mode';

export function StorageModeProvider({ children }: { children: ReactNode }) {
  const [storageMode, setStorageModeState] = useState<StorageMode>('db');
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem(STORAGE_KEY) as StorageMode | null;
      if (savedMode && (savedMode === 'db' || savedMode === 'local')) {
        setStorageModeState(savedMode);
      }
    } catch (error) {
      console.error("Could not read storage mode from localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const setStorageMode = useCallback((mode: StorageMode) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, mode);
        setStorageModeState(mode);
        // Invalidate all queries to force a refetch from the new source
        queryClient.invalidateQueries();
    } catch (error) {
        console.error("Could not set storage mode in localStorage", error);
    }
  }, [queryClient]);

  const value = { storageMode, setStorageMode, isLoading };

  return (
    <StorageModeContext.Provider value={value}>
      {children}
    </StorageModeContext.Provider>
  );
}

export function useStorageMode() {
  const context = useContext(StorageModeContext);
  if (context === undefined) {
    throw new Error('useStorageMode must be used within a StorageModeProvider');
  }
  return context;
}
