
import * as z from 'zod';
import { format } from 'date-fns';

export const taskFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(100, { message: 'Title must be 100 characters or less.' }),
  // Description is now handled separately
  assignedTo: z.string().optional(),
  deadline: z.string().refine((date) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()) && format(parsedDate, 'yyyy-MM-dd') === date;
  }, { message: 'Invalid date format. Use YYYY-MM-DD.' }),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const noteFormSchema = z.object({
  description: z.string().max(500, { message: 'Note must be 500 characters or less.' }).optional(),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;
