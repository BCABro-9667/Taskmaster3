
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateTask, getAssignableUsers } from '@/lib/tasks';
import type { Task, User } from '@/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { taskFormSchema, type TaskFormValues } from './TaskFormSchema';
import { TaskFormFields } from './TaskFormFields';

interface EditTaskFormProps {
  task: Task;
  onTaskUpdated: () => void;
  closeDialog: () => void;
}

export function EditTaskForm({ task, onTaskUpdated, closeDialog }: EditTaskFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      assignedTo: task.assignedTo || undefined,
      deadline: task.deadline,
    },
  });
  
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
      // Only send fields that are part of the simplified form
      // Existing description and status on the task will not be modified by this form.
      const taskDataForApi = {
        title: values.title,
        assignedTo: values.assignedTo === 'unassigned' ? null : (values.assignedTo || undefined),
        deadline: values.deadline,
        // description and status are intentionally omitted here
      };
      await updateTask(task.id, taskDataForApi);
      toast({
        title: 'Task Updated',
        description: `"${values.title}" has been updated.`,
      });
      onTaskUpdated();
      closeDialog();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Update Task',
        description: (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <TaskFormFields control={form.control} assignableUsers={assignableUsers} />
        <div className="flex justify-end gap-2">
           <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancel
           </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
