
'use client';

import type { Task, Assignee } from '@/types'; 
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge } from './TaskStatusBadge';
import { CalendarDays, Edit3, Trash2, UserCircle, MoreVertical, Circle, CheckCircle2, StickyNote } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
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
import { EditNoteDialog } from './EditNoteDialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TaskItemProps {
  task: Task;
  assignableUsers: Assignee[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: () => void;
  onMarkTaskAsComplete: (taskId: string) => void;
  currentUserId: string; // Added currentUserId
}

export function TaskItem({ task, assignableUsers, onDeleteTask, onUpdateTask, onMarkTaskAsComplete, currentUserId }: TaskItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);

  // With the new type, task.assignedTo is either the Assignee object or undefined.
  const assignedAssignee = task.assignedTo;

  const getAssigneeInitials = (name: string | undefined) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
  };

  const handleTaskUpdatedInEditForm = () => {
    onUpdateTask();
    setIsEditDialogOpen(false);
  }

  const handleNoteUpdated = () => {
    onUpdateTask(); 
    setIsEditNoteDialogOpen(false);
  }

  const handleCircleClick = async () => {
    if (task.status === 'todo' || task.status === 'inprogress') {
      onMarkTaskAsComplete(task.id);
    }
  };

  const isOverdue = task.status !== 'done' && task.status !== 'archived' && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0));
  const isCompletable = task.status === 'todo' || task.status === 'inprogress';
  
  // Ensure currentUserId matches task.createdBy before enabling edit/note actions
  const canModifyTask = currentUserId === task.createdBy;
  const canEditOrAddNote = task.status !== 'archived' && task.status !== 'done' && canModifyTask;
  const canEditTaskDetails = canModifyTask; // Can edit task details if created by current user

  return (
    <>
      <Card className={cn("w-full shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out rounded-lg task-item-display")}>
        <CardContent className="p-3 sm:p-4 flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 rounded-full p-0 shrink-0 mt-1",
              isCompletable ? "cursor-pointer text-primary hover:bg-primary/10" : "cursor-default text-muted-foreground"
            )}
            onClick={handleCircleClick}
            disabled={!isCompletable || !canModifyTask} // Also disable if cannot modify
            aria-label={isCompletable ? "Mark task as complete" : (task.status === 'done' ? "Task completed" : "Task archived")}
          >
            {task.status === 'done' || task.status === 'archived' ? (
              <CheckCircle2 className={cn("h-5 w-5", task.status === 'done' ? "text-green-500" : "text-muted-foreground")} />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </Button>

          <div className="flex-grow min-w-0">
            <p className="font-medium text-card-foreground break-words truncate task-title-print" title={task.title}>{task.title}</p>
            {task.description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words whitespace-pre-wrap">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-sm text-muted-foreground ml-auto shrink-0 mt-0.5">
            {assignedAssignee ? (
              <Link href={`/assignees/${assignedAssignee.id}`} className="flex items-center gap-2 hover:underline" title={`View tasks for ${assignedAssignee.name}`}>
                <Avatar className="h-6 w-6 no-print">
                  <AvatarFallback>{getAssigneeInitials(assignedAssignee.name)}</AvatarFallback>
                </Avatar>
                <span className={cn("hidden md:inline text-foreground text-xs sm:text-sm assignee-name-print")}>{assignedAssignee.name}</span>
              </Link>
            ) : (
              <div className="flex items-center text-muted-foreground gap-2" title="Unassigned">
                <UserCircle className="h-5 w-5 sm:h-6 sm-w-6 no-print" />
                <span className="hidden md:inline text-xs sm:text-sm">Unassigned</span>
              </div>
            )}

            <div className={cn("flex items-center", isOverdue ? 'text-destructive' : '')} title={`Deadline: ${format(parseISO(task.deadline), 'MMMM d, yyyy')}`}>
              <CalendarDays className="mr-1 h-4 w-4 sm:h-5 sm:w-5" />
              <span className={cn("hidden sm:inline text-xs sm:text-sm deadline-print", isOverdue ? 'font-medium' : '')}>
                {format(parseISO(task.deadline), 'MMM d')}
              </span>
            </div>

            <div className="hidden xs:block task-status-badge">
              <TaskStatusBadge status={task.status} />
            </div>

            {canModifyTask && ( // Only show dropdown if user can modify task
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 no-print">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setIsEditNoteDialogOpen(true)} disabled={!canEditOrAddNote}>
                    <StickyNote className="mr-2 h-4 w-4" />
                    <span>{task.description ? 'Edit Note' : 'Add Note'}</span>
                  </DropdownMenuItem>
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={!canEditTaskDetails}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        <span>Edit Task Details</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                      </DialogHeader>
                      <EditTaskForm task={task} onTaskUpdated={handleTaskUpdatedInEditForm} closeDialog={() => setIsEditDialogOpen(false)} currentUserId={currentUserId}/>
                    </DialogContent>
                  </Dialog>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()} disabled={!canModifyTask}>
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
            )}
          </div>
        </CardContent>
      </Card>
      {isEditNoteDialogOpen && canModifyTask && (
        <EditNoteDialog
          task={task}
          isOpen={isEditNoteDialogOpen}
          onOpenChange={setIsEditNoteDialogOpen}
          onNoteUpdated={handleNoteUpdated}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
