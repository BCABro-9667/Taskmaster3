
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotes as getNotesFromDb, createNote as createNoteInDb, updateNote as updateNoteInDb, deleteNote as deleteNoteInDb } from '@/lib/notes';
import { getLocalNotes, createLocalNote, updateLocalNote, deleteLocalNote } from '@/lib/local-storage/notes';
import type { Note } from '@/types';
import { useStorageMode } from './use-storage-mode';

// --- Query Keys ---
const noteKeys = {
  all: (userId: string, mode: 'db' | 'local') => ['notes', userId, mode] as const,
  list: (userId: string, mode: 'db' | 'local') => [...noteKeys.all(userId, mode), 'list'] as const,
};

// --- Custom Hooks ---

export function useNotes(userId: string | null | undefined) {
  const { storageMode } = useStorageMode();
  const queryKey = noteKeys.list(userId!, storageMode);
  
  const queryFn = storageMode === 'db' ? getNotesFromDb : getLocalNotes;

  return useQuery({
    queryKey,
    queryFn: () => queryFn(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

type CreateNotePayload = Parameters<typeof createNoteInDb>[1];

export function useCreateNote(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = noteKeys.list(userId!, storageMode);

  const mutationFn = storageMode === 'db' ? createNoteInDb : createLocalNote;

  return useMutation({
    mutationFn: (newNoteData: CreateNotePayload) => {
      if (!userId) throw new Error("User not authenticated");
      return mutationFn(userId, newNoteData);
    },
    onMutate: async (newNoteData) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotes = queryClient.getQueryData<Note[]>(queryKey);
      
      const optimisticNote: Note = {
        id: `temp-${Date.now()}`,
        ...newNoteData,
        description: newNoteData.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId!,
        isLocked: false,
      };

      queryClient.setQueryData<Note[]>(queryKey, (old = []) => [optimisticNote, ...old]);
      return { previousNotes };
    },
    onError: (_err, _newNote, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

type UpdateNotePayload = { id: string; updates: Parameters<typeof updateNoteInDb>[2] };

export function useUpdateNote(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = noteKeys.list(userId!, storageMode);
  
  const mutationFn = storageMode === 'db' ? updateNoteInDb : updateLocalNote;

  return useMutation({
    mutationFn: ({ id, updates }: UpdateNotePayload) => {
      if (!userId) throw new Error("User not authenticated");
      return mutationFn(userId, id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotes = queryClient.getQueryData<Note[]>(queryKey);
      queryClient.setQueryData<Note[]>(queryKey, (old = []) =>
        old.map(note =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note
        )
      );
      return { previousNotes };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousNotes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteNote(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = noteKeys.list(userId!, storageMode);

  const mutationFn = storageMode === 'db' ? deleteNoteInDb : deleteLocalNote;

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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
