
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateTask } from '@/lib/tasks';
import type { Task } from '@/types';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { noteFormSchema, type NoteFormValues } from './TaskFormSchema';


interface EditNoteFormProps {
  task: Task;
  onNoteUpdated: () => void;
  closeDialog: () => void;
}

export function EditNoteForm({ task, onNoteUpdated, closeDialog }: EditNoteFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      description: task.description || '',
    },
  });

  async function onSubmit(values: NoteFormValues) {
    setIsSubmitting(true);
    try {
      await updateTask(task.id, { description: values.description || '' });
      toast({
        title: 'Note Updated',
        description: `The note for task "${task.title}" has been saved.`,
      });
      onNoteUpdated();
      closeDialog();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Update Note',
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note / Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add your note here..."
                  className="resize-none min-h-[120px]"
                  {...field}
                  value={field.value || ''}
                />
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
            Save Note
          </Button>
        </div>
      </form>
    </Form>
  );
}
