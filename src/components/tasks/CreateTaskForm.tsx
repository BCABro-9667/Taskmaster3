
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useToast } from '@/hooks/use-toast';
import type { Assignee } from '@/types';
import { useState, useCallback, useEffect } from 'react';
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
import { CreateAssigneeDialog } from '@/components/assignees/CreateAssigneeDialog';
import { useAssignees, useCreateTask } from '@/hooks/use-tasks';

const CREATE_NEW_ASSIGNEE_VALUE = "__CREATE_NEW_ASSIGNEE__";

interface CreateTaskFormProps {
  currentUserId: string | null; 
  lastSelectedAssigneeId: string;
  onAssigneeChange: (assigneeId: string) => void;
}

export function CreateTaskForm({ currentUserId, lastSelectedAssigneeId, onAssigneeChange }: CreateTaskFormProps) {
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCreateAssigneeDialogOpen, setIsCreateAssigneeDialogOpen] = useState(false);

  const { data: assigneesForDropdown = [], refetch: refetchAssignees } = useAssignees(currentUserId);
  const { mutate: createTask, isPending: isSubmitting } = useCreateTask(currentUserId);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      assignedTo: lastSelectedAssigneeId, 
      deadline: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  useEffect(() => {
    form.setValue('assignedTo', lastSelectedAssigneeId);
  }, [lastSelectedAssigneeId, form]);

  const handleAssigneeCreated = (newAssignee: Assignee) => {
    refetchAssignees().then(() => {
      onAssigneeChange(newAssignee.id);
      form.setValue('assignedTo', newAssignee.id, { shouldValidate: true });
    });
    setIsCreateAssigneeDialogOpen(false);
  };

  function onSubmit(values: TaskFormValues) {
    if (!currentUserId) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not identified. Cannot create task.' });
      return;
    }
    
    const taskDataForApi = {
      title: values.title,
      description: '', 
      assignedTo: values.assignedTo === 'unassigned' ? undefined : values.assignedTo,
      deadline: values.deadline,
      status: 'todo' as const, 
    };

    createTask(taskDataForApi, {
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Failed to Create Task',
          description: error.message || 'An unexpected error occurred.',
        });
        // On error, restore the form values so the user can try again
        form.reset(values);
      }
    });
    
    // Immediately reset the form for an optimistic UI feel
    form.reset({
      title: '',
      assignedTo: lastSelectedAssigneeId,
      deadline: format(new Date(), 'yyyy-MM-dd'),
    });
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
                      onAssigneeChange(value);
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
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="shrink-0 w-full sm:w-auto" disabled={isSubmitting || !currentUserId}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
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
