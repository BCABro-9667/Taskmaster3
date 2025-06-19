// This file contains client-side utility functions for managing user authentication state in localStorage.
// It is NOT marked with 'use server';

import type { User } from '@/types';

export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch (error) {
        console.error("Error parsing stored user:", error);
        // If parsing fails, clear the invalid item
        localStorage.removeItem('currentUser');
        return null;
      }
    }
  }
  return null;
}

export function setCurrentUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
     // Dispatch a storage event to notify other parts of the app (like Navbar)
    window.dispatchEvent(new Event('storage'));
  }
}

export function clearCurrentUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
    // Dispatch a storage event to notify other parts of the app
    window.dispatchEvent(new Event('storage'));
  }
}
