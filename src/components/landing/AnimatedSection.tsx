
'use client';

import { useRef, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number; // delay in ms
}

export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
            observer.unobserve(element);
          }, delay);
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        'animate-on-scroll',
        isVisible && 'is-visible',
        className
      )}
    >
      {children}
    </div>
  );
}

    