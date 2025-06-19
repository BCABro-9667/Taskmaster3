
'use client';

import type { Task, User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge } from './TaskStatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Edit3, Trash2, UserCircle, MoreVertical, Circle, CheckCircle2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  assignableUsers: User[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: () => void;
  onMarkTaskAsComplete: (taskId: string) => void;
}

export function TaskItem({ task, assignableUsers, onDeleteTask, onUpdateTask, onMarkTaskAsComplete }: TaskItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const assignedUser = assignableUsers.find(u => u.id === task.assignedTo);

  const getUserInitials = (name: string | undefined) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const handleTaskUpdatedInEditForm = () => {
    onUpdateTask(); // This calls the dashboard's fetch
    setIsEditDialogOpen(false); 
  }
  
  const handleCircleClick = async () => {
    if (task.status === 'todo' || task.status === 'inprogress') {
      onMarkTaskAsComplete(task.id);
    }
  };

  const isOverdue = task.status !== 'done' && task.status !== 'archived' && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0));
  const isCompletable = task.status === 'todo' || task.status === 'inprogress';

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out rounded-lg">
      <CardContent className="p-3 sm:p-4 flex items-center gap-3">
        {/* Clickable Circle Icon */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-full p-0",
            isCompletable ? "cursor-pointer text-primary hover:bg-primary/10" : "cursor-default text-muted-foreground"
          )}
          onClick={handleCircleClick}
          disabled={!isCompletable}
          aria-label={isCompletable ? "Mark task as complete" : (task.status === 'done' ? "Task completed" : "Task archived")}
        >
          {task.status === 'done' || task.status === 'archived' ? (
            <CheckCircle2 className={cn("h-5 w-5", task.status === 'done' ? "text-green-500" : "text-muted-foreground")} />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </Button>

        {/* Task Title */}
        <div className="flex-grow font-medium text-card-foreground break-words min-w-0">
          <p className="truncate" title={task.title}>{task.title}</p>
        </div>

        {/* Right Aligned Content */}
        <div className="flex items-center gap-2 sm:gap-3 text-sm text-muted-foreground ml-auto shrink-0">
          {/* Assignee */}
          {assignedUser ? (
            <div className="flex items-center" title={`Assigned to ${assignedUser.name}`}>
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage src={`https://placehold.co/40x40.png?text=${getUserInitials(assignedUser.name)}`} alt={assignedUser.name} data-ai-hint="user avatar"/>
                <AvatarFallback>{getUserInitials(assignedUser.name)}</AvatarFallback>
              </Avatar>
              <span className="ml-2 hidden md:inline text-foreground text-xs sm:text-sm">{assignedUser.name}</span>
            </div>
          ) : (
            <div className="flex items-center text-muted-foreground" title="Unassigned">
              <UserCircle className="h-5 w-5 sm:h-6 sm:w-6" />
               <span className="ml-1 hidden md:inline text-xs sm:text-sm">Unassigned</span>
            </div>
          )}

          {/* Deadline */}
          <div className={cn("flex items-center", isOverdue ? 'text-destructive' : '')} title={`Deadline: ${format(parseISO(task.deadline), 'MMMM d, yyyy')}`}>
            <CalendarDays className="mr-1 h-4 w-4 sm:h-5 sm:w-5" />
            <span className={cn("hidden sm:inline text-xs sm:text-sm", isOverdue ? 'font-medium' : '')}>
              {format(parseISO(task.deadline), 'MMM d')}
            </span>
          </div>
          
          {/* Status Badge */}
          <div className="hidden xs:block"> {/* Hide on very small screens if space is tight */}
             <TaskStatusBadge status={task.status} />
          </div>


          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={task.status === 'archived'}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                  </DialogHeader>
                  <EditTaskForm task={task} onTaskUpdated={handleTaskUpdatedInEditForm} closeDialog={() => setIsEditDialogOpen(false)} />
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
      </CardContent>
    </Card>
  );
}
