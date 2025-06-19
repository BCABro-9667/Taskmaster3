
import type { Task, User, TaskStatus } from '@/types';
import { format, addDays, subDays } from 'date-fns';

// Simulate API delay
const simulateApiDelay = (duration = 50 + Math.random() * 100) => new Promise(resolve => setTimeout(resolve, duration));


let MOCK_ASSIGN_USERS: User[] = [
  { id: 'assignUser1', name: 'Alice Wonderland', email: 'alice@example.com', designation: 'Lead Developer', profileImageUrl: 'https://placehold.co/100x100.png' },
  { id: 'assignUser2', name: 'Bob The Builder', email: 'bob@example.com', designation: 'UI/UX Designer', profileImageUrl: 'https://placehold.co/100x100.png' },
  { id: 'assignUser3', name: 'Charlie Brown', email: 'charlie@example.com', designation: 'Project Manager' },
];

let MOCK_TASKS: Task[] = [
  {
    id: 'task1',
    title: 'Design homepage UI',
    description: 'Create mockups for the new homepage design, incorporating the new branding guidelines.',
    assignedTo: 'assignUser2',
    deadline: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    status: 'inprogress',
    createdAt: format(subDays(new Date(), 2), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  },
  {
    id: 'task2',
    title: 'Develop authentication module',
    description: 'Implement JWT-based authentication for the backend API.',
    assignedTo: 'assignUser1',
    deadline: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    status: 'todo',
    createdAt: format(subDays(new Date(), 5), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
  },
  {
    id: 'task3',
    title: 'Setup project CI/CD pipeline',
    description: 'Configure GitHub Actions for continuous integration and deployment to the staging server.',
    assignedTo: 'assignUser1',
    deadline: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    status: 'todo',
    createdAt: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
  },
  {
    id: 'task4',
    title: 'Write user stories for Q3 features',
    description: 'Collaborate with product team to define and document user stories for the next quarter.',
    assignedTo: 'assignUser3',
    deadline: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    status: 'done',
    createdAt: format(subDays(new Date(), 10), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 3), 'yyyy-MM-dd HH:mm:ss'),
  },
  {
    id: 'task5',
    title: 'Client Meeting Documentation',
    description: 'Summarize key discussion points and action items from the weekly client sync.',
    deadline: format(new Date(), 'yyyy-MM-dd'), // Due today
    status: 'todo',
    createdAt: format(subDays(new Date(), 0), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 0), 'yyyy-MM-dd HH:mm:ss'),
  }
];

// Helper to load/save from localStorage for persistence during session
const TASKS_STORAGE_KEY = 'mockTasks';
const USERS_STORAGE_KEY = 'mockAssignableUsers';

function loadTasksFromStorage(): Task[] {
  if (typeof window !== 'undefined') {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (storedTasks) {
      try {
        return JSON.parse(storedTasks);
      } catch (e) {
        console.error("Failed to parse tasks from localStorage", e);
        localStorage.removeItem(TASKS_STORAGE_KEY); // Clear corrupted data
      }
    }
  }
  return MOCK_TASKS; // Fallback to initial mock
}

function saveTasksToStorage(tasks: Task[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }
}

function loadUsersFromStorage(): User[] {
  if (typeof window !== 'undefined') {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      try {
        return JSON.parse(storedUsers);
      } catch (e) {
        console.error("Failed to parse users from localStorage", e);
        localStorage.removeItem(USERS_STORAGE_KEY); // Clear corrupted data
      }
    }
  }
  return MOCK_ASSIGN_USERS; // Fallback to initial mock
}

function saveUsersToStorage(users: User[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
}

// Initialize from storage
MOCK_TASKS = loadTasksFromStorage();
MOCK_ASSIGN_USERS = loadUsersFromStorage();


export async function getTasks(): Promise<Task[]> {
  await simulateApiDelay();
  return [...MOCK_TASKS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  await simulateApiDelay();
  return MOCK_TASKS.find(task => task.id === id);
}

export async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  await simulateApiDelay();
  const newTask: Task = {
    ...taskData,
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  };
  MOCK_TASKS.push(newTask);
  saveTasksToStorage(MOCK_TASKS);
  return newTask;
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo'>> & { assignedTo?: string | null }): Promise<Task | null> {
  await simulateApiDelay();
  const taskIndex = MOCK_TASKS.findIndex(task => task.id === id);
  if (taskIndex !== -1) {
    const currentTask = MOCK_TASKS[taskIndex];
    // Handle assignedTo specifically: null means unassign, undefined means no change
    const assignedToUpdate = updates.assignedTo === null ? undefined : updates.assignedTo;
    
    MOCK_TASKS[taskIndex] = {
      ...currentTask,
      ...updates,
      assignedTo: assignedToUpdate !== undefined ? assignedToUpdate : currentTask.assignedTo, // Preserve if undefined
      updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
    saveTasksToStorage(MOCK_TASKS);
    return MOCK_TASKS[taskIndex];
  }
  return null;
}

export async function deleteTask(id: string): Promise<boolean> {
  await simulateApiDelay();
  const initialLength = MOCK_TASKS.length;
  MOCK_TASKS = MOCK_TASKS.filter(task => task.id !== id);
  if (MOCK_TASKS.length < initialLength) {
    saveTasksToStorage(MOCK_TASKS);
    return true;
  }
  return false;
}

export async function getAssignableUsers(): Promise<User[]> {
  await simulateApiDelay();
  return [...MOCK_ASSIGN_USERS].sort((a,b) => (a.name || '').localeCompare(b.name || ''));
}

export async function getAssignableUserById(userId: string): Promise<User | null> {
  await simulateApiDelay();
  const user = MOCK_ASSIGN_USERS.find(u => u.id === userId);
  return user || null;
}

export async function createAssignableUser(name: string, designation: string): Promise<User> {
  await simulateApiDelay();
  const newUser: User = {
    id: `assignUser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    designation,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Dummy email
    profileImageUrl: '',
  };
  MOCK_ASSIGN_USERS.push(newUser);
  saveUsersToStorage(MOCK_ASSIGN_USERS);
  return newUser;
}

export async function updateAssignableUser(userId: string, updates: { name?: string; designation?: string }): Promise<User | null> {
  await simulateApiDelay();
  const userIndex = MOCK_ASSIGN_USERS.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    MOCK_ASSIGN_USERS[userIndex] = { ...MOCK_ASSIGN_USERS[userIndex], ...updates };
    saveUsersToStorage(MOCK_ASSIGN_USERS);
    return MOCK_ASSIGN_USERS[userIndex];
  }
  return null;
}

export async function deleteAssignableUser(userId: string): Promise<boolean> {
  await simulateApiDelay();
  const initialUserLength = MOCK_ASSIGN_USERS.length;
  MOCK_ASSIGN_USERS = MOCK_ASSIGN_USERS.filter(u => u.id !== userId);
  
  let userDeleted = MOCK_ASSIGN_USERS.length < initialUserLength;

  if (userDeleted) {
    saveUsersToStorage(MOCK_ASSIGN_USERS);
    // Unassign tasks from the deleted user
    MOCK_TASKS = MOCK_TASKS.map(task => {
      if (task.assignedTo === userId) {
        return { ...task, assignedTo: undefined, updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss') };
      }
      return task;
    });
    saveTasksToStorage(MOCK_TASKS);
    return true;
  }
  return false;
}


export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
];
