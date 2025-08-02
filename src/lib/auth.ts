
'use server';
import type { User } from '@/types';
import dbConnect from './db';
import UserModel, { type IUserDocument } from '@/models/User';
import bcrypt from 'bcryptjs';

// Helper to convert Mongoose document to plain User object
function toPlainUser(userDoc: IUserDocument | null): User | null {
  if (!userDoc) return null;
  const userObject = userDoc.toObject() as User & { pin?: string }; // toObject applies schema transformations
  
  // Add hasPin to the user object before returning
  userObject.hasPin = !!userDoc.pin;
  delete userObject.pin; // Ensure the pin hash is not sent to the client

  return userObject;
}

export async function login(email: string, password?: string): Promise<User | null> {
  await dbConnect();
  const userDoc = await UserModel.findOne({ email: email.toLowerCase() });

  if (userDoc && password) {
    const isMatch = await userDoc.comparePassword(password, 'password');
    if (isMatch) {
      return toPlainUser(userDoc); 
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
  });

  await newUserDoc.save();
  return toPlainUser(newUserDoc); 
}

interface UpdatePayload extends Partial<Omit<User, 'id' | 'email'>> {
    pin?: string;
    currentPin?: string;
}

export async function updateCurrentUser(userId: string, updates: UpdatePayload): Promise<User | null> {
  if (!userId) {
    throw new Error('User ID is required for updating profile.');
  }

  await dbConnect();
  const userDoc = await UserModel.findById(userId);

  if (!userDoc) {
    throw new Error('User not found in database.');
  }

  // Handle PIN update
  if (updates.pin) {
    if (userDoc.pin) {
        // If a PIN already exists, the current PIN must be provided and must match
        if (!updates.currentPin) {
            throw new Error("Your current PIN is required to set a new one.");
        }
        const isPinMatch = await userDoc.comparePassword(updates.currentPin, 'pin');
        if (!isPinMatch) {
            throw new Error("The current PIN you entered is incorrect.");
        }
    }
    userDoc.pin = updates.pin; // The pre-save hook will hash this
  }

  // Apply other updates
  if (updates.name !== undefined) userDoc.name = updates.name;
  if (updates.profileImageUrl !== undefined) userDoc.profileImageUrl = updates.profileImageUrl;
  if (updates.backgroundImageUrl !== undefined) userDoc.backgroundImageUrl = updates.backgroundImageUrl;

  await userDoc.save();
  return toPlainUser(userDoc); 
}


export async function verifyPin(userId: string, pin: string): Promise<boolean> {
    if (!userId) {
        throw new Error("User not identified.");
    }
    await dbConnect();
    const user = await UserModel.findById(userId).select('+pin');
    if (!user || !user.pin) {
        throw new Error("No PIN has been set for this account.");
    }
    return user.comparePassword(pin, 'pin');
}
