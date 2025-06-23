
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Task, Assignee, User } from '@/types'; 
import { getTasks, getAssigneeById, getAssignees, deleteTask as deleteTaskApi, updateTask } from '@/lib/tasks'; 
import { TaskList } from '@/components/tasks/TaskList';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon, Briefcase, ListTodo, CheckCircle2, ArrowLeft, Printer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentUser as clientAuthGetCurrentUser } from '@/lib/client-auth';

export default function AssigneeDetailPage() {
  const params = useParams();
  const assigneeId = params.assigneeId as string;
  const router = useRouter();

  const [assignee, setAssignee] = useState<Assignee | null>(null); 
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allAssigneesForTaskDropdowns, setAllAssigneesForTaskDropdowns] = useState<Assignee[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async (userId: string, currentAssigneeId: string) => {
    if (!currentAssigneeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [fetchedAssignee, fetchedTasks, fetchedAllAssignees] = await Promise.all([
        getAssigneeById(userId, currentAssigneeId),
        getTasks(userId),
        getAssignees(userId)
      ]);

      if (!fetchedAssignee) {
        setAssignee(null);
        setTasks([]);
      } else {
        setAssignee(fetchedAssignee);
        setTasks(fetchedTasks.filter(task => task.assignedTo?.id === currentAssigneeId));
      }
      setAllAssigneesForTaskDropdowns(fetchedAllAssignees);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: 'Could not load assignee details or tasks.',
      });
      setAssignee(null);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = clientAuthGetCurrentUser();
    if (!user || !user.id) {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);
    if (assigneeId) {
      fetchData(user.id, assigneeId);
    }
  }, [assigneeId, router, fetchData]);

  const handleDataRefresh = () => {
    if (currentUser?.id && assigneeId) {
      fetchData(currentUser.id, assigneeId);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-10">
         <p>Please log in to view assignee details.</p>
         <Button asChild className="mt-4">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }
  
  if (!assignee) { 
    return (
      <div className="text-center py-10">
        <p>Assignee not found or you do not have permission to view this assignee.</p>
        <Button asChild className="mt-4">
          <Link href="/assignees">Back to Assignees</Link>
        </Button>
      </div>
    );
  }

  const pendingTasks = tasks.filter(task => task.status === 'todo' || task.status === 'inprogress');
  const completedTasks = tasks.filter(task => task.status === 'done');

  return (
    <div className="space-y-8 printable-content">
      <div className="flex items-center gap-2 no-print">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/assignees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignees
          </Link>
        </Button>
        <Button variant="outline" onClick={() => window.print()} className="mb-4">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center gap-4 print:justify-center">
          <div className="print:text-center">
            <CardTitle className="text-3xl font-headline text-primary flex items-center">
              <UserIcon className="mr-3 h-8 w-8 no-print" /> 
              {assignee.name}
            </CardTitle>
            {assignee.designation && (
              <CardDescription className="text-lg flex items-center mt-1">
                <Briefcase className="mr-2 h-5 w-5 text-muted-foreground no-print" />
                {assignee.designation}
              </CardDescription>
            )}
          </div>
        </CardHeader>
      </Card>

      <section>
        <div className="flex items-center mb-4">
          <ListTodo className="mr-3 h-6 w-6 text-primary no-print" />
          <h2 className="text-2xl font-semibold font-headline">Pending Tasks ({pendingTasks.length})</h2>
        </div>
        <TaskList
          tasks={pendingTasks}
          assignableUsers={allAssigneesForTaskDropdowns} 
          currentUserId={currentUser.id}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleDataRefresh}
          onMarkTaskAsComplete={handleMarkTaskAsComplete}
          emptyStateMessage={`${assignee.name} has no pending tasks.`}
          emptyStateTitle="All Caught Up!"
        />
      </section>

      <section className="no-print">
        <div className="flex items-center mb-4">
          <CheckCircle2 className="mr-3 h-6 w-6 text-green-500" />
          <h2 className="text-2xl font-semibold font-headline">Completed Tasks ({completedTasks.length})</h2>
        </div>
        <TaskList
          tasks={completedTasks}
          assignableUsers={allAssigneesForTaskDropdowns}
          currentUserId={currentUser.id}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleDataRefresh}
          onMarkTaskAsComplete={handleMarkTaskAsComplete}
          emptyStateMessage={`${assignee.name} has not completed any tasks yet.`}
          emptyStateTitle="No Completed Tasks"
        />
      </section>
    </div>
  );
}
