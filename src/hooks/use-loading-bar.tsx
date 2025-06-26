
'use client';

import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar';

interface LoadingBarContextType {
  start: () => void;
  complete: () => void;
}

const LoadingBarContext = createContext<LoadingBarContextType | undefined>(undefined);

export function LoadingBarProvider({ children }: { children: ReactNode }) {
  const loadingBarRef = useRef<LoadingBarRef>(null);

  const start = () => {
    loadingBarRef.current?.continuousStart();
  };

  const complete = () => {
    loadingBarRef.current?.complete();
  };

  return (
    <LoadingBarContext.Provider value={{ start, complete }}>
      <LoadingBar color="hsl(var(--primary))" ref={loadingBarRef} shadow={true} />
      {children}
    </LoadingBarContext.Provider>
  );
}

export function useLoadingBar() {
  const context = useContext(LoadingBarContext);
  if (context === undefined) {
    throw new Error('useLoadingBar must be used within a LoadingBarProvider');
  }
  return context;
}
