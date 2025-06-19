'use client';
import type { Control } from 'react-hook-form';
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
import { CalendarIcon, Sparkles } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import type { TaskFormValues } from './TaskFormSchema';
import { format, parseISO } from 'date-fns';
import { suggestDeadline } from '@/ai/flows/suggest-deadline';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface TaskFormFieldsProps {
  control: Control<TaskFormValues>;
  assignableUsers: User[];
  isSubmittingAi?: boolean;
  setIsSubmittingAi?: (isSubmitting: boolean) => void;
  currentTaskTitle?: string;
}

export function TaskFormFields({ control, assignableUsers, isSubmittingAi, setIsSubmittingAi, currentTaskTitle }: TaskFormFieldsProps) {
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
        control.setValue('deadline', result.suggestedDeadline, { shouldValidate: true });
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
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
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
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
                    disabled={isSubmittingAi}
                    aria-label="Suggest Deadline with AI"
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
