'use client';

import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { HeroSection } from '@/components/landing/HeroSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CustomCursor } from '@/components/landing/CustomCursor';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { useEffect, useState } from 'react';
import { ContactSection } from '@/components/landing/ContactSection';
import { PageLoadingSpinner } from '@/components/shared/PageLoadingSpinner';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add('hide-cursor');
    
    // Simulate loading completion
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => {
      document.body.classList.remove('hide-cursor');
      clearTimeout(timer);
    };
  }, []);

  // Prefetch critical resources
  useEffect(() => {
    // Prefetch key pages
    const prefetchPages = [
      '/login',
      '/register',
      '/dashboard',
      '/notes'
    ];
    
    prefetchPages.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = page;
      document.head.appendChild(link);
    });
  }, []);

  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <CustomCursor />
      <LandingNavbar />
      <main className="flex-grow pb-10">
        <AnimatedSection>
          <HeroSection />
        </AnimatedSection>
        <AnimatedSection>
          <AboutSection />
        </AnimatedSection>
        <AnimatedSection>
          <FeaturesSection />
        </AnimatedSection>
        <AnimatedSection>
          <TestimonialsSection />
        </AnimatedSection>
        <AnimatedSection>
          <ContactSection />
        </AnimatedSection>
      </main>
      <LandingFooter />
    </div>
  );
}