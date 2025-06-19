'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Task, User } from '@/types';
import { getTasks, deleteTask as deleteTaskApi, getAssignableUsers } from '@/lib/tasks';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, RefreshCw, Search, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES } from '@/lib/tasks';
import type { TaskStatus } from '@/types';


export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const { toast } = useToast();

  const fetchTasksAndUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedTasks, fetchedUsers] = await Promise.all([
        getTasks(),
        getAssignableUsers()
      ]);
      setTasks(fetchedTasks);
      setAssignableUsers(fetchedUsers);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: 'Could not load tasks or users. Please try refreshing.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasksAndUsers();
  }, [fetchTasksAndUsers]);

  const handleTaskCreated = () => {
    fetchTasksAndUsers(); // Refetch tasks after new one is created
    setIsCreateTaskDialogOpen(false);
  };

  const handleTaskUpdated = () => {
    fetchTasksAndUsers(); // Refetch tasks after update
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskApi(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast({ title: 'Task Deleted', description: 'The task has been successfully deleted.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Task',
        description: 'Could not delete the task. Please try again.',
      });
    }
  };

  const filteredTasks = tasks
    .filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(task => statusFilter === 'all' || task.status === statusFilter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline text-primary">My Tasks</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTasksAndUsers} disabled={isLoading} aria-label="Refresh tasks">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <CreateTaskForm onTaskCreated={handleTaskCreated} closeDialog={() => setIsCreateTaskDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg shadow">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search tasks..." 
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2 md:w-auto w-full">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {TASK_STATUSES.map(statusInfo => (
                <SelectItem key={statusInfo.value} value={statusInfo.value}>{statusInfo.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <TaskList 
          tasks={filteredTasks} 
          assignableUsers={assignableUsers} 
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleTaskUpdated}
        />
      )}
    </div>
  );
}
