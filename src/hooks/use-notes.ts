'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotes as getNotesFromDb, createNote as createNoteInDb, updateNote as updateNoteInDb, deleteNote as deleteNoteInDb } from '@/lib/notes';
import { getCache, setCache } from '@/lib/cache-utils';
import type { Note } from '@/types';

// --- Query Keys ---
const noteKeys = {
  all: (userId: string) => ['notes', userId] as const,
  list: (userId: string) => [...noteKeys.all(userId), 'list'] as const,
};

// --- Custom Hooks ---

export function useNotes(userId: string | null | undefined) {
  const queryKey = noteKeys.list(userId!);
  
  const queryFn = async () => {
    // Try to get from cache first
    const cachedData = getCache<Note[]>(`notes_${userId}`);
    if (cachedData) {
      console.log('Notes loaded from cache');
      return cachedData;
    }
    
    // Fetch from database if not in cache
    const data = await getNotesFromDb(userId!);
    
    // Cache the result
    setCache(`notes_${userId}`, data);
    
    return data;
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

type CreateNotePayload = Parameters<typeof createNoteInDb>[1];

export function useCreateNote(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = noteKeys.list(userId!);

  const mutationFn = createNoteInDb;

  return useMutation({
    mutationFn: (newNoteData: CreateNotePayload) => {
      if (!userId) throw new Error("User not authenticated");
      return mutationFn(userId, newNoteData);
    },
    onMutate: async (newNoteData) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotes = queryClient.getQueryData<Note[]>(queryKey);
      
      // Note: We're not creating an optimistic note here because of the complex type structure
      // The actual note will be fetched after creation
      return { previousNotes };
    },
    onError: (_err, _newNote, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotes);
    },
    onSuccess: (newNote) => {
      // Update cache with new note
      const cachedNotes = getCache<Note[]>(`notes_${userId}`);
      if (cachedNotes) {
        setCache(`notes_${userId}`, [newNote, ...cachedNotes]);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

type UpdateNotePayload = { id: string; updates: Parameters<typeof updateNoteInDb>[2] };

export function useUpdateNote(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = noteKeys.list(userId!);
  
  const mutationFn = updateNoteInDb;

  return useMutation({
    mutationFn: ({ id, updates }: UpdateNotePayload) => {
      if (!userId) throw new Error("User not authenticated");
      return mutationFn(userId, id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotes = queryClient.getQueryData<Note[]>(queryKey);
      queryClient.setQueryData<Note[]>(queryKey, (old = []) =>
        old.map(note => {
          if (note.id === id) {
            // Create a new note object with the updates
            const updatedNote = { ...note };
            
            // Apply updates
            Object.keys(updates).forEach(key => {
              const typedKey = key as keyof Note;
              (updatedNote as any)[typedKey] = (updates as any)[typedKey];
            });
            
            return updatedNote;
          }
          return note;
        })
      );
      return { previousNotes };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotes);
    },
    onSuccess: (updatedNote) => {
      // Update cache with updated note
      const cachedNotes = getCache<Note[]>(`notes_${userId}`);
      if (cachedNotes) {
        const updatedNotes = cachedNotes.map(note => 
          note.id === updatedNote?.id ? updatedNote : note
        );
        setCache(`notes_${userId}`, updatedNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteNote(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = noteKeys.list(userId!);

  const mutationFn = deleteNoteInDb;

  return useMutation({
    mutationFn: (noteId: string) => {
      if (!userId) throw new Error("User not authenticated");
      return mutationFn(userId, noteId);
    },
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotes = queryClient.getQueryData<Note[]>(queryKey);
      queryClient.setQueryData<Note[]>(queryKey, (old = []) =>
        old.filter(note => note.id !== noteId)
      );
      return { previousNotes };
    },
    onError: (_err, _noteId, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotes);
    },
    onSuccess: (_, noteId) => {
      // Update cache by removing deleted note
      const cachedNotes = getCache<Note[]>(`notes_${userId}`);
      if (cachedNotes) {
        const updatedNotes = cachedNotes.filter(note => note.id !== noteId);
        setCache(`notes_${userId}`, updatedNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}