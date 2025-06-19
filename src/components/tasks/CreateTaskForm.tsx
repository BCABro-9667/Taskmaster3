
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
import { createTask, getAssignableUsers } from '@/lib/tasks';
import type { User, TaskStatus } from '@/types';
import { useEffect, useState } from 'react';
import { Loader2, CalendarIcon, Sparkles } from 'lucide-react';
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
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { suggestDeadline } from '@/ai/flows/suggest-deadline';

interface CreateTaskFormProps {
  onTaskCreated: () => void;
}

export function CreateTaskForm({ onTaskCreated }: CreateTaskFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      assignedTo: undefined,
      deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
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
    setIsSubmitting(true);
    try {
      const taskDataForApi = {
        title: values.title,
        description: '',
        assignedTo: values.assignedTo === 'unassigned' ? undefined : values.assignedTo,
        deadline: values.deadline,
        status: 'todo' as TaskStatus,
      };
      await createTask(taskDataForApi);
      toast({
        title: 'Task Created',
        description: `"${values.title}" has been added to your tasks.`,
      });
      onTaskCreated();
      form.reset({
        title: '',
        assignedTo: undefined,
        deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
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
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {assignableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
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

        <Button type="submit" className="shrink-0 w-full sm:w-auto" disabled={isSubmitting || isSubmittingAi}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Task
        </Button>
      </form>
    </Form>
  );
}
