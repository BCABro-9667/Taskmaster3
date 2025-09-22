
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Passion+One:wght@400;700;900&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3F51B5" />
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
