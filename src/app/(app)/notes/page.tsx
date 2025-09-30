
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
  description: z.string().max(2000, 'Description is too long').optional(),
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
      <div className="relative no-print" style={{ position: 'relative', zIndex: '1' }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search notes by title or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 note-list-container">
          {filteredNotes.map(note => {
            const isNoteLocked = note.isLocked && !unlockedNoteIds.has(note.id);
            return (
              <Card key={note.id} id={`note-${note.id}`} className="flex flex-col bg-card/60 shadow-md hover:shadow-lg transition-shadow printable-note-card">
                <CardHeader className="printable-note-header pb-2">
                  <div className="flex justify-between items-start gap-4">
                     <CardTitle className="text-xl font-headline font-bold break-words flex-1 printable-note-title">
                      {note.title}
                    </CardTitle>
                    <div className="no-print">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
                   <Separator className="mt-2" />
                </CardHeader>
                <CardContent className="flex-grow printable-note-content pt-4">
                  {isNoteLocked ? (
                      <div className="flex items-center justify-center h-full min-h-[80px] text-muted-foreground/50">
                        <Lock className="h-12 w-12" />
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground whitespace-pre-wrap break-words">{note.description}</p>
                  )}
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground/80 pt-2 printable-note-footer mt-auto">
                   <div className="flex items-center gap-1">
                     <Clock className="h-3 w-3"/> 
                     <span>Last updated: {format(new Date(note.updatedAt), "MMM d, yyyy 'at' p")}</span>
                   </div>
                 </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-card/60 no-print">
          <NotesIcon className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold">No notes found</h3>
          <p>{searchTerm ? 'Try adjusting your search term.' : 'Click the "+" button to get started.'}</p>
        </div>
      )}

      <Button asChild
        style={{position: 'sticky', bottom: '30px', right: '0px', left: '1200px', zIndex: '9999', }}
        className=" h-16 w-16 rounded-full shadow-lg z-50 flex items-center justify-center no-print"
        aria-label="Create new note"
      >
        <Link href="/notes/new">
          <Plus className="h-8 w-8" />
        </Link>
      </Button>

      {editingNote && (
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="w-[80vw] max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
              <DialogDescription>
                Update the details of your note.
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
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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
    </div>
  );
}

    
