
import type { Note } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const NOTES_STORAGE_KEY = 'local_notes';

function getNotesFromStorage(userId: string): Note[] {
  if (typeof window === 'undefined') return [];
  const allNotes: { [key: string]: Note[] } = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}');
  return allNotes[userId] || [];
}

function saveNotesToStorage(userId: string, notes: Note[]) {
  if (typeof window === 'undefined') return;
  const allNotes: { [key: string]: Note[] } = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}');
  allNotes[userId] = notes;
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
}

export async function getLocalNotes(userId: string): Promise<Note[]> {
  return getNotesFromStorage(userId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function createLocalNote(userId: string, noteData: Pick<Note, 'title' | 'description'>): Promise<Note> {
  const notes = getNotesFromStorage(userId);
  const newNote: Note = {
    ...noteData,
    id: uuidv4(),
    isLocked: false,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const newNotes = [newNote, ...notes];
  saveNotesToStorage(userId, newNotes);
  return newNote;
}

type NoteUpdatePayload = Partial<Pick<Note, 'title' | 'description' | 'isLocked'>>;

export async function updateLocalNote(userId: string, noteId: string, updates: NoteUpdatePayload): Promise<Note | null> {
  let notes = getNotesFromStorage(userId);
  const noteIndex = notes.findIndex(n => n.id === noteId);

  if (noteIndex === -1) {
    return null;
  }

  const updatedNote = {
    ...notes[noteIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  notes[noteIndex] = updatedNote;
  saveNotesToStorage(userId, notes);
  return updatedNote;
}

export async function deleteLocalNote(userId: string, noteId: string): Promise<{ deletedNoteId: string }> {
  let notes = getNotesFromStorage(userId);
  const initialLength = notes.length;
  notes = notes.filter(n => n.id !== noteId);

  if (notes.length === initialLength) {
    throw new Error("Note not found in local storage.");
  }
  
  saveNotesToStorage(userId, notes);
  return { deletedNoteId: noteId };
}
