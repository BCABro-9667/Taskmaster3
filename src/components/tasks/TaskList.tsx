
'use client';

import type { Task, Assignee } from '@/types'; 
import { TaskItem } from './TaskItem';
import { ClipboardList } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  assignableUsers: Assignee[]; 
  currentUserId: string; // Added currentUserId
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: () => void;
  onMarkTaskAsComplete: (taskId: string) => void;
  emptyStateMessage?: string;
  emptyStateTitle?: string;
}

export function PrintOnlyBlankTasks({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="print-only">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`blank-${i}`} className="print-blank-item">
          <div className="print-blank-item-circle" />
        </div>
      ))}
    </div>
  );
}

export function TaskList({ 
  tasks, 
  assignableUsers, 
  currentUserId, // Destructure currentUserId
  onDeleteTask, 
  onUpdateTask,
  onMarkTaskAsComplete,
  emptyStateMessage = "Looks like your task list is empty. Click \"Add New Task\" to get started.",
  emptyStateTitle = "No Tasks Yet!" 
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-border rounded-lg bg-card screen-view">
        <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-1 font-headline">{emptyStateTitle}</h3>
        <p className="text-muted-foreground">{emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <div className="task-list-container flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          assignableUsers={assignableUsers} 
          currentUserId={currentUserId} // Pass currentUserId
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
          onMarkTaskAsComplete={onMarkTaskAsComplete}
        />
      ))}
    </div>
  );
}
