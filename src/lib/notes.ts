
'use server';

import type { Note } from '@/types';
import dbConnect from './db';
import NoteModel from '@/models/Note';
import mongoose from 'mongoose';


// Helper to process lean query result
function processLeanNote(note: any): Note {
  const plainNote = {
    ...note,
    id: note._id.toString(),
    createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
    updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
    createdBy: note.createdBy.toString(),
  };
  delete plainNote._id;
  delete plainNote.__v;
  return plainNote as Note;
}


export async function getNotes(userId: string): Promise<Note[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error('Invalid or missing userId for getNotes');
    return [];
  }
  await dbConnect();
  const noteDocs = await NoteModel.find({ createdBy: new mongoose.Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .lean();

  return noteDocs.map(processLeanNote);
}

export async function createNote(userId: string, noteData: Pick<Note, 'title' | 'description'>): Promise<Note> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('User ID is invalid or missing for note creation.');
  }
  await dbConnect();
  
  const newNoteDoc = new NoteModel({
    ...noteData,
    createdBy: new mongoose.Types.ObjectId(userId),
    isLocked: false, // Default to unlocked
  });
  await newNoteDoc.save();
  
  const createdNote = await NoteModel.findById(newNoteDoc._id).lean();
   if(!createdNote) {
    throw new Error('Failed to retrieve newly created note.');
  }
  
  return processLeanNote(createdNote);
}

type NoteUpdatePayload = Partial<Pick<Note, 'title' | 'description' | 'isLocked'>>;

export async function updateNote(userId: string, noteId: string, updates: NoteUpdatePayload): Promise<Note | null> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(noteId)) {
        return null;
    }
    await dbConnect();

    const updatedNoteDoc = await NoteModel.findOneAndUpdate(
        { _id: noteId, createdBy: new mongoose.Types.ObjectId(userId) },
        { $set: updates },
        { new: true }
    ).lean();

    return updatedNoteDoc ? processLeanNote(updatedNoteDoc) : null;
}

export async function deleteNote(userId: string, noteId: string): Promise<{ deletedNoteId: string }> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(noteId)) {
    throw new Error('Invalid ID provided for deletion.');
  }

  await dbConnect();
  const result = await NoteModel.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(noteId),
    createdBy: new mongoose.Types.ObjectId(userId),
  }).lean();

  if (!result) {
    throw new Error("Note not found, or you don't have permission to delete it.");
  }
  return { deletedNoteId: noteId };
}
