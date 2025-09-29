
export interface User {
  id: string;
  email: string; 
  name: string;
  profileImageUrl?: string; 
  backgroundImageUrl?: string;
  hasPin?: boolean;
}

export interface Assignee {
  id: string;
  name: string;
  designation?: string;
  profileImageUrl?: string;
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
  isLocked: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string;
}

// URL Storage System Types
export interface UrlCategory {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
}

export interface Url {
  id: string;
  title: string;
  url: string;
  categoryId: string; // 'uncategorized' for uncategorized
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
