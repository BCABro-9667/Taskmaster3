
'use client';

import { Navbar } from '@/components/shared/Navbar';
import { getCurrentUser } from '@/lib/client-auth'; // Updated import
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LoadingBarProvider } from '@/hooks/use-loading-bar';
import type { User } from '@/types';
import { AppLayoutClient } from '@/components/shared/AppLayoutClient';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser()); // Initialize from localStorage
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);

  useEffect(() => {
    const user = getCurrentUser(); // From client-auth, synchronous
    if (!user) {
      router.replace('/login');
    } else {
      setCurrentUser(user);
      setIsAuthCheckComplete(true);
    }
  }, [router]);
  
  useEffect(() => {
    const handleStorageChange = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      if (!user) {
        router.replace('/login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  if (!isAuthCheckComplete && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser) {
    return null; // or a minimal loader, as the redirect is in progress
  }
  
  return (
    <LoadingBarProvider>
       <AppLayoutClient user={currentUser}>
        {children}
       </AppLayoutClient>
    </LoadingBarProvider>
  );
}
