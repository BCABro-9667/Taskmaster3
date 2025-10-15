
import type { Task, Assignee } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const TASKS_STORAGE_KEY = 'local_tasks';
const ASSIGNEES_STORAGE_KEY = 'local_assignees';

// --- Helper Functions ---
function getFromStorage<T>(key: string, userId: string): T[] {
  if (typeof window === 'undefined') return [];
  const allData: { [key: string]: T[] } = JSON.parse(localStorage.getItem(key) || '{}');
  return allData[userId] || [];
}

function saveToStorage<T>(key: string, userId: string, data: T[]) {
  if (typeof window === 'undefined') return;
  const allData: { [key: string]: T[] } = JSON.parse(localStorage.getItem(key) || '{}');
  allData[userId] = data;
  localStorage.setItem(key, JSON.stringify(allData));
}

// --- Assignee Functions ---
export async function getLocalAssignees(userId: string): Promise<Assignee[]> {
  return getFromStorage<Assignee>(ASSIGNEES_STORAGE_KEY, userId).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createLocalAssignee(userId: string, payload: { name: string; designation?: string; profileImageUrl?: string; }): Promise<Assignee> {
    const assignees = getFromStorage<Assignee>(ASSIGNEES_STORAGE_KEY, userId);
    const newAssignee: Assignee = {
        id: uuidv4(),
        ...payload,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    saveToStorage<Assignee>(ASSIGNEES_STORAGE_KEY, userId, [...assignees, newAssignee]);
    return newAssignee;
}

// --- Task Functions ---
export async function getLocalTasks(userId: string): Promise<Task[]> {
  const tasks = getFromStorage<Task>(TASKS_STORAGE_KEY, userId);
  const assignees = getFromStorage<Assignee>(ASSIGNEES_STORAGE_KEY, userId);
  
  const tasksWithAssignees = tasks.map(task => {
    if (task.assignedTo) {
      const assigneeId = (task.assignedTo as any).id || task.assignedTo;
      const foundAssignee = assignees.find(a => a.id === assigneeId);
      return { ...task, assignedTo: foundAssignee };
    }
    return task;
  });

  return tasksWithAssignees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createLocalTask(userId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'createdBy'> & { assignedTo?: string }): Promise<Task> {
  const tasks = getFromStorage<Task>(TASKS_STORAGE_KEY, userId);
  const assignees = getFromStorage<Assignee>(ASSIGNEES_STORAGE_KEY, userId);
  
  const assignedAssignee = taskData.assignedTo ? assignees.find(a => a.id === taskData.assignedTo) : undefined;

  const newTask: Task = {
    ...taskData,
    id: uuidv4(),
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedTo: assignedAssignee,
  };
  
  saveToStorage<Task>(TASKS_STORAGE_KEY, userId, [newTask, ...tasks]);
  return newTask;
}


export async function updateLocalTask(userId: string, id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> & { assignedTo?: string | null }): Promise<Task | null> {
    let tasks = getFromStorage<Task>(TASKS_STORAGE_KEY, userId);
    const assignees = getFromStorage<Assignee>(ASSIGNEES_STORAGE_KEY, userId);
    
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return null;

    const updatedTask = { ...tasks[taskIndex], ...updates };

    if (updates.assignedTo) {
        updatedTask.assignedTo = assignees.find(a => a.id === updates.assignedTo) || undefined;
    } else if (updates.assignedTo === null) {
        updatedTask.assignedTo = undefined;
    }

    tasks[taskIndex] = updatedTask;
    saveToStorage<Task>(TASKS_STORAGE_KEY, userId, tasks);
    return updatedTask;
}

export async function deleteLocalTask(userId: string, id: string): Promise<{ deletedTaskId: string }> {
    let tasks = getFromStorage<Task>(TASKS_STORAGE_KEY, userId);
    const initialLength = tasks.length;
    tasks = tasks.filter(t => t.id !== id);
    if (tasks.length === initialLength) {
        throw new Error("Task not found in local storage.");
    }
    saveToStorage<Task>(TASKS_STORAGE_KEY, userId, tasks);
    return { deletedTaskId: id };
}

export async function deleteLocalCompletedTasks(userId: string): Promise<{ deletedCount: number }> {
    let tasks = getFromStorage<Task>(TASKS_STORAGE_KEY, userId);
    const initialLength = tasks.length;
    const remainingTasks = tasks.filter(t => t.status !== 'done');
    const deletedCount = initialLength - remainingTasks.length;
    saveToStorage<Task>(TASKS_STORAGE_KEY, userId, remainingTasks);
    return { deletedCount };
}
