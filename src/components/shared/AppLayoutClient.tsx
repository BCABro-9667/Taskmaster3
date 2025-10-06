
'use client';

import type { User } from '@/types';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';

interface AppLayoutClientProps {
    user: User;
    children: React.ReactNode;
}

export function AppLayoutClient({ user, children }: AppLayoutClientProps) {
    const backgroundStyle = user?.backgroundImageUrl
    ? { backgroundImage: `url(${user.backgroundImageUrl})` }
    : {};

    return (
        <div 
            className="flex flex-col min-h-screen bg-background bg-cover bg-center bg-no-repeat bg-fixed main-bg-container" 
            style={backgroundStyle}
        >
            <div className="flex flex-col min-h-screen bg-background/60 backdrop-blur-sm app-layout-main-container">
                <Navbar />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:pb-8 pb-24">
                  {children}
                </main>
                <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border footer-component bg-background/50 hidden sm:block">
                  © {new Date().getFullYear()} TaskMaster. All rights reserved.
                </footer>
                <MobileBottomNav />
            </div>
        </div>
    )
}
