
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createTask, getAssignableUsers } from '@/lib/tasks';
import type { User } from '@/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { taskFormSchema, type TaskFormValues } from './TaskFormSchema';
import { TaskFormFields } from './TaskFormFields';
import { format } from 'date-fns';

interface CreateTaskFormProps {
  onTaskCreated: () => void;
}

export function CreateTaskForm({ onTaskCreated }: CreateTaskFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      assignedTo: undefined,
      deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Default to 1 week from now
      status: 'todo',
    },
  });
  const currentTaskTitle = form.watch('title');


  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await getAssignableUsers();
        setAssignableUsers(users);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load users for assignment.' });
      }
    }
    fetchUsers();
  }, [toast]);


  async function onSubmit(values: TaskFormValues) {
    setIsSubmitting(true);
    try {
      const taskData = {
        ...values,
        assignedTo: values.assignedTo === 'unassigned' ? undefined : values.assignedTo,
        description: values.description || '', // Ensure description is string or empty string
      };
      await createTask(taskData);
      toast({
        title: 'Task Created',
        description: `"${values.title}" has been added to your tasks.`,
      });
      onTaskCreated();
      form.reset(); // Reset the form fields to default values
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Task',
        description: (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <TaskFormFields 
          control={form.control} 
          assignableUsers={assignableUsers} 
          isSubmittingAi={isSubmittingAi}
          setIsSubmittingAi={setIsSubmittingAi}
          currentTaskTitle={currentTaskTitle}
        />
        <div className="flex justify-end gap-2">
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || isSubmittingAi}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
        </div>
      </form>
    </Form>
  );
}
