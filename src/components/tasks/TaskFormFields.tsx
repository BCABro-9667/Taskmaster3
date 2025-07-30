
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
import { CalendarIcon, UserPlus } from 'lucide-react';
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
import type { Assignee } from '@/types'; 
import type { TaskFormValues } from './TaskFormSchema';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

const CREATE_NEW_ASSIGNEE_VALUE = "__CREATE_NEW_ASSIGNEE__";

interface TaskFormFieldsProps {
  control: Control<TaskFormValues>;
  setValue: UseFormSetValue<TaskFormValues>;
  assignableUsers: Assignee[]; 
  onOpenCreateAssigneeDialog: () => void;
  currentUserId: string; 
}

export function TaskFormFields({
  control,
  setValue,
  assignableUsers, 
  onOpenCreateAssigneeDialog,
  currentUserId 
}: TaskFormFieldsProps) {

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
                disabled={!currentUserId} // Disable if no currentUserId
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an assignee" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {assignableUsers.map((assignee) => ( 
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
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
