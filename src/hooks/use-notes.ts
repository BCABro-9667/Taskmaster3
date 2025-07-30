
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotes, createNote, updateNote, deleteNote } from '@/lib/notes';
import type { Note } from '@/types';

// --- Query Keys ---
const noteKeys = {
  all: (userId: string) => ['notes', userId] as const,
  list: (userId: string) => [...noteKeys.all(userId), 'list'] as const,
};

// --- Custom Hooks ---

export function useNotes(userId: string | null | undefined) {
  return useQuery({
    queryKey: noteKeys.list(userId!),
    queryFn: () => getNotes(userId!),
    enabled: !!userId,
  });
}

type CreateNotePayload = Parameters<typeof createNote>[1];

export function useCreateNote(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newNoteData: CreateNotePayload) => {
      if (!userId) throw new Error("User not authenticated");
      return createNote(userId, newNoteData);
    },
    onMutate: async (newNoteData) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.list(userId!) });
      const previousNotes = queryClient.getQueryData<Note[]>(noteKeys.list(userId!));
      
      const optimisticNote: Note = {
        id: `temp-${Date.now()}`,
        ...newNoteData,
        description: newNoteData.description || '',
        category: newNoteData.category || 'General',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId!,
      };

      queryClient.setQueryData<Note[]>(noteKeys.list(userId!), (old = []) => [optimisticNote, ...old]);
      return { previousNotes };
    },
    onError: (_err, _newNote, context) => {
      queryClient.setQueryData(noteKeys.list(userId!), context?.previousNotes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.list(userId!) });
    },
  });
}

type UpdateNotePayload = { id: string; updates: Parameters<typeof updateNote>[2] };

export function useUpdateNote(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: UpdateNotePayload) => {
      if (!userId) throw new Error("User not authenticated");
      return updateNote(userId, id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.list(userId!) });
      const previousNotes = queryClient.getQueryData<Note[]>(noteKeys.list(userId!));
      queryClient.setQueryData<Note[]>(noteKeys.list(userId!), (old = []) =>
        old.map(note =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note
        )
      );
      return { previousNotes };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(noteKeys.list(userId!), context?.previousNotes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.list(userId!) });
    },
  });
}

export function useDeleteNote(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => {
      if (!userId) throw new Error("User not authenticated");
      return deleteNote(userId, noteId);
    },
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.list(userId!) });
      const previousNotes = queryClient.getQueryData<Note[]>(noteKeys.list(userId!));
      queryClient.setQueryData<Note[]>(noteKeys.list(userId!), (old = []) =>
        old.filter(note => note.id !== noteId)
      );
      return { previousNotes };
    },
    onError: (_err, _noteId, context) => {
      queryClient.setQueryData(noteKeys.list(userId!), context?.previousNotes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.list(userId!) });
    },
  });
}
