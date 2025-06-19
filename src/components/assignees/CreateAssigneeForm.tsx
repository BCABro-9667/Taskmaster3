
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createAssignableUser } from '@/lib/tasks';
import type { User } from '@/types';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const assigneeFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  designation: z.string().min(2, { message: 'Designation must be at least 2 characters.' }),
});

type AssigneeFormValues = z.infer<typeof assigneeFormSchema>;

interface CreateAssigneeFormProps {
  onAssigneeCreated: (newUser: User) => void;
  closeDialog: () => void;
}

export function CreateAssigneeForm({ onAssigneeCreated, closeDialog }: CreateAssigneeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssigneeFormValues>({
    resolver: zodResolver(assigneeFormSchema),
    defaultValues: {
      name: '',
      designation: '',
    },
  });

  async function onSubmit(values: AssigneeFormValues) {
    setIsSubmitting(true);
    try {
      const newUser = await createAssignableUser(values.name, values.designation);
      toast({
        title: 'Assignee Created',
        description: `${newUser.name} has been added.`,
      });
      onAssigneeCreated(newUser);
      closeDialog();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Assignee',
        description: (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="designation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Designation</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Software Engineer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Assignee
          </Button>
        </div>
      </form>
    </Form>
  );
}
