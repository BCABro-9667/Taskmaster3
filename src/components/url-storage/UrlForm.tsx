
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateUrl, useUpdateUrl } from '@/hooks/use-url-storage';
import { useToast } from '@/hooks/use-toast';
import type { Url, UrlCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, ArrowUp, Link2, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import { CategoryActionMenu } from './CategoryActionMenu';
import { CategoryModal } from './CategoryModal';

const urlFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  url: z.string().url('Please enter a valid URL.'),
  categoryId: z.string(),
});

type UrlFormValues = z.infer<typeof urlFormSchema>;

interface UrlFormProps {
  categories: UrlCategory[];
  urlToEdit?: Url;
  onFinished?: () => void;
}

const CREATE_NEW_CATEGORY_VALUE = '__CREATE_NEW__';

export function UrlForm({ categories, urlToEdit, onFinished }: UrlFormProps) {
  const { toast } = useToast();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const { mutate: createUrl, isPending: isCreating } = useCreateUrl();
  const { mutate: updateUrl, isPending: isUpdating } = useUpdateUrl();

  const isPending = isCreating || isUpdating;

  const form = useForm<UrlFormValues>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      title: urlToEdit?.title || '',
      url: urlToEdit?.url || '',
      categoryId: urlToEdit?.categoryId || 'all',
    },
  });

  const handleCategorySelect = (value: string) => {
    if (value === CREATE_NEW_CATEGORY_VALUE) {
      setIsCategoryModalOpen(true);
    } else {
      form.setValue('categoryId', value);
    }
  };

  const shortenUrl = () => {
    toast({ title: 'Coming Soon!', description: 'URL shortener functionality will be implemented in a future update.' });
  };
  
  const onSubmit = (data: UrlFormValues) => {
    if (urlToEdit) {
      updateUrl({ id: urlToEdit.id, updates: data }, {
        onSuccess: () => {
          toast({ variant: 'success', title: 'URL Updated' });
          onFinished?.();
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
      });
    } else {
      createUrl(data, {
        onSuccess: () => {
          toast({ variant: 'success', title: 'URL Saved' });
          form.reset({ title: '', url: '', categoryId: data.categoryId });
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
      });
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Title" {...field} className="text-base" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="relative flex items-center">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} className="text-base pl-4 pr-[180px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="absolute right-2 flex items-center gap-1">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={handleCategorySelect} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-[100px] h-9">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectSeparator />
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id} className="group/item">
                             <div className="flex justify-between items-center w-full">
                                <span>{cat.name}</span>
                                <CategoryActionMenu category={cat} triggerClass="opacity-0 group-hover/item:opacity-100" />
                             </div>
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value={CREATE_NEW_CATEGORY_VALUE}>
                          <div className="flex items-center text-primary">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
               <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={shortenUrl}>
                  <Link2 />
               </Button>
               <Button type="submit" size="icon" className="h-9 w-9" disabled={isPending}>
                 {isPending ? <Loader2 className="animate-spin" /> : <ArrowUp />}
               </Button>
            </div>
          </div>
        </form>
      </Form>
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
      />
    </>
  );
}
