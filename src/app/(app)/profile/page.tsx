
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
import { Loader2, UserCircle, Image as ImageIcon, Save } from 'lucide-react';
// Image from next/image is not used here for external user-provided URLs due to domain config needs.

const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(50, 'Name must be 50 characters or less.'),
  profileImageUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal('')).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUserForForm, setCurrentUserForForm] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      profileImageUrl: '',
    },
  });

  useEffect(() => {
    const user = getCurrentUser(); // From client-auth
    if (user) {
      setCurrentUserForForm(user);
      form.reset({
        name: user.name || '',
        profileImageUrl: user.profileImageUrl || '',
      });
      setPreviewImageUrl(user.profileImageUrl || null);
    } else {
      router.replace('/login'); 
    }
    setIsLoading(false);
  }, [form, router]);
  
  const watchedImageUrl = form.watch('profileImageUrl');

  useEffect(() => {
    if (watchedImageUrl && form.getFieldState('profileImageUrl').isDirty) {
      try {
        new URL(watchedImageUrl);
        setPreviewImageUrl(watchedImageUrl);
      } catch (_) {
        setPreviewImageUrl(null); 
      }
    } else if (!watchedImageUrl && currentUserForForm?.profileImageUrl) {
      setPreviewImageUrl(currentUserForForm.profileImageUrl);
    } else if (!watchedImageUrl) {
      setPreviewImageUrl(null);
    }
  }, [watchedImageUrl, currentUserForForm, form]);


  const onSubmit = async (data: ProfileFormValues) => {
    if (!currentUserForForm) {
      toast({ variant: 'destructive', title: 'Error', description: 'No user logged in.'});
      return;
    }
    setIsSaving(true);
    try {
      // Call Server Action, passing the user ID
      const updatedUserFromDb = await updateCurrentUser(currentUserForForm.id, {
        name: data.name,
        profileImageUrl: data.profileImageUrl || '',
      });

      if (updatedUserFromDb) {
        setLocalStorageUser(updatedUserFromDb); // Update client-side localStorage
        setCurrentUserForForm(updatedUserFromDb); // Update local state for immediate reflection in this component
        toast({
          title: 'Profile Updated',
          description: 'Your profile information has been saved.',
        });
        router.refresh(); 
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
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <UserCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline">Your Profile</CardTitle>
          </div>
          <CardDescription>Update your personal information here. Your name will be displayed in the app navigation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {previewImageUrl && (
              <div className="space-y-2">
                <Label>Image Preview</Label>
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary bg-muted flex items-center justify-center">
                  <img 
                    src={previewImageUrl} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => { 
                      (e.target as HTMLImageElement).style.display='none'; 
                      const nextSibling = (e.target as HTMLImageElement).nextElementSibling;
                      if (nextSibling) nextSibling.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center flex-col text-muted-foreground">
                    <ImageIcon className="w-12 h-12"/>
                    <span className="text-xs mt-1">Preview N/A</span>
                  </div>
                </div>
              </div>
            )}
             {!previewImageUrl && (
                <div className="space-y-2">
                <Label>Image Preview</Label>
                 <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12"/>
                </div>
                <p className="text-xs text-muted-foreground">No image URL provided or URL is invalid.</p>
              </div>
            )}


            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
