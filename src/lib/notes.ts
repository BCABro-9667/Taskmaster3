
'use server';

import type { Note } from '@/types';
import dbConnect from './db';
import NoteModel from '@/models/Note';
import mongoose from 'mongoose';

// Helper to convert lean object ID to string 'id'
function leanToPlain<T extends { _id: mongoose.Types.ObjectId }>(doc: T | null): Omit<T, '_id'> & { id: string } | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as Omit<T, '_id'> & { id: string };
}

function leanArrayToPlain<T extends { _id: mongoose.Types.ObjectId }>(docs: T[]): (Omit<T, '_id'> & { id: string })[] {
  return docs.map(doc => leanToPlain(doc)!)
}

// Helper to process lean query result
function processLeanNote(note: any): Note {
  const plainNote = {
    ...note,
    id: note._id.toString(),
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

export async function createNote(userId: string, noteData: Pick<Note, 'title' | 'description' | 'category'>): Promise<Note> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('User ID is invalid or missing for note creation.');
  }
  await dbConnect();
  
  const newNoteDoc = new NoteModel({
    ...noteData,
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  await newNoteDoc.save();
  
  return processLeanNote(newNoteDoc.toObject());
}

export async function updateNote(userId: string, noteId: string, updates: Partial<Pick<Note, 'title' | 'description' | 'category'>>): Promise<Note | null> {
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
