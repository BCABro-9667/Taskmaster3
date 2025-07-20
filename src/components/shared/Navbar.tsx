
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { clearCurrentUser, getCurrentUser } from '@/lib/client-auth'; // Use client-auth utilities
import { useToast } from '@/hooks/use-toast';
import { LogOut, UserCircle as ProfileIcon, TrendingUp, Users, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import logo from './logo.png'
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle'; // Import the ThemeToggle component
import { LiveInfo } from './LiveInfo';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [navbarBrandName, setNavbarBrandName] = useState('TaskMaster');

  const updateUserState = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user && user.name) {
      setNavbarBrandName(user.name);
    } else {
      setNavbarBrandName('TaskMaster');
    }
  };

  useEffect(() => {
    updateUserState(); // Initial check

    // Listen for custom storage event from client-auth.ts
    window.addEventListener('storage', updateUserState); 

    return () => {
      window.removeEventListener('storage', updateUserState);
    };
  }, []);


  const handleLogout = () => { 
    clearCurrentUser(); 
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/'); // Redirect to home page
    router.refresh(); 
  };

  const getUserInitials = (name: string | undefined) => {
    if (!name) return 'TM';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assignees", label: "Assignees", icon: Users },
    { href: "/task-progress", label: "Progress", icon: TrendingUp },
  ];

  return (
    <nav className="bg-card/50 border-b border-border/40 shadow-sm sticky top-0 z-50 navbar-component backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-semibold text-primary">
                <Image src={logo} alt="TaskMaster Logo" width={28} height={28} />
                <span className="font-showcard text-2xl tracking-wider">{navbarBrandName}</span>
            </Link>
             <div className="hidden lg:flex border-l border-border/60 ml-4 pl-4">
                <LiveInfo />
            </div>
          </div>


          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant={pathname === link.href ? "secondary" : "ghost"}
                    asChild
                    size="sm"
                    className={cn("font-medium", pathname === link.href && "text-primary")}
                  >
                    <Link href={link.href}>
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </div>
            )}

            <ThemeToggle /> {/* Added ThemeToggle component here */}

            {currentUser ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    {currentUser.profileImageUrl && <AvatarImage src={currentUser.profileImageUrl} alt={currentUser.name || ''} className="object-cover" />}
                    <AvatarFallback>{getUserInitials(currentUser.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <div className="sm:hidden">
                    <DropdownMenuItem className="lg:hidden focus:bg-transparent text-muted-foreground select-none">
                        <LiveInfo />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="lg:hidden" />
                </div>
                <div className="sm:hidden">
                  {navLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild className={cn(pathname === link.href && "bg-accent")}>
                       <Link href={link.href} className="cursor-pointer">
                        <link.icon className="mr-2 h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <ProfileIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // No login/signup buttons here for the authenticated navbar
            null
          )}
          </div>
        </div>
        {/* Mobile Nav Links */}
        {currentUser && (
          <div className="sm:hidden flex items-center justify-around border-t border-border/40 -mx-4 sm:-mx-6 lg:-mx-8">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                asChild
                className={cn(
                  "flex-1 rounded-none text-muted-foreground h-12", 
                  pathname === link.href && "text-primary border-b-2 border-primary"
                )}
              >
                <Link href={link.href} className="flex flex-col items-center justify-center gap-1 h-full">
                  <link.icon className="mr-0 h-5 w-5" />
                  <span className="text-xs">{link.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
