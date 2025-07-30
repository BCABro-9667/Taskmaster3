
export interface User {
  id: string;
  email: string; 
  name: string;
  profileImageUrl?: string; 
  backgroundImageUrl?: string;
}

export interface Assignee {
  id: string;
  name: string;
  designation?: string;
  createdAt: string; 
  updatedAt: string; 
  createdBy: string; // Added createdBy
}

export type TaskStatus = 'todo' | 'inprogress' | 'done' | 'archived';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: Assignee; // Changed from string | Assignee
  deadline: string; // ISO date string (YYYY-MM-DD)
  status: TaskStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string; // Added createdBy
}

export interface Note {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string;
}
