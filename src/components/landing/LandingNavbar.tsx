
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo from '@/components/shared/logo.png';

const navLinks = [
  { href: '#hero', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#features', label: 'Features' },
  { href: '#testimonials', label: 'Testimonials' },
];

export function LandingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const router = useRouter();

  const handleAuthSuccess = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(false);
    router.push('/dashboard'); // Redirect to dashboard after successful auth
    router.refresh(); // Refresh to update navbar state if necessary
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
            <Image src={logo} alt="TaskMaster Logo" width={28} height={28} />
            <span className="font-headline">TaskMaster</span>
          </Link>

          <nav className="hidden md:flex gap-6 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsLoginModalOpen(true)} className="rounded-full">Login</Button>
              <Button onClick={() => setIsRegisterModalOpen(true)} className="rounded-full btn-landing-gradient">Sign Up</Button>
            </div>
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                  <div className="flex flex-col h-full p-6">
                    <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                      <Image src={logo} alt="TaskMaster Logo" width={24} height={24} />
                      <span className="font-headline">TaskMaster</span>
                    </Link>
                    <nav className="flex flex-col gap-4">
                      {navLinks.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="text-md font-medium text-muted-foreground transition-colors hover:text-primary py-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                    <div className="mt-auto flex flex-col gap-2">
                      <Button variant="outline" className="w-full rounded-full" onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }}>Login</Button>
                      <Button className="w-full rounded-full btn-landing-gradient" onClick={() => { setIsMobileMenuOpen(false); setIsRegisterModalOpen(true); }}>Sign Up</Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline text-center">Welcome Back</DialogTitle>
            <DialogDescription className="text-center">
              Log in to TaskMaster to manage your tasks.
            </DialogDescription>
          </DialogHeader>
          <LoginForm onSuccess={handleAuthSuccess} />
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline text-center">Create Account</DialogTitle>
            <DialogDescription className="text-center">
              Join TaskMaster and start organizing your work.
            </DialogDescription>
          </DialogHeader>
          <RegisterForm onSuccess={handleAuthSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
