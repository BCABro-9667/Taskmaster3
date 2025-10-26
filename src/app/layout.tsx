import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/components/shared/AppProviders';

// Metadata for SEO
export const metadata: Metadata = {
  title: 'TaskMaster - AI-Powered Task Management by Avdhesh Kumar',
  description: 'Manage your tasks, assignments, and deadlines efficiently with TaskMaster. Boost productivity with AI-powered suggestions and real-time collaboration. Developed by Avdhesh Kumar.',
  keywords: ['DPG Degree college, AI-powered task management', 'todo app', 'project management', 'productivity', 'Avdhesh Kumar', 'Next.js', 'AI task manager', 'collaboration tool'],
  authors: [{ name: 'Avdhesh Kumar' }],
  creator: 'Avdhesh Kumar',
  // Add performance optimizations
  other: {
    'google-site-verification': 'your-google-site-verification-code-here', // Add your verification code
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Passion+One:wght@400;700;900&display=swap" 
          rel="preload" 
          as="style" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Passion+One:wght@400;700;900&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Preload manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#3F51B5" />
        
        {/* Performance optimizations */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}