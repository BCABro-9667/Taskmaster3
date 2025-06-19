
export interface User {
  id: string;
  email: string; 
  name: string;
  profileImageUrl?: string; 
  // Designation removed from User
}

export interface Assignee {
  id: string;
  name: string;
  designation?: string;
  createdAt: string; 
  updatedAt: string; 
}

export type TaskStatus = 'todo' | 'inprogress' | 'done' | 'archived';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: string | Assignee; // Changed to Assignee
  deadline: string; // ISO date string (YYYY-MM-DD)
  status: TaskStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
