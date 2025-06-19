
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logout, getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Building2, LogOut, UserCircle as ProfileIcon, TrendingUp } from 'lucide-react'; // Added TrendingUp
import { useEffect, useState } from 'react';
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

export function Navbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [navbarBrandName, setNavbarBrandName] = useState('TaskMaster');

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user && user.name) {
      setNavbarBrandName(user.name);
    } else {
      setNavbarBrandName('TaskMaster');
    }

    // Listener for storage changes to update user potentially
    const handleStorageChange = () => {
      const updatedUser = getCurrentUser();
      setCurrentUser(updatedUser);
      if (updatedUser && updatedUser.name) {
        setNavbarBrandName(updatedUser.name);
      } else {
        setNavbarBrandName('TaskMaster');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); 


  const handleLogout = async () => {
    await logout();
    setCurrentUser(null); 
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
    router.refresh(); 
  };

  const getUserInitials = (name: string | undefined) => {
    if (!name) return 'TM'; 
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };


  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-semibold text-primary">
            <Building2 className="h-7 w-7" />
            <span className="font-headline">{navbarBrandName}</span>
          </Link>
          
          {currentUser ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={currentUser.profileImageUrl || `https://placehold.co/100x100.png?text=${getUserInitials(currentUser.name)}`} 
                      alt={currentUser.name || 'User Avatar'} 
                      data-ai-hint="profile avatar" 
                    />
                    <AvatarFallback>{getUserInitials(currentUser.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <ProfileIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/task-progress" className="cursor-pointer">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Task Progress</span>
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
             <Button asChild variant="outline">
                <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
