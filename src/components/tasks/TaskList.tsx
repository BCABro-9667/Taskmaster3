
'use client';

import type { Task, User } from '@/types';
import { TaskItem } from './TaskItem';
import { ClipboardList } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  assignableUsers: User[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: () => void;
  emptyStateMessage?: string;
  emptyStateTitle?: string;
}

export function TaskList({ 
  tasks, 
  assignableUsers, 
  onDeleteTask, 
  onUpdateTask,
  emptyStateMessage = "Looks like your task list is empty. Click \"Add New Task\" to get started.",
  emptyStateTitle = "No Tasks Yet!" 
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-border rounded-lg bg-card">
        <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-1 font-headline">{emptyStateTitle}</h3>
        <p className="text-muted-foreground">{emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {tasks.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          assignableUsers={assignableUsers} 
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
        />
      ))}
    </div>
  );
}
