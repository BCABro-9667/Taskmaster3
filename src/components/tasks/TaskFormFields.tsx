
'use client';
import type { Control, UseFormSetValue } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Sparkles, UserPlus } from 'lucide-react';
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
import type { Assignee } from '@/types'; // Changed User to Assignee
import type { TaskFormValues } from './TaskFormSchema';
import { format, parseISO } from 'date-fns';
import { suggestDeadline } from '@/ai/flows/suggest-deadline';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const CREATE_NEW_ASSIGNEE_VALUE = "__CREATE_NEW_ASSIGNEE__";

interface TaskFormFieldsProps {
  control: Control<TaskFormValues>;
  setValue: UseFormSetValue<TaskFormValues>;
  assignableUsers: Assignee[]; // Changed User[] to Assignee[]
  onOpenCreateAssigneeDialog: () => void;
  isSubmittingAi?: boolean;
  setIsSubmittingAi?: (isSubmitting: boolean) => void;
  currentTaskTitle?: string;
}

export function TaskFormFields({
  control,
  setValue,
  assignableUsers, // Prop name remains, type changed
  onOpenCreateAssigneeDialog,
  isSubmittingAi,
  setIsSubmittingAi,
  currentTaskTitle
}: TaskFormFieldsProps) {
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSuggestDeadline = async () => {
    if (setIsSubmittingAi) setIsSubmittingAi(true);
    const taskTitle = currentTaskTitle || control._getWatch('title');
    if (!taskTitle) {
      toast({
        variant: 'destructive',
        title: 'Cannot Suggest Deadline',
        description: 'Please enter a task title first.',
      });
      if (setIsSubmittingAi) setIsSubmittingAi(false);
      return;
    }

    try {
      const workload = "moderate workload, several other small tasks pending";
      const result = await suggestDeadline({ taskDetails: taskTitle, currentWorkload: workload });

      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (result.suggestedDeadline && datePattern.test(result.suggestedDeadline)) {
        setValue('deadline', result.suggestedDeadline, { shouldValidate: true });
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
      if (setIsSubmittingAi) setIsSubmittingAi(false);
    }
  };

  return (
    <>
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Finalize project report" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign To (Optional)</FormLabel>
              <Select
                onValueChange={(value) => {
                  if (value === CREATE_NEW_ASSIGNEE_VALUE) {
                    onOpenCreateAssigneeDialog();
                  } else {
                    field.onChange(value);
                  }
                }}
                value={field.value || 'unassigned'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an assignee" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {assignableUsers.map((assignee) => ( // Iterate over assignees
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
          control={control}
          name="deadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-1">Deadline</FormLabel>
              <div className="flex items-center gap-2">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(parseISO(field.value), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => {
                        setValue('deadline', date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true });
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} 
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {setIsSubmittingAi && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleSuggestDeadline}
                    disabled={isSubmittingAi || !control._getWatch('title')}
                    aria-label="Suggest Deadline with AI"
                    title={!control._getWatch('title') ? "Enter task title to suggest deadline" : "Suggest Deadline with AI"}
                    className="shrink-0"
                  >
                    {isSubmittingAi ? <Sparkles className="h-4 w-4 animate-ping" /> : <Sparkles className="h-4 w-4 text-accent" />}
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
