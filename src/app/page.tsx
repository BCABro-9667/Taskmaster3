
'use client';

import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { HeroSection } from '@/components/landing/HeroSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CustomCursor } from '@/components/landing/CustomCursor';
import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    document.body.classList.add('hide-cursor');
    return () => {
      document.body.classList.remove('hide-cursor');
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <CustomCursor />
      <LandingNavbar />
      <main className="flex-grow">
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <TestimonialsSection />
      </main>
      <LandingFooter />
    </div>
  );
}
