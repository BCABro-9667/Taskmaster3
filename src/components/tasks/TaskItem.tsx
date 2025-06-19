
'use client';

import type { Task, User } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge } from './TaskStatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Edit3, Trash2, UserCircle, MoreVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditTaskForm } from './EditTaskForm';
import { useState } from 'react';

interface TaskItemProps {
  task: Task;
  assignableUsers: User[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: () => void; 
}

export function TaskItem({ task, assignableUsers, onDeleteTask, onUpdateTask }: TaskItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const assignedUser = assignableUsers.find(u => u.id === task.assignedTo);

  const getUserInitials = (name: string | undefined) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const handleTaskUpdated = () => {
    onUpdateTask();
    setIsEditDialogOpen(false); 
  }
  
  const isOverdue = task.status !== 'done' && task.status !== 'archived' && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0));


  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out rounded-lg overflow-hidden w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-headline leading-tight break-words">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                  </DialogHeader>
                  <EditTaskForm task={task} onTaskUpdated={handleTaskUpdated} closeDialog={() => setIsEditDialogOpen(false)} />
                </DialogContent>
              </Dialog>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the task
                      "{task.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteTask(task.id)}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className={`mr-2 h-4 w-4 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            Deadline: {format(parseISO(task.deadline), 'MMMM d, yyyy')}
            {isOverdue && " (Overdue)"}
          </span>
        </div>
        {assignedUser ? (
          <div className="flex items-center text-sm">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={`https://placehold.co/40x40.png?text=${getUserInitials(assignedUser.name)}`} alt={assignedUser.name} data-ai-hint="user avatar" />
              <AvatarFallback>{getUserInitials(assignedUser.name)}</AvatarFallback>
            </Avatar>
            <span className="text-foreground">{assignedUser.name}</span>
          </div>
        ) : (
          <div className="flex items-center text-sm text-muted-foreground">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Unassigned</span>
          </div>
        )}
         {task.description && (
          <p className="text-sm text-muted-foreground pt-1 break-words whitespace-pre-wrap">
            {task.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
        <TaskStatusBadge status={task.status} />
        <span className="text-xs text-muted-foreground">
          Last updated: {format(parseISO(task.updatedAt), 'MMM d, HH:mm')}
        </span>
      </CardFooter>
    </Card>
  );
}
