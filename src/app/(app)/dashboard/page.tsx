
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Task, Assignee, User } from '@/types';
import { getTasks, deleteTask as deleteTaskApi, getAssignees, updateTask } from '@/lib/tasks';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, RefreshCw, ListTodo, CheckCircle2, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TaskItem } from '@/components/tasks/TaskItem';
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
      const success = await deleteTaskApi(currentUser.id, taskId);
      if (success) {
        toast({ title: 'Task Deleted', description: 'The task has been successfully deleted.' });
        handleDataRefresh();
      } else {
        throw new Error('Failed to delete the task on the server.');
      }
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

        {completedTasks.length > 0 && currentUser?.id && (
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
                      <span className="text-left font-medium text-card-foreground truncate">{task.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0 border-t-0"> 
                    <TaskItem 
                      task={task} 
                      assignableUsers={assignees}
                      currentUserId={currentUser!.id} 
                      onDeleteTask={handleDeleteTask}
                      onUpdateTask={handleDataRefresh}
                      onMarkTaskAsComplete={handleMarkTaskAsComplete}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}
        
        {completedTasks.length === 0 && (
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
      </div>
    </div>
  );
}
