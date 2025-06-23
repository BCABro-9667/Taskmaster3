
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      // Check if the element or its parent has a pointer cursor
      if (window.getComputedStyle(target).getPropertyValue('cursor') === 'pointer') {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // To avoid a flash of the cursor at 0,0 on initial load
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "cursor-dot pointer-events-none fixed z-[9999] h-2 w-2 rounded-full transition-transform duration-200",
          isPointer ? "scale-0" : "scale-100"
        )}
        style={{
          backgroundColor: '#4152B5',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        className={cn(
          "cursor-ring pointer-events-none fixed z-[9999] h-8 w-8 rounded-full border-2 transition-transform duration-300 ease-out",
          isPointer ? "scale-150" : "scale-100"
        )}
        style={{
          borderColor: '#4152B5',
          backgroundColor: 'rgba(65, 82, 181, 0.2)',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </>
  );
}
