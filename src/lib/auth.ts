
import type { User } from '@/types';

// Mock user store - in a real app, this would be a database.
const MOCK_USERS: User[] = [
  { id: 'user1', email: 'test@example.com', name: 'Test User', profileImageUrl: '' },
  { id: 'user2', email: 'jane.doe@example.com', name: 'Jane Doe', profileImageUrl: 'https://placehold.co/100x100.png' },
];

// This function simulates getting the current user.
// In a real app, this would involve checking a session or token.
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
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const user = MOCK_USERS.find(u => u.email === email);
  // In a real app, you'd also verify the password here.
  if (user) {
    if (typeof window !== 'undefined') {
      // Ensure all fields, including potentially new ones like profileImageUrl, are set from the mock
      const userToStore = { ...user }; // Shallow copy is enough here
      localStorage.setItem('currentUser', JSON.stringify(userToStore));
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
    id: `user${MOCK_USERS.length + 1}`, 
    email, 
    name, 
    profileImageUrl: '' // Default empty profile image URL
  };
  MOCK_USERS.push(newUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  }
  return newUser;
}

export async function logout(): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
}

export async function updateCurrentUser(updates: Partial<User>): Promise<User | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error("No current user found to update.");
    return null;
  }
  const updatedUser = { ...currentUser, ...updates };
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }
  return updatedUser;
}
