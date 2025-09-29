
'use client';

import { useDeleteUrlCategory } from '@/hooks/use-url-storage';
import { useToast } from '@/hooks/use-toast';
import type { UrlCategory } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteCategoryAlertProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  category: UrlCategory;
}

export function DeleteCategoryAlert({ isOpen, onOpenChange, category }: DeleteCategoryAlertProps) {
  const { toast } = useToast();
  const { mutate: deleteCategory, isPending } = useDeleteUrlCategory();

  const handleDelete = () => {
    deleteCategory(category.id, {
      onSuccess: () => {
        toast({ title: 'Category Deleted' });
        onOpenChange(false);
      },
      onError: (err) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the "{category.name}" category. URLs within this category will become uncategorized. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
