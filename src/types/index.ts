
export interface User {
  id: string;
  email: string; 
  name: string;
  designation?: string;
  profileImageUrl?: string; 
}

export type TaskStatus = 'todo' | 'inprogress' | 'done' | 'archived';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: string | User; // User ID string or populated User object
  deadline: string; // ISO date string (YYYY-MM-DD)
  status: TaskStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
