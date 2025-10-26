
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { updateCurrentUser } from '@/lib/auth'; // Server Action
import { getCurrentUser, setCurrentUser as setLocalStorageUser } from '@/lib/client-auth'; // Client-side utilities
import type { User } from '@/types';
import { Loader2, UserCircle, Image as ImageIcon, Save, Wallpaper, ShieldCheck, KeyRound, Lock, Palette, Settings, MessageSquare, Database } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { FeedbackForm } from '@/components/profile/FeedbackForm';
import { StorageManagement } from '@/components/profile/StorageManagement';


const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(50, 'Name must be 50 characters or less.'),
  profileImageUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal('')).optional(),
  backgroundImageUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal('')).optional(),
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits.").optional().or(z.literal('')),
  currentPin: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.').optional().or(z.literal('')),
}).refine(data => {
    if (data.newPassword && !data.currentPassword) {
        return false;
    }
    return true;
}, {
    message: 'Current password is required to set a new password.',
    path: ['currentPassword'],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUserForForm, setCurrentUserForForm] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      profileImageUrl: '',
      backgroundImageUrl: '',
      pin: '',
      currentPin: '',
      currentPassword: '',
      newPassword: '',
    },
  });

  useEffect(() => {
    const user = getCurrentUser(); 
    if (user) {
      setCurrentUserForForm(user);
      form.reset({
        name: user.name || '',
        profileImageUrl: user.profileImageUrl || '',
        backgroundImageUrl: user.backgroundImageUrl || '',
        pin: '',
        currentPin: '',
        currentPassword: '',
        newPassword: '',
      });
    } else {
      router.replace('/login'); 
    }
    setIsLoading(false);
  }, [form, router]);
  
  const watchedImageUrl = form.watch('profileImageUrl');

  const onSubmit = async (data: ProfileFormValues) => {
    if (!currentUserForForm) {
      toast({ variant: 'destructive', title: 'Error', description: 'No user logged in.'});
      return;
    }
    setIsSaving(true);
    try {
      if (currentUserForForm.hasPin && data.pin && !data.currentPin) {
        toast({
          variant: 'destructive',
          title: 'Verification Required',
          description: 'Please enter your current PIN to set a new one.',
        });
        setIsSaving(false);
        return;
      }
      
      const updatedUserFromDb = await updateCurrentUser(currentUserForForm.id, {
        name: data.name,
        profileImageUrl: data.profileImageUrl || '',
        backgroundImageUrl: data.backgroundImageUrl || '',
        pin: data.pin,
        currentPin: data.currentPin,
        newPassword: data.newPassword,
        currentPassword: data.currentPassword,
      });

      if (updatedUserFromDb) {
        setLocalStorageUser(updatedUserFromDb); 
        setCurrentUserForForm(updatedUserFromDb); 
        form.reset({
            ...form.getValues(),
            pin: '',
            currentPin: '',
            currentPassword: '',
            newPassword: '',
        });
        toast({
          title: 'Profile Updated',
          description: 'Your profile information has been saved.',
        });
        window.dispatchEvent(new Event('storage'));
      } else {
        throw new Error('Failed to update profile on the server.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: (error as Error).message || 'Could not save your profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUserForForm) {
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div className="flex items-center gap-3 mb-2">
            <UserCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline">Profile Settings</h1>
        </div>
      
        <Tabs defaultValue="personal_info" className="w-full">
            <TabsList className="w-full flex-wrap h-auto">
              <TabsTrigger value="personal_info" className="flex-1">
                <UserCircle className="mr-2 h-4 w-4" /> Personal Info
                </TabsTrigger>
              <TabsTrigger value="personalization" className="flex-1">
                <Palette className="mr-2 h-4 w-4" /> Personalization
                </TabsTrigger>
              <TabsTrigger value="privacy" className="flex-1">
                <ShieldCheck className="mr-2 h-4 w-4" /> Privacy
                </TabsTrigger>
              <TabsTrigger value="storage" className="flex-1">
                <Database className="mr-2 h-4 w-4" /> Storage
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex-1">
                <MessageSquare className="mr-2 h-4 w-4" /> Feedback
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal_info">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card className="mt-6 shadow-lg bg-card/60">
                    <CardContent className="pt-6">
                        <CardHeader className="p-0 mb-4">
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your name and profile picture.</CardDescription>
                        </CardHeader>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Image Preview</Label>
                                <Avatar className="h-32 w-32 border-2 border-primary bg-muted">
                                    <AvatarImage src={watchedImageUrl || ''} alt="Profile Preview" className="object-cover" />
                                    <AvatarFallback className="text-4xl">
                                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                {!watchedImageUrl && <p className="text-xs text-muted-foreground">No image URL provided.</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                id="name"
                                {...form.register('name')}
                                placeholder="Your full name"
                                className={form.formState.errors.name ? 'border-destructive' : ''}
                                />
                                {form.formState.errors.name && (
                                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profileImageUrl">Profile Image URL</Label>
                                <Input
                                id="profileImageUrl"
                                {...form.register('profileImageUrl')}
                                placeholder="https://example.com/your-image.png"
                                className={form.formState.errors.profileImageUrl ? 'border-destructive' : ''}
                                />
                                {form.formState.errors.profileImageUrl && (
                                <p className="text-sm text-destructive">{form.formState.errors.profileImageUrl.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    </Card>
                    <div className="mt-6 flex justify-end">
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                        {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                    </div>
                </form>
            </TabsContent>

            <TabsContent value="personalization">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card className="mt-6 shadow-lg bg-card/60">
                        <CardContent className="pt-6 space-y-6">
                            <CardHeader className="p-0 mb-4">
                                <CardTitle>Personalization</CardTitle>
                                <CardDescription>Customize the look and feel of your application.</CardDescription>
                            </CardHeader>
                            <div className="space-y-2">
                                <Label htmlFor="backgroundImageUrl">Dashboard Background Image URL</Label>
                                <div className="flex items-center gap-2">
                                <Wallpaper className="h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="backgroundImageUrl"
                                    {...form.register('backgroundImageUrl')}
                                    placeholder="https://example.com/your-background.png"
                                    className={form.formState.errors.backgroundImageUrl ? 'border-destructive' : ''}
                                />
                                </div>
                                {form.formState.errors.backgroundImageUrl && (
                                <p className="text-sm text-destructive pl-7">{form.formState.errors.backgroundImageUrl.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Theme</Label>
                                <div className="flex items-center gap-4">
                                <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
                                <ThemeToggle />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="mt-6 flex justify-end">
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                        {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                    </div>
                </form>
            </TabsContent>
            
            <TabsContent value="privacy">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card className="mt-6 shadow-lg bg-card/60">
                        <CardContent className="pt-6 space-y-6">
                            <CardHeader className="p-0 mb-4">
                                <CardTitle>Privacy & Security</CardTitle>
                                <CardDescription>Manage your password and note-locking PIN.</CardDescription>
                            </CardHeader>
                            
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        {...form.register('currentPassword')}
                                        placeholder="Enter current password to change it"
                                        className={form.formState.errors.currentPassword ? 'border-destructive' : ''}
                                    />
                                </div>
                                {form.formState.errors.currentPassword && (
                                    <p className="text-sm text-destructive pl-7">{form.formState.errors.currentPassword.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        {...form.register('newPassword')}
                                        placeholder="Enter new password (min. 6 characters)"
                                        className={form.formState.errors.newPassword ? 'border-destructive' : ''}
                                    />
                                </div>
                                {form.formState.errors.newPassword && (
                                    <p className="text-sm text-destructive pl-7">{form.formState.errors.newPassword.message}</p>
                                )}
                            </div>
                            <Separator />

                            {currentUserForForm.hasPin && (
                            <div className="space-y-2">
                                <Label htmlFor="currentPin">Current 4-Digit PIN</Label>
                                <div className="flex items-center gap-2">
                                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                                    <Input
                                    id="currentPin"
                                    type="password"
                                    maxLength={4}
                                    {...form.register('currentPin')}
                                    placeholder="Enter current PIN to change"
                                    className={form.formState.errors.currentPin ? 'border-destructive' : ''}
                                    />
                                </div>
                                {form.formState.errors.currentPin && (
                                <p className="text-sm text-destructive pl-7">{form.formState.errors.currentPin.message}</p>
                                )}
                            </div>
                            )}

                            <div className="space-y-2">
                            <Label htmlFor="pin">{currentUserForForm.hasPin ? 'New 4-Digit PIN' : 'Set 4-Digit PIN'}</Label>
                            <div className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="pin"
                                    type="password"
                                    maxLength={4}
                                    {...form.register('pin')}
                                    placeholder={currentUserForForm.hasPin ? "Enter new 4-digit PIN" : "Enter 4-digit PIN"}
                                    className={form.formState.errors.pin ? 'border-destructive' : ''}
                                />
                            </div>
                            {form.formState.errors.pin && (
                                <p className="text-sm text-destructive pl-7">{form.formState.errors.pin.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground pl-7">This PIN will be used to unlock your private notes.</p>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="mt-6 flex justify-end">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                            {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                            <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </TabsContent>

            <TabsContent value="storage">
              <div className="mt-6 p-4 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground">
                  All data is now stored securely in the cloud database. Local storage functionality has been removed.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="feedback">
                 <Card className="mt-6 shadow-lg bg-card/60">
                    <CardHeader>
                        <CardTitle>Share Your Thoughts</CardTitle>
                        <CardDescription>
                            We appreciate your feedback! Let us know how we can improve TaskMaster.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FeedbackForm />
                    </CardContent>
                </Card>
            </TabsContent>

        </Tabs>
    </div>
  );
}

    