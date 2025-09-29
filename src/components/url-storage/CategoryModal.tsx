
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateUrlCategory, useUpdateUrlCategory } from '@/hooks/use-url-storage';
import { useToast } from '@/hooks/use-toast';
import type { UrlCategory } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const categoryFormSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters.'),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  categoryToEdit?: UrlCategory;
}

export function CategoryModal({ isOpen, onOpenChange, categoryToEdit }: CategoryModalProps) {
  const { toast } = useToast();
  const { mutate: createCategory, isPending: isCreating } = useCreateUrlCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateUrlCategory();

  const isPending = isCreating || isUpdating;
  const isEditing = !!categoryToEdit;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (isEditing) {
      form.setValue('name', categoryToEdit.name);
    } else {
      form.reset({ name: '' });
    }
  }, [isOpen, isEditing, categoryToEdit, form]);

  const onSubmit = (data: CategoryFormValues) => {
    if (isEditing) {
      updateCategory({ id: categoryToEdit.id, name: data.name }, {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Category Updated' });
          onOpenChange(false);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
      });
    } else {
      createCategory(data.name, {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Category Created' });
          onOpenChange(false);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Enter a new name for "${categoryToEdit.name}".` : "What should the new category be called?"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Design Resources" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
