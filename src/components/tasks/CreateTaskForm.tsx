
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Assignee } from '@/types';
import { useState, useCallback, useEffect } from 'react';
import { Loader2, CalendarIcon, UserPlus, ArrowUp } from 'lucide-react';
import { taskFormSchema, type TaskFormValues } from './TaskFormSchema';
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
import { Textarea } from '../ui/textarea';

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
    if (!values.title.trim()) {
        form.setError('title', { type: 'manual', message: 'Task description cannot be empty.' });
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
        form.reset(values);
      },
      onSuccess: () => {
         form.reset({
            title: '',
            assignedTo: lastSelectedAssigneeId,
            deadline: format(new Date(), 'yyyy-MM-dd'),
        });
      }
    });
  }

  return (
    <>
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="relative flex flex-col justify-between w-full p-2 pr-4 rounded-2xl border bg-background shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                    <Textarea 
                        placeholder="Write Your Task ...." 
                        {...field} 
                        className="w-full border-none bg-transparent shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none min-h-[40px] text-base"
                    />
                </FormControl>
                <FormMessage className="pl-2 pb-1"/>
              </FormItem>
            )}
          />

          <div className="flex justify-end items-center gap-2 pt-1">
             <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                <FormItem>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground"
                            >
                            <CalendarIcon className="h-5 w-5" />
                            <span className="sr-only">Pick date</span>
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
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
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                <FormItem>
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
                        <SelectTrigger className="h-9 w-9 p-2 rounded-full border-none bg-transparent hover:bg-muted text-muted-foreground focus:ring-0 focus:ring-offset-0">
                            <SelectValue>
                                {assigneesForDropdown.find(a => a.id === field.value)?.name.charAt(0) || <UserPlus className='h-5 w-5'/>}
                            </SelectValue>
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent align='end'>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        <SelectSeparator />
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
            
            <Button 
                type="submit" 
                size="icon" 
                className="h-9 w-9 rounded-full shrink-0" 
                disabled={isSubmitting || !currentUserId}
            >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
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
