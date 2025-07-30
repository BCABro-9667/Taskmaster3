
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Task, Assignee } from '@/types'; 
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { taskFormSchema, type TaskFormValues } from './TaskFormSchema';
import { TaskFormFields } from './TaskFormFields';
import { CreateAssigneeDialog } from '@/components/assignees/CreateAssigneeDialog';
import { useAssignees, useUpdateTask } from '@/hooks/use-tasks';

interface EditTaskFormProps {
  task: Task;
  onTaskUpdated: () => void;
  closeDialog: () => void;
  currentUserId: string; 
}

export function EditTaskForm({ task, onTaskUpdated, closeDialog, currentUserId }: EditTaskFormProps) {
  const { toast } = useToast();
  const [isCreateAssigneeDialogOpen, setIsCreateAssigneeDialogOpen] = useState(false);

  const { data: assigneesForDropdown = [], refetch: refetchAssignees } = useAssignees(currentUserId);
  const { mutate: updateTask, isPending: isSubmitting } = useUpdateTask(currentUserId);
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      assignedTo: task.assignedTo?.id || 'unassigned',
      deadline: task.deadline,
    },
  });

  const handleAssigneeCreated = (newAssignee: Assignee) => { 
    refetchAssignees().then(() => {
      form.setValue('assignedTo', newAssignee.id, { shouldValidate: true });
    });
    setIsCreateAssigneeDialogOpen(false);
  };

  function onSubmit(values: TaskFormValues) {
    if (!currentUserId) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not identified. Cannot update task.' });
      return;
    }
    
    const taskDataForApi = {
      title: values.title,
      assignedTo: values.assignedTo === 'unassigned' ? null : values.assignedTo,
      deadline: values.deadline,
    };

    updateTask({ id: task.id, updates: taskDataForApi }, {
      onSuccess: () => {
        onTaskUpdated();
        closeDialog();
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Failed to Update Task',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TaskFormFields
            control={form.control}
            setValue={form.setValue}
            assignableUsers={assigneesForDropdown} 
            onOpenCreateAssigneeDialog={() => setIsCreateAssigneeDialogOpen(true)}
            currentUserId={currentUserId} 
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || !currentUserId}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
      {currentUserId && (
        <CreateAssigneeDialog
          isOpen={isCreateAssigneeDialogOpen}
          onOpenChange={setIsCreateAssigneeDialogOpen}
          onAssigneeCreated={handleAssigneeCreated}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
