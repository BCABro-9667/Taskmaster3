
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Note, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search, Edit, Trash2, StickyNote as NotesIcon, Clock, MoreVertical, Printer, Lock, Unlock as UnlockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { QuillEditor } from '@/components/notes/QuillEditor';
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
import { format } from 'date-fns';
import { getCurrentUser } from '@/lib/client-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotes, useUpdateNote, useDeleteNote } from '@/hooks/use-notes';
import { cn } from '@/lib/utils';
import { UnlockDialog } from '@/components/notes/UnlockDialog';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';


const noteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().optional(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

type UnlockAction = 'view' | 'remove_lock';

export default function NotesPage() {
  const currentUser: User | null = getCurrentUser();
  const { toast } = useToast();
  
  const { data: notes = [], isLoading } = useNotes(currentUser?.id);
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote(currentUser?.id);
  const { mutate: deleteNote } = useDeleteNote(currentUser?.id);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  
  // State for locked notes
  const [unlockedNoteIds, setUnlockedNoteIds] = useState<Set<string>>(new Set());
  const [unlockingNote, setUnlockingNote] = useState<Note | null>(null);
  const [unlockAction, setUnlockAction] = useState<UnlockAction>('view');
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  
  const handleUnlockRequest = (note: Note, action: UnlockAction) => {
    setUnlockAction(action);
    setUnlockingNote(note);
  };
  
  const handlePinSuccess = (noteId: string) => {
    if (unlockAction === 'view') {
        setUnlockedNoteIds(prev => new Set(prev).add(noteId));
        toast({ title: "Note Unlocked", description: "You can now view the note content." });
    } else if (unlockAction === 'remove_lock') {
        updateNote({ id: noteId, updates: { isLocked: false } }, {
            onSuccess: () => {
                setUnlockedNoteIds(prev => new Set(prev).add(noteId));
                toast({ title: "Lock Removed", description: "The note is now permanently unlocked." });
            },
            onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
        });
    }
    setUnlockingNote(null);
  };


  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: '',
      description: '',
    }
  });

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    form.reset({
      title: note.title,
      description: note.description,
    });
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit: SubmitHandler<NoteFormValues> = async (data) => {
    if (!editingNote) return;

    updateNote({ id: editingNote.id, updates: data }, {
      onSuccess: () => {
        setIsFormDialogOpen(false);
        toast({ title: `Note updated successfully` });
      },
      onError: (error: Error) => {
        toast({
          variant: 'destructive',
          title: `Error updating note`,
          description: error.message,
        });
      },
    });
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

  const toggleLock = (note: Note) => {
    const newLockState = !note.isLocked;
    updateNote({ id: note.id, updates: { isLocked: newLockState } }, {
      onSuccess: () => {
        if (!newLockState) {
          // If we are unlocking, add to the set of unlocked notes
          setUnlockedNoteIds(prev => new Set(prev).add(note.id));
        } else {
          // If we are locking, remove from the set
          setUnlockedNoteIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(note.id);
            return newSet;
          });
        }
        toast({ title: newLockState ? "Note Locked" : "Note Unlocked Permanently" });
      },
      onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    });
  };


  const filteredNotes = useMemo(() => {
    const sortedNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (!searchTerm) return sortedNotes;
    
    return sortedNotes.filter(note =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.description && note.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [notes, searchTerm]);

  const handlePrintNote = (noteId: string) => {
    const noteElement = document.getElementById(`note-${noteId}`);
    if (noteElement) {
      const onAfterPrint = () => {
        document.body.classList.remove('printing-note');
        noteElement.classList.remove('note-to-print');
        window.removeEventListener('afterprint', onAfterPrint);
      };

      window.addEventListener('afterprint', onAfterPrint);
      
      document.body.classList.add('printing-note');
      noteElement.classList.add('note-to-print');
      
      window.print();
    }
  };
  
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
  
  const isSubmitting = isUpdating;

  return (
    <div className="space-y-8">
      <div className="relative no-print flex items-center gap-3" style={{ position: 'relative', zIndex: '1' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search notes by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Button asChild size="default" className="flex-shrink-0">
          <Link href="/notes/new">
            <Plus className="mr-2 h-5 w-5" />
            Create Note
          </Link>
        </Button>
      </div>
      
      {filteredNotes.length > 0 ? (
        <div className="flex flex-col gap-3 note-list-container">
          {filteredNotes.map(note => {
            const isNoteLocked = note.isLocked && !unlockedNoteIds.has(note.id);
            
            // Strip HTML tags and truncate to 30 characters
            const stripHtml = (html: string) => {
              const tmp = document.createElement('div');
              tmp.innerHTML = html;
              return tmp.textContent || tmp.innerText || '';
            };
            const plainDescription = stripHtml(note.description || '');
            const truncatedDescription = plainDescription.length > 30 
              ? plainDescription.substring(0, 30) + '...' 
              : plainDescription;
            
            return (
              <Card 
                key={note.id} 
                id={`note-${note.id}`} 
                className="w-full bg-card/60 shadow-sm hover:shadow-md transition-all cursor-pointer printable-note-card"
                onClick={() => {
                  if (isNoteLocked) {
                    handleUnlockRequest(note, 'view');
                  } else {
                    setViewingNote(note);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-4 p-4">
                  {/* Title and Description Section */}
                  <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-semibold truncate printable-note-title mb-1">
                      {note.title}
                    </h3>
                    {isNoteLocked ? (
                      <div className="flex items-center gap-2 text-muted-foreground/50">
                        <Lock className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm italic">Locked</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground truncate printable-note-content">
                        {truncatedDescription || 'No content'}
                      </p>
                    )}
                  </div>
                  
                  {/* Action Menu */}
                  <div className="flex-shrink-0 no-print">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Note options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEditDialog(note)} disabled={isNoteLocked}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handlePrintNote(note.id)} disabled={isNoteLocked}>
                          <Printer className="mr-2 h-4 w-4" />
                          <span>Print</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => {
                          if (isNoteLocked) {
                            handleUnlockRequest(note, 'view');
                          } else {
                            toggleLock(note);
                          }
                        }}>
                          {isNoteLocked ? (
                            <UnlockIcon className="mr-2 h-4 w-4" />
                          ) : (
                            <Lock className="mr-2 h-4 w-4" />
                          )}
                          <span>{isNoteLocked ? 'Unlock Note' : 'Lock Note'}</span>
                        </DropdownMenuItem>
                        {isNoteLocked && (
                          <DropdownMenuItem onSelect={() => handleUnlockRequest(note, 'remove_lock')}>
                            <UnlockIcon className="mr-2 h-4 w-4" />
                            <span>Remove Lock</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
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
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-card/60 no-print">
          <NotesIcon className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold">No notes found</h3>
          <p>{searchTerm ? 'Try adjusting your search term.' : 'Click the "Create Note" button to get started.'}</p>
        </div>
      )}

      {editingNote && (
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none">
            {/* Header Bar */}
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold">Edit Note</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update the details of your note
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  onClick={form.handleSubmit(handleFormSubmit)}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                  <span className="sr-only">Save</span>
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsFormDialogOpen(false)}
                  className="h-9 w-9"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  <span className="sr-only">Cancel</span>
                </Button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="overflow-y-auto h-[calc(100vh-80px)] px-8 md:px-16 lg:px-32 py-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Note title" {...field} className="text-lg py-6" />
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
                        <FormLabel className="text-lg font-semibold">Content</FormLabel>
                        <FormControl>
                          <div className="min-h-[500px]">
                            <QuillEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Type your note here..."
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
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

      {unlockingNote && currentUser && (
        <UnlockDialog
          isOpen={!!unlockingNote}
          onOpenChange={() => setUnlockingNote(null)}
          noteTitle={unlockingNote.title}
          userId={currentUser.id}
          onPinVerified={() => handlePinSuccess(unlockingNote.id)}
        />
      )}

      {viewingNote && (
        <Dialog open={!!viewingNote} onOpenChange={(isOpen) => !isOpen && setViewingNote(null)}>
          <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none">
            {/* Header Bar */}
            <div className="sticky top-0 bg-background border-b px-6 py-4 relative z-10">
              <div className="pr-24">
                <DialogTitle className="text-2xl font-bold mb-1">{viewingNote.title}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Last updated: {format(new Date(viewingNote.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
                </DialogDescription>
              </div>
              <div className="absolute top-4 right-6 flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setViewingNote(null);
                    openEditDialog(viewingNote);
                  }}
                  className="h-9 w-9"
                >
                  <Edit className="h-5 w-5" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setViewingNote(null)}
                  className="h-9 w-9"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="overflow-y-auto h-[calc(100vh-80px)] px-8 md:px-16 lg:px-32 py-8">
              <div 
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-p:leading-relaxed prose-p:mb-4 prose-headings:mb-3 prose-headings:mt-6"
                dangerouslySetInnerHTML={{ __html: viewingNote.description || '<p class="text-muted-foreground italic">No content</p>' }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    
