
'use client';

import { useState } from 'react';
import type { Url, UrlCategory } from '@/types';
import { useDeleteUrl } from '@/hooks/use-url-storage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Edit, Trash2, Copy, Globe } from 'lucide-react';
import { UrlForm } from './UrlForm';
import { getCurrentUser } from '@/lib/client-auth';

interface UrlListProps {
  urls: Url[];
  categories: UrlCategory[];
}

export function UrlList({ urls, categories }: UrlListProps) {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const { mutate: deleteUrl } = useDeleteUrl(currentUser?.id);
  const [urlToDelete, setUrlToDelete] = useState<Url | null>(null);
  const [urlToEdit, setUrlToEdit] = useState<Url | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ variant: 'success', title: 'Copied to clipboard!' });
    }, (err) => {
      toast({ variant: 'destructive', title: 'Failed to copy', description: err.message });
    });
  };
  
  const handleDeleteConfirm = () => {
    if (!urlToDelete) return;
    deleteUrl(urlToDelete.id, {
        onSuccess: () => {
            toast({ title: 'URL Deleted' });
            setUrlToDelete(null);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
    });
  };

  if (urls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed border-border rounded-lg bg-card/60">
        <Globe className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-1 font-headline">No URLs Found</h3>
        <p className="text-muted-foreground">Saved URLs for this category will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {urls.map(url => (
          <Card key={url.id} className="bg-card/80">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <a href={url.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate">
                    {url.url}
                  </a>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(url.url)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground truncate">{url.title}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setUrlToEdit(url)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setUrlToDelete(url)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit URL Dialog */}
      <Dialog open={!!urlToEdit} onOpenChange={(isOpen) => !isOpen && setUrlToEdit(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit URL</DialogTitle>
            </DialogHeader>
            {urlToEdit && <UrlForm categories={categories} urlToEdit={urlToEdit} onFinished={() => setUrlToEdit(null)} />}
        </DialogContent>
      </Dialog>
      

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!urlToDelete} onOpenChange={(isOpen) => !isOpen && setUrlToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the URL titled "{urlToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
