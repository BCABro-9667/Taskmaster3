
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Task, Assignee, User } from '@/types';
import { getTasks, deleteTask as deleteTaskApi, getAssignees, updateTask } from '@/lib/tasks';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, RefreshCw, ListTodo, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser as clientAuthGetCurrentUser } from '@/lib/client-auth';


export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const [fetchedTasks, fetchedAssignees] = await Promise.all([
        getTasks(userId),
        getAssignees(userId)
      ]);
      setTasks(fetchedTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setAssignees(fetchedAssignees);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: 'Could not load tasks or assignees. Please try refreshing.',
      });
      setTasks([]);
      setAssignees([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = clientAuthGetCurrentUser();
    if (user && user.id) {
      setCurrentUser(user);
      fetchData(user.id);
    } else {
      setCurrentUser(null);
      setTasks([]);
      setAssignees([]);
      setIsLoading(false);
    }
  }, [fetchData]);

  const handleDataRefresh = () => {
    if (currentUser?.id) {
      fetchData(currentUser.id);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser?.id) return;
    try {
      await deleteTaskApi(currentUser.id, taskId);
      toast({ title: 'Task Deleted', description: 'The task has been successfully deleted.' });
      handleDataRefresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Task',
        description: (error as Error).message || 'Could not delete the task. Please try again.',
      });
    }
  };
  
  const handleMarkTaskAsComplete = async (taskId: string) => {
    if (!currentUser?.id) return;
    try {
      await updateTask(currentUser.id, taskId, { status: 'done' });
      toast({ title: 'Task Completed!', description: 'The task has been marked as done.' });
      handleDataRefresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Updating Task',
        description: 'Could not mark the task as complete. Please try again.',
      });
    }
  };


  const pendingTasks = tasks.filter(task => task.status === 'todo' || task.status === 'inprogress');
  const completedTasks = tasks.filter(task => task.status === 'done');

  if (!currentUser && isLoading) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser && !isLoading) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground">Please log in to view your dashboard.</p>
         <Button onClick={() => window.location.href = '/'} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }
  
  if (currentUser && isLoading) {
     return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline text-primary">My Tasks</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDataRefresh} disabled={isLoading} aria-label="Refresh tasks">
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
          {currentUser?.id && <CreateTaskForm onTaskCreated={handleDataRefresh} currentUserId={currentUser.id} />}
        </CardContent>
      </Card>


      <div className="space-y-8">
        <section>
          <div className="flex items-center mb-4">
            <ListTodo className="mr-3 h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold font-headline">Pending Tasks ({pendingTasks.length})</h2>
          </div>
          {currentUser?.id && (
            <TaskList 
              tasks={pendingTasks} 
              assignableUsers={assignees}
              currentUserId={currentUser.id}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleDataRefresh}
              onMarkTaskAsComplete={handleMarkTaskAsComplete}
              emptyStateMessage="No pending tasks. Way to go!"
            />
          )}
        </section>

        <section>
          <div className="flex items-center mb-4">
            <CheckCircle2 className="mr-3 h-6 w-6 text-green-500" />
            <h2 className="text-2xl font-semibold font-headline">Completed Tasks ({completedTasks.length})</h2>
          </div>
          {currentUser?.id && (
            <TaskList
              tasks={completedTasks}
              assignableUsers={assignees}
              currentUserId={currentUser.id}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleDataRefresh}
              onMarkTaskAsComplete={handleMarkTaskAsComplete}
              emptyStateMessage="Completed tasks will appear here once they are marked as 'Done'."
              emptyStateTitle="No Completed Tasks"
            />
          )}
        </section>
      </div>
    </div>
  );
}
