
import type { User } from '@/types';
import { format } from 'date-fns'; // Required for date consistency in MOCK_USERS

// For demonstration, using a simple in-memory array for users.
const MOCK_USERS: User[] = [
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

// Simulate getting the current user from client-side storage
export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('currentUser'); // Clear corrupted data
        return null;
      }
    }
  }
  return null;
}

export async function login(email: string, password?: string): Promise<User | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = MOCK_USERS.find(u => u.email === email);
  // In a real app, you'd verify the password here
  if (user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    return user;
  }
  return null;
}

export async function register(name: string, email: string, password?: string): Promise<User | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (MOCK_USERS.find(u => u.email === email)) {
    throw new Error('User with this email already exists.');
  }

  const newUser: User = {
    id: `user${MOCK_USERS.length + 1}_${Date.now()}`, // More unique ID
    name,
    email,
    designation: 'New User', // Default designation
    profileImageUrl: '', 
  };
  MOCK_USERS.push(newUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  }
  return newUser;
}

export async function logout(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
}

export async function updateCurrentUser(updates: Partial<Omit<User, 'id' | 'email'>>): Promise<User | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error("No current user found to update.");
    return null;
  }

  // Find in MOCK_USERS or use current user from localStorage as the base
  let userToUpdateIndex = MOCK_USERS.findIndex(u => u.id === currentUser.id);
  let userToUpdate: User;

  if (userToUpdateIndex !== -1) {
    userToUpdate = { ...MOCK_USERS[userToUpdateIndex] };
  } else {
    // If not in MOCK_USERS (e.g., dynamically registered), use currentUser from localStorage
    userToUpdate = { ...currentUser };
  }
  
  const updatedUser = { ...userToUpdate, ...updates };


  // Update MOCK_USERS if the user was found there
  if (userToUpdateIndex !== -1) {
    MOCK_USERS[userToUpdateIndex] = updatedUser;
  } else {
    // If the user was not in the initial MOCK_USERS (e.g., registered dynamically),
    // you might want to add them or update them if they were just from localStorage.
    // For simplicity, we'll assume the `currentUser` from localStorage is the source of truth if not in MOCK_USERS.
    // A more robust mock system might add dynamically registered users to MOCK_USERS.
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }

  return updatedUser;
}
