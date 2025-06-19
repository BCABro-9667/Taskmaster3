
'use server';
import type { User } from '@/types';
import dbConnect from './db';
import UserModel, { type IUserDocument } from '@/models/User';
// format from date-fns is not used here anymore

// Helper to convert Mongoose document to plain User object
function toPlainUser(userDoc: IUserDocument | null): User | null {
  if (!userDoc) return null;
  // Using toObject() which should apply transformations defined in the schema (like _id to id, removing __v and password)
  return userDoc.toObject() as User;
}

export async function login(email: string, password?: string): Promise<User | null> {
  await dbConnect();
  const userDoc = await UserModel.findOne({ email: email.toLowerCase() });

  if (userDoc && password) {
    const isMatch = await userDoc.comparePassword(password);
    if (isMatch) {
      return toPlainUser(userDoc); // Return user data; client will handle localStorage
    }
  }
  return null;
}

export async function register(name: string, email: string, password?: string): Promise<User | null> {
  await dbConnect();
  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  if (!password) {
    throw new Error('Password is required for registration.');
  }

  const newUserDoc = new UserModel({
    name,
    email: email.toLowerCase(),
    password, 
    designation: 'New User',
    profileImageUrl: '',
  });

  await newUserDoc.save();
  return toPlainUser(newUserDoc); // Return user data; client will handle localStorage
}

// Note: The original getCurrentUser and logout functions (which were client-side) have been moved/refactored
// into src/lib/client-auth.ts as getCurrentUser, setCurrentUser, and clearCurrentUser.

export async function updateCurrentUser(userId: string, updates: Partial<Omit<User, 'id' | 'email'>>): Promise<User | null> {
  if (!userId) {
    console.error("No user ID provided to update.");
    throw new Error('User ID is required for updating profile.');
  }

  await dbConnect();
  const userDoc = await UserModel.findById(userId);

  if (!userDoc) {
    throw new Error('User not found in database.');
  }

  // Apply updates
  if (updates.name !== undefined) userDoc.name = updates.name;
  if (updates.profileImageUrl !== undefined) userDoc.profileImageUrl = updates.profileImageUrl;
  // Designation updates can be added here if needed in the future

  await userDoc.save();
  return toPlainUser(userDoc); // Return updated user data; client will handle localStorage
}
