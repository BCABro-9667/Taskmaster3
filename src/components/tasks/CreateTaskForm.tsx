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
import { useToast } from '@/hooks/use-toast';
import { createTask, getAssignees } from '@/lib/tasks';
import type { Assignee, Task, TaskStatus } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, CalendarIcon, Sparkles, UserPlus } from 'lucide-react';
import { taskFormSchema, type TaskFormValues } from './TaskFormSchema';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { suggestDeadline } from '@/ai/flows/suggest-deadline';
import { CreateAssigneeDialog } from '@/components/assignees/CreateAssigneeDialog';
// getCurrentUser removed, currentUserId is now a prop

const CREATE_NEW_ASSIGNEE_VALUE = "__CREATE_NEW_ASSIGNEE__";

interface CreateTaskFormProps {
  onTaskCreated: () => void; 
  currentUserId: string | null; // Added currentUserId prop
}

export function CreateTaskForm({ onTaskCreated, currentUserId }: CreateTaskFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const [assigneesForDropdown, setAssigneesForDropdown] = useState<Assignee[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCreateAssigneeDialogOpen, setIsCreateAssigneeDialogOpen] = useState(false);
  // currentUserId state removed, using prop instead

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      assignedTo: 'unassigned', 
      deadline: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const fetchAssigneesData = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const fetchedAssignees = await getAssignees(currentUserId);
      setAssigneesForDropdown(fetchedAssignees);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load assignees for assignment.' });
    }
  }, [toast, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchAssigneesData();
    }
  }, [fetchAssigneesData, currentUserId]);

  const handleAssigneeCreated = (newAssignee: Assignee) => {
    fetchAssigneesData().then(() => {
      form.setValue('assignedTo', newAssignee.id, { shouldValidate: true });
    });
    setIsCreateAssigneeDialogOpen(false);
  };

  const handleSuggestDeadline = async () => {
    setIsSubmittingAi(true);
    const taskTitle = form.getValues('title');
    if (!taskTitle) {
      toast({
        variant: 'destructive',
        title: 'Cannot Suggest Deadline',
        description: 'Please enter a task title first.',
      });
      setIsSubmittingAi(false);
      return;
    }

    try {
      const workload = "moderate workload, several other small tasks pending";
      const result = await suggestDeadline({ taskDetails: taskTitle, currentWorkload: workload });

      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (result.suggestedDeadline && datePattern.test(result.suggestedDeadline)) {
        form.setValue('deadline', result.suggestedDeadline, { shouldValidate: true });
        toast({
          title: 'Deadline Suggested',
          description: (
            <div>
              <p>Suggested: {format(parseISO(result.suggestedDeadline), 'MMMM d, yyyy')}</p>
              <p className="text-xs text-muted-foreground mt-1">Reasoning: {result.reasoning}</p>
            </div>
          ),
        });
      } else {
        throw new Error('AI returned an invalid date format.');
      }
    } catch (error) {
      console.error('Error suggesting deadline:', error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: (error as Error).message || 'Could not get deadline suggestion.',
      });
    } finally {
      setIsSubmittingAi(false);
    }
  };

  async function onSubmit(values: TaskFormValues) {
    if (!currentUserId) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not identified. Cannot create task.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const taskDataForApi = {
        title: values.title,
        description: '', 
        assignedTo: values.assignedTo === 'unassigned' ? undefined : values.assignedTo,
        deadline: values.deadline,
        status: 'todo' as TaskStatus, 
      };
      const newTask = await createTask(currentUserId, taskDataForApi); 
      toast({
        title: 'Task Created',
        description: `"${newTask.title}" has been added to your tasks.`,
      });
      onTaskCreated(); 
      form.reset({
        title: '',
        assignedTo: 'unassigned',
        deadline: format(new Date(), 'yyyy-MM-dd'),
      });
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
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row sm:items-end sm:gap-3 w-full">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-grow w-full sm:w-auto mb-2 sm:mb-0">
                <FormLabel className="sr-only">Title</FormLabel>
                <FormControl>
                  <Input placeholder="Task title, e.g., Finalize project report" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem className="w-full sm:w-auto sm:min-w-[180px] mb-2 sm:mb-0">
                <FormLabel className="sr-only">Assign To</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    if (value === CREATE_NEW_ASSIGNEE_VALUE) {
                      setIsCreateAssigneeDialogOpen(true);
                    } else {
                      field.onChange(value);
                    }
                  }} 
                  value={field.value || 'unassigned'}
                  disabled={!currentUserId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {assigneesForDropdown.map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        {assignee.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={CREATE_NEW_ASSIGNEE_VALUE} className="text-primary">
                      <div className="flex items-center">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create New Assignee...
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="w-full sm:w-auto mb-2 sm:mb-0">
                <FormLabel className="sr-only">Deadline</FormLabel>
                <div className="flex items-center gap-2">
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full sm:w-auto justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(parseISO(field.value), 'PPP') : <span>Pick date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? parseISO(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                          setIsCalendarOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleSuggestDeadline}
                    disabled={isSubmittingAi || !form.getValues('title')}
                    title={!form.getValues('title') ? "Enter task title to suggest deadline" : "Suggest Deadline with AI"}
                    aria-label="Suggest Deadline with AI"
                    className="shrink-0"
                  >
                    {isSubmittingAi ? <Sparkles className="h-4 w-4 animate-ping" /> : <Sparkles className="h-4 w-4 text-accent" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="shrink-0 w-full sm:w-auto" disabled={isSubmitting || isSubmittingAi || !currentUserId}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
        </form>
      </Form>
      {currentUserId && ( // Only render if currentUserId is available
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
