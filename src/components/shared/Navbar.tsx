'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { clearCurrentUser, getCurrentUser } from '@/lib/client-auth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, UserCircle as ProfileIcon, TrendingUp, Users, LayoutDashboard, StickyNote, MessageSquare, Link as LinkIcon, Database, HardDrive, Menu } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [navbarBrandName, setNavbarBrandName] = useState('TaskMaster');
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

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
    updateUserState();

    window.addEventListener('storage', updateUserState);

    return () => {
      window.removeEventListener('storage', updateUserState);
    };
  }, []);

  const handleLogout = () => {
    clearCurrentUser();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/');
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
    { href: "/url-storage", label: "URL Storage", icon: LinkIcon },
    { href: "/notes", label: "Notes", icon: StickyNote },
  ];

  const profileDropdownLinks = [
    { href: "/profile", label: "Profile", icon: ProfileIcon },
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

            <ThemeToggle />

            {currentUser ? (
              <>
                {/* Mobile Profile Sheet */}
                <div className="sm:hidden">
                  <Sheet open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full border-2 border-[#4D66D6] p-0">
                        <Avatar className="h-9 w-9">
                          {currentUser.profileImageUrl && <AvatarImage src={currentUser.profileImageUrl} alt={currentUser.name || ''} className="object-cover" />}
                          <AvatarFallback>{getUserInitials(currentUser.name)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-64 p-0">
                      <div className="flex h-full flex-col">
                        {/* Profile Header */}
                        <div className="border-b p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              {currentUser.profileImageUrl && <AvatarImage src={currentUser.profileImageUrl} alt={currentUser.name || ''} className="object-cover" />}
                              <AvatarFallback>{getUserInitials(currentUser.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{currentUser.name || 'User'}</p>
                              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto py-2">
                          <nav className="grid gap-1 px-2">
                            {navLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                  pathname === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                                onClick={() => setIsProfileSheetOpen(false)}
                              >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                              </Link>
                            ))}

                            <div className="border-t my-2"></div>

                            {profileDropdownLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                  pathname === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                                onClick={() => setIsProfileSheetOpen(false)}
                              >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                              </Link>
                            ))}
                          </nav>
                        </div>

                        {/* Logout Button */}
                        <div className="border-t p-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              handleLogout();
                              setIsProfileSheetOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Desktop Profile Dropdown */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-[#4D66D6] p-0">
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
                      {profileDropdownLinks.map((link) => (
                        <DropdownMenuItem key={link.href} asChild>
                          <Link href={link.href} className="cursor-pointer">
                            <link.icon className="mr-2 h-4 w-4" />
                            <span>{link.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              null
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}