
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateTask, getAssignees } from '@/lib/tasks'; // Changed getAssignableUsers to getAssignees
import type { Task, Assignee } from '@/types'; // Changed User to Assignee
import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { taskFormSchema, type TaskFormValues } from './TaskFormSchema';
import { TaskFormFields } from './TaskFormFields';
import { CreateAssigneeDialog } from '@/components/assignees/CreateAssigneeDialog';

interface EditTaskFormProps {
  task: Task;
  onTaskUpdated: () => void;
  closeDialog: () => void;
}

export function EditTaskForm({ task, onTaskUpdated, closeDialog }: EditTaskFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assigneesForDropdown, setAssigneesForDropdown] = useState<Assignee[]>([]); // Changed User to Assignee, renamed
  const [isCreateAssigneeDialogOpen, setIsCreateAssigneeDialogOpen] = useState(false);
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      assignedTo: typeof task.assignedTo === 'string' ? task.assignedTo : (task.assignedTo?.id || 'unassigned'),
      deadline: task.deadline,
    },
  });

  const fetchAssigneesData = useCallback(async () => { // Renamed function
    try {
      const fetchedAssignees = await getAssignees(); // Changed to getAssignees
      setAssigneesForDropdown(fetchedAssignees); // Renamed state variable
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load assignees for assignment.' });
    }
  }, [toast]);

  useEffect(() => {
    fetchAssigneesData(); // Renamed function call
  }, [fetchAssigneesData]);

  const handleAssigneeCreated = (newAssignee: Assignee) => { // Changed type to Assignee
    fetchAssigneesData().then(() => {
      form.setValue('assignedTo', newAssignee.id, { shouldValidate: true });
    });
    setIsCreateAssigneeDialogOpen(false);
  };

  async function onSubmit(values: TaskFormValues) {
    setIsSubmitting(true);
    try {
      const taskDataForApi = {
        title: values.title,
        assignedTo: values.assignedTo === 'unassigned' ? null : values.assignedTo,
        deadline: values.deadline,
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
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TaskFormFields
            control={form.control}
            setValue={form.setValue}
            assignableUsers={assigneesForDropdown} // Changed prop name and type
            onOpenCreateAssigneeDialog={() => setIsCreateAssigneeDialogOpen(true)}
            isSubmittingAi={isSubmittingAi}
            setIsSubmittingAi={setIsSubmittingAi}
            currentTaskTitle={form.watch('title')}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting || isSubmittingAi}>
                Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || isSubmittingAi}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
      <CreateAssigneeDialog
        isOpen={isCreateAssigneeDialogOpen}
        onOpenChange={setIsCreateAssigneeDialogOpen}
        onAssigneeCreated={handleAssigneeCreated}
      />
    </>
  );
}
