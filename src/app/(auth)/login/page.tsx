
'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react'; 
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/client-auth';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import logo from '@/components/shared/logo.png';

export default function LoginPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace('/dashboard');
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Image src={logo} alt="TaskMaster Logo" width={48} height={48} />
          </div>
          <CardTitle className="text-3xl font-headline">Welcome to TaskMaster</CardTitle>
          <CardDescription>Log in to manage your tasks efficiently.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
