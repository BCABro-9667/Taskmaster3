
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
import { updateAssignee } from '@/lib/tasks'; 
import type { Assignee } from '@/types'; 
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLoadingBar } from '@/hooks/use-loading-bar';

const editAssigneeFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50, 'Name must be 50 characters or less.'),
  designation: z.string().max(50, 'Designation must be 50 characters or less.').optional(),
});

type EditAssigneeFormValues = z.infer<typeof editAssigneeFormSchema>;

interface EditAssigneeFormProps {
  assignee: Assignee; 
  onAssigneeUpdated: (updatedAssignee: Assignee) => void; 
  closeDialog: () => void;
  currentUserId: string; 
}

export function EditAssigneeForm({ assignee, onAssigneeUpdated, closeDialog, currentUserId }: EditAssigneeFormProps) {
  const { toast } = useToast();
  const { start, complete } = useLoadingBar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditAssigneeFormValues>({
    resolver: zodResolver(editAssigneeFormSchema),
    defaultValues: {
      name: assignee.name || '',
      designation: assignee.designation || '',
    },
  });

  async function onSubmit(values: EditAssigneeFormValues) {
    if (!currentUserId) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not identified. Cannot update assignee.' });
      return;
    }
    setIsSubmitting(true);
    start();
    try {
      const updatedData = await updateAssignee(currentUserId, assignee.id, values); 
      if (updatedData) {
        toast({
          title: 'Assignee Updated',
          description: `${updatedData.name}'s details have been updated.`,
        });
        onAssigneeUpdated(updatedData);
        closeDialog();
      } else {
        throw new Error('Failed to update assignee or assignee not found.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Update Assignee',
        description: (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
      complete();
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
                <Input placeholder="e.g., Alex Green" {...field} />
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
              <FormLabel>Designation (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Designer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !currentUserId}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
