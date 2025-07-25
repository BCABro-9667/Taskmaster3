
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
import { useIsMobile } from '@/hooks/use-mobile';

interface TaskItemProps {
  task: Task;
  assignableUsers: Assignee[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: () => void;
  onMarkTaskAsComplete: (taskId: string) => void;
  onMarkTaskAsPending: (taskId: string) => void;
  currentUserId: string;
}

export function TaskItem({ task, assignableUsers, onDeleteTask, onUpdateTask, onMarkTaskAsComplete, onMarkTaskAsPending, currentUserId }: TaskItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  const assignedAssignee = task.assignedTo;

  const handleTaskUpdatedInEditForm = () => {
    onUpdateTask();
    setIsEditDialogOpen(false);
  }

  const handleNoteUpdated = () => {
    onUpdateTask(); 
    setIsEditNoteDialogOpen(false);
  }

  const handleCircleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from toggling expand/collapse
    if (task.status === 'done') {
      onMarkTaskAsPending(task.id);
    } else {
      onMarkTaskAsComplete(task.id);
    }
  };

  const handleCardClick = () => {
    if (isMobile) {
      setIsExpanded(!isExpanded);
    }
  };

  const isOverdue = task.status !== 'done' && task.status !== 'archived' && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0));
  const isCompletable = task.status === 'todo' || task.status === 'inprogress';
  
  const canModifyTask = currentUserId === task.createdBy;
  const canEditOrAddNote = task.status !== 'archived' && task.status !== 'done' && canModifyTask;
  const canEditTaskDetails = canModifyTask; 

  const mobileDetailsVisible = isMobile && isExpanded;

  return (
    <>
      <Card 
        className={cn(
          "w-full shadow-sm hover:shadow-md transition-all duration-200 ease-in-out rounded-lg screen-view bg-card/60 group",
          isMobile ? 'cursor-pointer' : ''
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          <div className="p-3 sm:p-4 flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 rounded-full p-0 shrink-0 mt-1",
                isCompletable ? "text-primary hover:bg-primary/10" : "text-green-500 hover:bg-green-500/10",
                isMobile ? '' : 'cursor-pointer' // Keep cursor pointer on desktop
              )}
              onClick={handleCircleClick}
              disabled={task.status === 'archived'}
              aria-label={
                task.status === 'done' 
                  ? "Mark task as pending" 
                  : "Mark task as complete"
              }
            >
              {task.status === 'done' || task.status === 'archived' ? (
                <CheckCircle2 className={cn("h-5 w-5", task.status === 'done' ? "text-green-500" : "text-muted-foreground")} />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-grow min-w-0">
              <p className={cn("font-medium text-card-foreground break-words", task.status === 'done' && 'line-through')} title={task.title}>{task.title}</p>
              {task.description && !isMobile && (
                <p className={cn("text-xs sm:text-sm text-muted-foreground mt-1 break-words whitespace-pre-wrap", task.status === 'done' && 'line-through')}>
                  {task.description}
                </p>
              )}
              {/* --- Mobile View Details (conditionally rendered) --- */}
              <div 
                className={cn(
                  "transition-all duration-300 ease-in-out overflow-hidden",
                  mobileDetailsVisible ? 'max-h-40 mt-2' : 'max-h-0'
                )}
              >
                 <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                   {task.description && (
                      <p className={cn("text-sm text-muted-foreground break-words whitespace-pre-wrap", task.status === 'done' && 'line-through')}>
                        {task.description}
                      </p>
                    )}
                   <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                       {assignedAssignee ? (
                        <Link href={`/assignees/${assignedAssignee.id}`} className="flex items-center gap-1 text-muted-foreground hover:underline" title={`View tasks for ${assignedAssignee.name}`} onClick={e => e.stopPropagation()}>
                          <UserCircle className="h-4 w-4" />
                          <span>{assignedAssignee.name}</span>
                        </Link>
                      ) : (
                        <div className="flex items-center text-muted-foreground/70 gap-1" title="Unassigned">
                          <UserCircle className="h-4 w-4" />
                          <span>Unassigned</span>
                        </div>
                      )}
                       <div className={cn("flex items-center text-muted-foreground", isOverdue ? 'text-destructive' : '')} title={`Deadline: ${format(parseISO(task.deadline), 'MMMM d, yyyy')}`}>
                        <CalendarDays className="mr-1 h-4 w-4" />
                        <span className={cn(isOverdue ? 'font-medium' : '')}>
                          {format(parseISO(task.deadline), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* --- Desktop Details & Actions --- */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 text-sm text-muted-foreground ml-auto shrink-0 mt-0.5 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {assignedAssignee ? (
                <Link href={`/assignees/${assignedAssignee.id}`} className="flex items-center gap-2 hover:underline" title={`View tasks for ${assignedAssignee.name}`}>
                  <UserCircle className="h-5 w-5" />
                  <span className={cn("text-foreground text-xs sm:text-sm")}>{assignedAssignee.name}</span>
                </Link>
              ) : (
                <div className="flex items-center text-muted-foreground gap-2" title="Unassigned">
                  <UserCircle className="h-5 w-5" />
                  <span className="text-xs sm:text-sm">Unassigned</span>
                </div>
              )}

              <div className={cn("flex items-center", isOverdue ? 'text-destructive' : '')} title={`Deadline: ${format(parseISO(task.deadline), 'MMMM d, yyyy')}`}>
                <CalendarDays className="mr-1 h-4 w-4" />
                <span className={cn("text-xs sm:text-sm", isOverdue ? 'font-medium' : '')}>
                  {format(parseISO(task.deadline), 'MMM d')}
                </span>
              </div>
            </div>

            {/* --- Mobile & Desktop Actions --- */}
            {canModifyTask && (
              <div className={cn("ml-auto flex-shrink-0", mobileDetailsVisible ? "self-end" : "self-start")}>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Print View */}
      <div className="print-task-item print-only">
        <div className="print-task-item-circle" />
        <span className="print-task-item-title">{task.title}</span>
      </div>

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
