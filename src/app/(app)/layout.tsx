
'use client';

import { Navbar } from '@/components/shared/Navbar';
import { getCurrentUser } from '@/lib/client-auth'; // Updated import
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LoadingBarProvider } from '@/hooks/use-loading-bar';
import type { User } from '@/types';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getCurrentUser(); // From client-auth, synchronous
    if (!user) {
      router.replace('/login');
    } else {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, [router]);
  
  useEffect(() => {
    const handleStorageChange = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const backgroundStyle = currentUser?.backgroundImageUrl
    ? { backgroundImage: `url(${currentUser.backgroundImageUrl})` }
    : {};

  return (
    <LoadingBarProvider>
       <div 
        className="flex flex-col min-h-screen bg-background bg-cover bg-center bg-no-repeat bg-fixed" 
        style={backgroundStyle}
      >
        <div className="flex flex-col min-h-screen bg-background/60 backdrop-blur-sm app-layout-main-container">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border footer-component bg-background/50">
              © {new Date().getFullYear()} TaskMaster. All rights reserved.
            </footer>
        </div>
      </div>
    </LoadingBarProvider>
  );
}
