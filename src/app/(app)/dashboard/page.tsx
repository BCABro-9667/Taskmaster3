
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Task, User } from '@/types';
import { getTasks, deleteTask as deleteTaskApi, getAssignableUsers } from '@/lib/tasks';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, RefreshCw, Search, Filter, ListTodo, CheckCircle2, ClipboardList } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';


export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    fetchTasksAndUsers(); 
  };

  const handleTaskUpdated = () => {
    fetchTasksAndUsers(); 
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

  const allFilteredTasks = tasks
    .filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(task => statusFilter === 'all' || task.status === statusFilter);

  const pendingTasks = allFilteredTasks.filter(task => task.status === 'todo' || task.status === 'inprogress');
  const completedTasks = allFilteredTasks.filter(task => task.status === 'done');
  const archivedTasks = allFilteredTasks.filter(task => task.status === 'archived');


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline text-primary">My Tasks</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTasksAndUsers} disabled={isLoading} aria-label="Refresh tasks">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <PlusCircle className="mr-2 h-5 w-5 text-accent" />
            Add New Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTaskForm onTaskCreated={handleTaskCreated} />
        </CardContent>
      </Card>

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
        <div className="space-y-8">
          {/* Pending Tasks Section */}
          <section>
            <div className="flex items-center mb-4">
              <ListTodo className="mr-3 h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold font-headline">Pending Tasks ({pendingTasks.length})</h2>
            </div>
            <TaskList 
              tasks={pendingTasks} 
              assignableUsers={assignableUsers} 
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleTaskUpdated}
              emptyStateMessage="No pending tasks. Way to go!"
            />
          </section>

          {/* Completed Tasks Section */}
          {(statusFilter === 'all' || statusFilter === 'done') && completedTasks.length > 0 && (
            <section>
              <div className="flex items-center mb-4">
                <CheckCircle2 className="mr-3 h-6 w-6 text-green-500" />
                <h2 className="text-2xl font-semibold font-headline">Completed Tasks ({completedTasks.length})</h2>
              </div>
              <Accordion type="multiple" className="w-full space-y-2">
                {completedTasks.map(task => (
                  <AccordionItem key={task.id} value={task.id} className="bg-card border border-border rounded-lg shadow-sm data-[state=open]:shadow-md">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 rounded-t-lg data-[state=open]:rounded-b-none data-[state=open]:border-b">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-left font-medium text-card-foreground">{task.title}</span>
                        <TaskStatusBadge status={task.status} />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                      <TaskItem 
                        task={task} 
                        assignableUsers={assignableUsers} 
                        onDeleteTask={handleDeleteTask}
                        onUpdateTask={handleTaskUpdated}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
          
          {(statusFilter === 'all' || statusFilter === 'done') && completedTasks.length === 0 && !isLoading && (
            <section>
               <div className="flex items-center mb-4">
                <CheckCircle2 className="mr-3 h-6 w-6 text-green-500" />
                <h2 className="text-2xl font-semibold font-headline">Completed Tasks (0)</h2>
              </div>
              <div className="flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-border rounded-lg bg-card">
                <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-1">No Completed Tasks</h3>
                <p className="text-muted-foreground">Completed tasks will appear here once they are marked as 'Done'.</p>
              </div>
            </section>
          )}


          {/* Archived Tasks Section (Optional, shown if filter is 'all' or 'archived') */}
           {(statusFilter === 'all' || statusFilter === 'archived') && archivedTasks.length > 0 && (
            <section>
              <div className="flex items-center mb-4">
                <Filter className="mr-3 h-6 w-6 text-muted-foreground" />
                <h2 className="text-2xl font-semibold font-headline">Archived Tasks ({archivedTasks.length})</h2>
              </div>
              <TaskList 
                tasks={archivedTasks} 
                assignableUsers={assignableUsers} 
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleTaskUpdated}
                emptyStateMessage="No archived tasks."
              />
            </section>
          )}

        </div>
      )}
    </div>
  );
}

