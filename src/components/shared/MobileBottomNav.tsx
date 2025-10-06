
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Link as LinkIcon, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assignees", label: "Assignees", icon: Users },
    { href: "/url-storage", label: "URL Storage", icon: LinkIcon },
    { href: "/notes", label: "Notes", icon: StickyNote },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-sm border-t border-border/40 z-50">
        <div className="flex items-center justify-around h-full">
            {navLinks.map((link) => (
                <Button
                    key={link.href}
                    variant="ghost"
                    asChild
                    className={cn(
                        "flex-1 rounded-none text-muted-foreground h-full", 
                        pathname === link.href && "text-primary"
                    )}
                >
                    <Link href={link.href} className="flex flex-col items-center justify-center gap-1 h-full">
                        <link.icon className="h-5 w-5" />
                        <span className="text-xs">{link.label}</span>
                    </Link>
                </Button>
            ))}
        </div>
    </nav>
  );
}
