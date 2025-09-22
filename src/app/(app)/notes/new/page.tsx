
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
import { useEffect, useState } from 'react';

const noteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(5000, 'Description is too long').optional(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

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

  const handleFormSubmit: SubmitHandler<NoteFormValues> = (data) => {
    createNote(data, {
      onSuccess: () => {
        toast({ title: "Note Created", description: "Your new note has been saved." });
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
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/notes">
            <ArrowLeft />
            <span className="sr-only">Back to Notes</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline text-primary">Create New Note</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 flex-grow flex flex-col">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Note Title"
                    {...field}
                    className="text-2xl font-semibold border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary p-2 h-auto"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="flex-grow flex flex-col">
                <FormLabel className="sr-only">Note Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Type your note here..."
                    className="flex-grow w-full h-full text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-2 bg-transparent"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end sticky bottom-8">
            <Button type="submit" size="lg" disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Create Note
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

    