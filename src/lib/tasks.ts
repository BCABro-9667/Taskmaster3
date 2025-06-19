
import type { Task, User, TaskStatus } from '@/types';
import { format } from 'date-fns';

// Mock tasks store - in a real app, this would be a database.
let MOCK_TASKS: Task[] = [
  { 
    id: 'task1', 
    title: 'Setup project Trello board', 
    description: 'Initialize Next.js app and install dependencies. Create initial project structure. Setup linting and formatting tools.', 
    assignedTo: 'user1', 
    deadline: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), 
    status: 'inprogress', 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
  { 
    id: 'task2', 
    title: 'Design UI Mockups for Dashboard', 
    description: 'Create detailed mockups for the main dashboard page, including task list and task creation form. Consider responsive design for mobile, tablet, and desktop.', 
    assignedTo: 'user2', 
    deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), 
    status: 'todo', 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
  { 
    id: 'task3', 
    title: 'Implement User Authentication', 
    description: 'Develop login and registration forms. Implement client-side validation and connect to mock authentication service. Handle success and error states.', 
    deadline: format(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), 
    status: 'todo', 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
   { 
    id: 'task4', 
    title: 'Develop Task Creation Feature', 
    description: 'Build the form for creating new tasks. Include fields for title, description, assignee, and deadline. Integrate AI deadline suggestion.', 
    assignedTo: 'user1', 
    deadline: format(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), 
    status: 'todo', 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  },
];

// Simulate API delay for all functions
const simulateApiDelay = (duration = 300 + Math.random() * 400) => new Promise(resolve => setTimeout(resolve, duration));


export async function getTasks(): Promise<Task[]> {
  await simulateApiDelay();
  // Return a deep copy to prevent direct modification of MOCK_TASKS
  return JSON.parse(JSON.stringify(MOCK_TASKS.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())));
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  await simulateApiDelay();
  const task = MOCK_TASKS.find(task => task.id === id);
  return task ? JSON.parse(JSON.stringify(task)) : undefined;
}

export async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  await simulateApiDelay();
  const newTask: Task = {
    ...taskData,
    id: `task${Date.now()}${Math.floor(Math.random() * 1000)}`, // More unique ID
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_TASKS.unshift(newTask); // Add to the beginning of the list
  return JSON.parse(JSON.stringify(newTask));
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo'>> & { assignedTo?: string | null }): Promise<Task | null> {
  await simulateApiDelay();
  const taskIndex = MOCK_TASKS.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    return null;
  }
  // Handle assignedTo being set to null (unassigned)
  const updatedTaskData = { 
    ...MOCK_TASKS[taskIndex], 
    ...updates,
    assignedTo: updates.assignedTo === null ? undefined : (updates.assignedTo || MOCK_TASKS[taskIndex].assignedTo),
    updatedAt: new Date().toISOString() 
  };
  MOCK_TASKS[taskIndex] = updatedTaskData;
  return JSON.parse(JSON.stringify(updatedTaskData));
}

export async function deleteTask(id: string): Promise<boolean> {
  await simulateApiDelay();
  const initialLength = MOCK_TASKS.length;
  MOCK_TASKS = MOCK_TASKS.filter(task => task.id !== id);
  return MOCK_TASKS.length < initialLength;
}

// Mock users for assignment dropdown
let MOCK_ASSIGN_USERS: User[] = [
  { id: 'user1', email: 'test@example.com', name: 'Test User', designation: 'Software Engineer' },
  { id: 'user2', email: 'jane.doe@example.com', name: 'Jane Doe', designation: 'Product Manager' },
  { id: 'user3', email: 'john.smith@example.com', name: 'John Smith', designation: 'UX Designer' },
  { id: 'user4', email: 'alice.wonder@example.com', name: 'Alice Wonder', designation: 'QA Tester' },
];

export async function getAssignableUsers(): Promise<User[]> {
  await simulateApiDelay();
  return JSON.parse(JSON.stringify(MOCK_ASSIGN_USERS));
}

export async function getAssignableUserById(userId: string): Promise<User | null> {
  await simulateApiDelay();
  const user = MOCK_ASSIGN_USERS.find(u => u.id === userId);
  return user ? JSON.parse(JSON.stringify(user)) : null;
}

export async function createAssignableUser(name: string, designation: string): Promise<User> {
  await simulateApiDelay();
  const newUser: User = {
    id: `user${Date.now()}${Math.floor(Math.random() * 1000)}`,
    name,
    // For mock purposes, email can be derived or fixed.
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    designation,
  };
  MOCK_ASSIGN_USERS.push(newUser);
  return JSON.parse(JSON.stringify(newUser));
}


export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
];
