
import * as z from 'zod';
import { format } from 'date-fns';

export const taskFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }).max(100, { message: 'Title must be 100 characters or less.' }),
  description: z.string().max(500, { message: 'Description must be 500 characters or less.' }).optional(),
  assignedTo: z.string().optional(),
  deadline: z.string().refine((date) => {
    // Check if it's a valid date string in YYYY-MM-DD format
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    // Further check if it can be parsed into a valid date
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()) && format(parsedDate, 'yyyy-MM-dd') === date;
  }, { message: 'Invalid date format. Use YYYY-MM-DD.' }),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
