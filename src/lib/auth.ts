import type { User } from '@/types';

// Mock user store - in a real app, this would be a database.
const MOCK_USERS: User[] = [
  { id: 'user1', email: 'test@example.com', name: 'Test User' },
  { id: 'user2', email: 'jane.doe@example.com', name: 'Jane Doe' },
];

// This function simulates getting the current user.
// In a real app, this would involve checking a session or token.
export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
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
  const newUser: User = { id: `user${MOCK_USERS.length + 1}`, email, name };
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
