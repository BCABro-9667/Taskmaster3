
import type { User } from '@/types';

// NOTE: MOCK_USERS array has been removed. User data should be fetched from/stored in MongoDB.

// This function simulates getting the current user's basic info from client-side storage.
// In a real app with MongoDB, after login, you'd typically store a session token (e.g., JWT)
// and use that to authenticate requests and fetch user details from the database.
// For now, we keep localStorage for simplicity in the UI, but the data originally came from mocks.
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
  // TODO: Implement MongoDB user lookup and password verification (e.g., using bcrypt).
  // 1. Connect to MongoDB.
  // 2. Find user by email.
  // 3. If user exists, compare hashed password.
  // 4. If valid, fetch the full user object.
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  console.warn('MongoDB implementation needed for login. Returning null.');
  // If login is successful, store user object (retrieved from DB) in localStorage:
  // const userFromDb = { id: 'dbUserId', email: email, name: 'User From DB' };
  // localStorage.setItem('currentUser', JSON.stringify(userFromDb));
  // return userFromDb;
  return null;
}

export async function register(name: string, email: string, password?: string): Promise<User | null> {
  // TODO: Implement MongoDB user creation.
  // 1. Connect to MongoDB.
  // 2. Check if user with this email already exists.
  // 3. If not, hash the password (e.g., using bcrypt).
  // 4. Create new user document in MongoDB.
  // 5. Fetch the newly created user object.
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  console.warn('MongoDB implementation needed for register. Returning null.');
  // If registration is successful, store new user object (retrieved from DB) in localStorage:
  // const newUserFromDb = { id: 'newDbUserId', email: email, name: name };
  // localStorage.setItem('currentUser', JSON.stringify(newUserFromDb));
  // return newUserFromDb;
  return null;
}

export async function logout(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
  // TODO: If using server-side sessions or tokens, invalidate them here.
}

export async function updateCurrentUser(updates: Partial<User>): Promise<User | null> {
  // TODO: Implement MongoDB user update.
  // 1. Get current user's ID (e.g., from session or localStorage).
  // 2. Connect to MongoDB.
  // 3. Update the user document in MongoDB.
  // 4. Fetch the updated user object.
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error("No current user found to update.");
    return null;
  }
  console.warn('MongoDB implementation needed for updateCurrentUser. Updating localStorage only for now.');
  // This part updates localStorage, but the primary update should be in the DB.
  const updatedUser = { ...currentUser, ...updates };
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }
  return updatedUser; // Should return user data from DB after update.
}
