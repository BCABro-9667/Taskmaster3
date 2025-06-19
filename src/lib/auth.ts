
'use server';
import type { User } from '@/types';
import dbConnect from './db';
import UserModel, { type IUserDocument } from '@/models/User';
import { format } from 'date-fns';

// For demonstration, using a simple in-memory array for users.
// This MOCK_USERS is only for fallback if DB connection fails or for very initial seeding.
// The primary source of truth is MongoDB.
const MOCK_USERS_FALLBACK: User[] = [
  { 
    id: 'user1', 
    email: 'user@example.com', 
    name: 'Demo User', 
    designation: 'Software Engineer',
    profileImageUrl: 'https://placehold.co/100x100.png' 
  },
  { 
    id: 'user2', 
    email: 'test@example.com', 
    name: 'Test User',
    designation: 'QA Tester',
    profileImageUrl: '' 
  },
];


// Helper to convert Mongoose document to plain User object
function toPlainUser(userDoc: IUserDocument | null): User | null {
  if (!userDoc) return null;
  const userObject = userDoc.toObject();
   // Ensure all UserType fields are present, even if undefined in schema
  return {
    id: userObject.id,
    email: userObject.email,
    name: userObject.name,
    designation: userObject.designation,
    profileImageUrl: userObject.profileImageUrl,
  };
}


export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('currentUser'); 
        return null;
      }
    }
  }
  return null;
}

export async function login(email: string, password?: string): Promise<User | null> {
  await dbConnect();
  const userDoc = await UserModel.findOne({ email: email.toLowerCase() });

  if (userDoc && password) {
    const isMatch = await userDoc.comparePassword(password);
    if (isMatch) {
      const plainUser = toPlainUser(userDoc);
      if (plainUser && typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(plainUser));
      }
      return plainUser;
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
    password, // Hashing is handled by pre-save hook in User model
    designation: 'New User', 
    profileImageUrl: '',
  });

  await newUserDoc.save();
  const plainUser = toPlainUser(newUserDoc);

  if (plainUser && typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(plainUser));
  }
  return plainUser;
}

export async function logout(): Promise<void> {
  // Simulate API delay if needed, but for logout, it's usually quick
  // await new Promise(resolve => setTimeout(resolve, 300)); 
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
}

export async function updateCurrentUser(updates: Partial<Omit<User, 'id' | 'email'>>): Promise<User | null> {
  const currentUserData = getCurrentUser();
  if (!currentUserData) {
    console.error("No current user found to update.");
    return null;
  }

  await dbConnect();
  const userDoc = await UserModel.findById(currentUserData.id);

  if (!userDoc) {
    throw new Error('User not found in database.');
  }

  // Apply updates
  if (updates.name) userDoc.name = updates.name;
  if (updates.profileImageUrl !== undefined) userDoc.profileImageUrl = updates.profileImageUrl;
  // Note: Designation is not updated via this function in current UI,
  // but could be added here if needed.

  await userDoc.save();
  const plainUser = toPlainUser(userDoc);

  if (plainUser && typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(plainUser));
  }
  return plainUser;
}
