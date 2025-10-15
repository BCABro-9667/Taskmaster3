
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Task, Assignee, User } from '@/types'; 
import { getTasks, getAssigneeById, getAssignees, deleteTask as deleteTaskApi, updateTask } from '@/lib/tasks'; 
import { TaskList, PrintOnlyBlankTasks } from '@/components/tasks/TaskList';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon, Briefcase, ListTodo, CheckCircle2, ArrowLeft, Printer, Sigma, Hourglass } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentUser as clientAuthGetCurrentUser } from '@/lib/client-auth';
import { useLoadingBar } from '@/hooks/use-loading-bar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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
  const { start, complete } = useLoadingBar();

  const fetchData = useCallback(async (userId: string, currentAssigneeId: string) => {
    if (!currentAssigneeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    start();
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
      complete();
    }
  }, [toast, start, complete]);

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
    start();
    try {
      await deleteTaskApi(currentUser.id, taskId);
      handleDataRefresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Task',
        description: (error as Error).message || 'Could not delete the task. Please try again.',
      });
    } finally {
      complete();
    }
  };
  
  const handleMarkTaskAsComplete = async (taskId: string) => {
    if (!currentUser?.id) return;
    start();
    try {
      await updateTask(currentUser.id, taskId, { status: 'done' });
      handleDataRefresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Updating Task',
        description: 'Could not mark the task as complete. Please try again.',
      });
    } finally {
      complete();
    }
  };

  const handleMarkTaskAsPending = async (taskId: string) => {
    if (!currentUser?.id) return;
    start();
    try {
      await updateTask(currentUser.id, taskId, { status: 'todo' });
      handleDataRefresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Updating Task',
        description: 'Could not move the task to pending. Please try again.',
      });
    } finally {
      complete();
    }
  };
  
  const getAssigneeInitials = (name: string | undefined) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
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
  const totalTasks = tasks.length;

  return (
    <TooltipProvider>
    <div className="space-y-8">
      <div className="flex items-center gap-2 no-print">
        <Button variant="outline" asChild>
          <Link href="/assignees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignees
          </Link>
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={() => window.print()} className="mb-0">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Print Page</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="printable-content">
        <Card className="shadow-lg screen-view bg-card/60">
          <CardHeader className="flex flex-col md:flex-row items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
               {assignee.profileImageUrl && <AvatarImage src={assignee.profileImageUrl} alt={assignee.name || ''} />}
               <AvatarFallback className="text-3xl bg-muted">{getAssigneeInitials(assignee.name)}</AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <CardTitle className="text-3xl font-headline text-primary flex items-center justify-center md:justify-start">
                {assignee.name}
              </CardTitle>
              {assignee.designation && (
                <CardDescription className="text-lg flex items-center mt-1 justify-center md:justify-start">
                  <Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />
                  {assignee.designation}
                </CardDescription>
              )}
            </div>
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 screen-view">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <Sigma className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <p className="text-xs text-muted-foreground">All assigned tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Hourglass className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasks.length}</div>
                <p className="text-xs text-muted-foreground">Tasks in-progress or to-do</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedTasks.length}</div>
                <p className="text-xs text-muted-foreground">Tasks marked as done</p>
              </CardContent>
            </Card>
        </div>


        <section className="mt-8">
          <div className="flex items-center mb-4 no-print">
            <ListTodo className="mr-3 h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold font-headline">Pending Tasks ({pendingTasks.length})</h2>
          </div>
          <TaskList
            tasks={pendingTasks}
            assignableUsers={allAssigneesForTaskDropdowns} 
            currentUserId={currentUser.id}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleDataRefresh}
            onMarkTaskAsComplete={handleMarkTaskAsComplete}
            onMarkTaskAsPending={handleMarkTaskAsPending}
            emptyStateMessage={`${assignee.name} has no pending tasks.`}
            emptyStateTitle="All Caught Up!"
          />
          <PrintOnlyBlankTasks count={Math.max(0, 40 - pendingTasks.length)} />
        </section>
      </div>

      <div className="print-only-extra-page">
        <PrintOnlyBlankTasks count={40} />
      </div>

      <section className="no-print">
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="completed-tasks" className="border-none">
                <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center">
                        <CheckCircle2 className="mr-3 h-6 w-6 text-green-500" />
                        <h2 className="text-2xl font-semibold font-headline">Completed Tasks ({completedTasks.length})</h2>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <TaskList
                      tasks={completedTasks}
                      assignableUsers={allAssigneesForTaskDropdowns}
                      currentUserId={currentUser.id}
                      onDeleteTask={handleDeleteTask}
                      onUpdateTask={handleDataRefresh}
                      onMarkTaskAsComplete={handleMarkTaskAsComplete}
                      onMarkTaskAsPending={handleMarkTaskAsPending}
                      emptyStateMessage={`${assignee.name} has not completed any tasks yet.`}
                      emptyStateTitle="No Completed Tasks"
                    />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </section>
    </div>
    </TooltipProvider>
  );
}
