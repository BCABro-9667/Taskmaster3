
'use client';

import { useMemo, useState } from 'react';
import type { Note, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search, Edit, Trash2, StickyNote as NotesIcon, Tag, Clock, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getCurrentUser } from '@/lib/client-auth';
import { useLoadingBar } from '@/hooks/use-loading-bar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/use-notes';

const noteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  category: z.string().max(30, 'Category is too long').optional(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

export default function NotesPage() {
  const currentUser: User | null = getCurrentUser();
  const { toast } = useToast();
  
  const { data: notes = [], isLoading } = useNotes(currentUser?.id);
  const { mutate: createNote, isPending: isCreating } = useCreateNote(currentUser?.id);
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote(currentUser?.id);
  const { mutate: deleteNote } = useDeleteNote(currentUser?.id);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'General',
    }
  });
  
  const openCreateDialog = () => {
    setEditingNote(null);
    form.reset({ title: '', description: '', category: 'General' });
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    form.reset({
      title: note.title,
      description: note.description,
      category: note.category,
    });
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit: SubmitHandler<NoteFormValues> = async (data) => {
    const callback = {
      onSuccess: () => {
        setIsFormDialogOpen(false);
        toast({ title: `Note ${editingNote ? 'updated' : 'created'} successfully` });
      },
      onError: (error: Error) => {
        toast({
          variant: 'destructive',
          title: `Error ${editingNote ? 'updating' : 'creating'} note`,
          description: error.message,
        });
      },
    };

    if (editingNote) {
      updateNote({ id: editingNote.id, updates: data }, callback);
    } else {
      createNote(data, callback);
    }
  };

  const confirmDeleteNote = async () => {
    if (!deletingNote) return;
    deleteNote(deletingNote.id, {
      onSuccess: () => {
        toast({ title: 'Note Deleted', description: `"${deletingNote.title}" has been removed.` });
        setDeletingNote(null);
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Error Deleting Note',
          description: error.message,
        });
        setDeletingNote(null);
      }
    });
  };

  const filteredNotes = useMemo(() => {
    const sortedNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (!searchTerm) return sortedNotes;
    
    return sortedNotes.filter(note =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.description && note.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (note.category && note.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [notes, searchTerm]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground">Please log in to manage your notes.</p>
        <Button onClick={() => window.location.href = '/'} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }
  
  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <NotesIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-primary">My Notes</h1>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search notes by title, content, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => (
            <Card key={note.id} className="flex flex-col bg-card/60 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="break-words flex-1">
                    {note.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Note options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openEditDialog(note)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive" 
                        onSelect={() => setDeletingNote(note)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                   <Tag className="h-3 w-3" /> 
                   <Badge variant="outline">{note.category || 'Uncategorized'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{note.description}</p>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground/80 mt-auto">
                <div className="flex items-center gap-1">
                   <Clock className="h-3 w-3"/> 
                  <span>Last updated: {format(new Date(note.updatedAt), "MMM d, yyyy 'at' p")}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-card/60">
          <NotesIcon className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold">No notes found</h3>
          <p>{searchTerm ? 'Try adjusting your search term.' : 'Click the "+" button to get started.'}</p>
        </div>
      )}

      <Button
        onClick={openCreateDialog}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg z-50 flex items-center justify-center"
        aria-label="Create new note"
      >
        <Plus className="h-8 w-8 text-white" />
      </Button>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Create a New Note'}</DialogTitle>
            <DialogDescription>
              {editingNote ? 'Update the details of your note.' : 'Fill in the details for your new note.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Note title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Work, Personal, Ideas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Type your note here..." className="min-h-[150px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {deletingNote && (
         <AlertDialog open={!!deletingNote} onOpenChange={(isOpen) => !isOpen && setDeletingNote(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the note titled "{deletingNote.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingNote(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteNote}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
