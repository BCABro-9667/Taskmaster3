
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useCreateNote } from '@/hooks/use-notes';
import { getCurrentUser } from '@/lib/client-auth';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const noteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(5000, 'Description is too long').optional(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

const LOCAL_STORAGE_KEY = 'newNoteDraft';

export default function NewNotePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
    } else {
      setCurrentUser(user);
    }
  }, [router]);

  const { mutate: createNote, isPending: isCreating } = useCreateNote(currentUser?.id);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        form.reset(parsedDraft);
      } catch (e) {
        console.error("Failed to parse note draft from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, [form]);

  // Save to localStorage on change
  const watchedValues = form.watch();
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);


  const handleFormSubmit: SubmitHandler<NoteFormValues> = (data) => {
    createNote(data, {
      onSuccess: () => {
        toast({ title: "Note Created", description: "Your new note has been saved." });
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear draft on success
        form.reset({ title: '', description: '' }); // Reset form fields
        router.push('/notes');
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Error creating note',
          description: error.message,
        });
      },
    });
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <TooltipProvider>
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-full">
          <div className="sticky top-[65px] z-10 bg-background/80 backdrop-blur-sm pt-4 pb-2">
              <div className="flex items-start gap-4 mb-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href="/notes">
                        <ArrowLeft />
                        <span className="sr-only">Back to Notes</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Back to Notes</p>
                  </TooltipContent>
                </Tooltip>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="sr-only">Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Title"
                          {...field}
                          className="text-4xl font-bold border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-auto"
                        />
                      </FormControl>
                      <FormMessage className="px-2" />
                    </FormItem>
                  )}
                />
              </div>
              <Separator />
          </div>
          
          <div className="flex-grow flex flex-col">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="flex-grow flex flex-col">
                  <FormLabel className="sr-only">Note Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your note here..."
                      className="w-full h-full text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-2 bg-transparent shadow-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="px-2" />
                </FormItem>
              )}
            />
          </div>

          <div className="sticky bottom-6 mt-auto py-4 bg-background/80 backdrop-blur-sm">
            <Button type="submit" size="lg" disabled={isCreating} className="w-full">
              {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Create Note
            </Button>
          </div>
        </form>
      </Form>
    </div>
    </TooltipProvider>
  );
}
