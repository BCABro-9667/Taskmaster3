'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function CustomCursor() {
  const cursorWrapperRef = useRef<HTMLDivElement>(null);
  const [isPointer, setIsPointer] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const mousePos = { x: -100, y: -100 };
    const cursorPos = { x: 0, y: 0 };
    const speed = 0.1;

    let animationFrameId: number;

    const animate = () => {
      // Linearly interpolate for smooth "lagging" effect
      cursorPos.x += (mousePos.x - cursorPos.x) * speed;
      cursorPos.y += (mousePos.y - cursorPos.y) * speed;

      if (cursorWrapperRef.current) {
        // Use translate3d for hardware acceleration
        cursorWrapperRef.current.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;

      const target = e.target as HTMLElement;
      if (
        window.getComputedStyle(target).getPropertyValue('cursor') === 'pointer'
      ) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div ref={cursorWrapperRef} className="fixed top-0 left-0 z-[9999] pointer-events-none">
      <div
        className={cn(
          'rounded-full bg-[#4152B5] transition-all duration-200 ease-out -translate-x-1/2 -translate-y-1/2',
          isPointer ? 'h-10 w-10 opacity-50' : 'h-4 w-4 opacity-100'
        )}
      />
    </div>
  );
}
