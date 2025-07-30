
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { User } from '@/types';
import { TaskList, PrintOnlyBlankTasks } from '@/components/tasks/TaskList';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, RefreshCw, ListTodo, CheckCircle2, Search, Printer, ArrowUpDown, Filter, Trash2, Sigma, Hourglass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getCurrentUser as clientAuthGetCurrentUser } from '@/lib/client-auth';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from '@/components/ui/checkbox';
import { useTasks, useAssignees, useUpdateTask, useDeleteTask, useDeleteCompletedTasks } from '@/hooks/use-tasks';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


export default function DashboardPage() {
  const currentUser: User | null = clientAuthGetCurrentUser();
  const { toast } = useToast();

  const { data: tasks = [], isLoading: isLoadingTasks, isFetching: isFetchingTasks, refetch: refetchTasks } = useTasks(currentUser?.id, currentUser);
  const { data: assignees = [], isLoading: isLoadingAssignees } = useAssignees(currentUser?.id);
  const { mutate: updateTask } = useUpdateTask(currentUser?.id);
  const { mutate: deleteTask } = useDeleteTask(currentUser?.id);
  const { mutate: deleteCompletedTasks } = useDeleteCompletedTasks(currentUser?.id);


  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('createdAtDesc');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [lastSelectedAssigneeId, setLastSelectedAssigneeId] = useState<string>('unassigned');
  
  useEffect(() => {
    const savedAssigneeId = localStorage.getItem('lastSelectedAssigneeId');
    if (savedAssigneeId) {
      setLastSelectedAssigneeId(savedAssigneeId);
    }
  }, []);
  
  const handleAssigneeChange = (assigneeId: string) => {
    setLastSelectedAssigneeId(assigneeId);
    localStorage.setItem('lastSelectedAssigneeId', assigneeId);
  }

  const handleFilterChange = (isChecked: boolean, assigneeId: string) => {
    const newSelectedIds = isChecked
      ? [...selectedAssigneeIds, assigneeId]
      : selectedAssigneeIds.filter(id => id !== assigneeId);
    
    setSelectedAssigneeIds(newSelectedIds);

    if (isChecked) {
      handleAssigneeChange(assigneeId);
    } else if (newSelectedIds.length > 0) {
      handleAssigneeChange(newSelectedIds[newSelectedIds.length - 1]);
    } else {
      handleAssigneeChange('unassigned');
    }
  };


  const handleDataRefresh = () => {
    refetchTasks();
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId, {
      onError: (error) => toast({ variant: 'destructive', title: 'Error Deleting Task', description: error.message }),
    });
  };
  
  const handleMarkTaskAsComplete = (taskId: string) => {
    updateTask({ id: taskId, updates: { status: 'done' } }, {
      onError: (error) => toast({ variant: 'destructive', title: 'Error Updating Task', description: 'Could not mark the task as complete.' }),
    });
  };

  const handleMarkTaskAsPending = (taskId: string) => {
    updateTask({ id: taskId, updates: { status: 'todo' } }, {
      onError: (error) => toast({ variant: 'destructive', title: 'Error Updating Task', description: 'Could not move the task to pending.' }),
    });
  };
  
  const handleDeleteAllCompleted = () => {
    deleteCompletedTasks(undefined, {
      onError: (error) => toast({ variant: 'destructive', title: 'Error Deleting Tasks', description: error.message }),
      onSettled: () => setIsDeleteAllConfirmOpen(false),
    });
  };

  const pendingTasks = tasks.filter(task => task.status === 'todo' || task.status === 'inprogress');
  const completedTasks = tasks.filter(task => task.status === 'done');

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = pendingTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedAssigneeIds.length > 0) {
      filtered = filtered.filter(task => 
        task.assignedTo && selectedAssigneeIds.includes(task.assignedTo.id)
      );
    }

    if (sortOption === 'createdAtDesc') {
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } 
    
    if (sortOption === 'assigneeNameAsc') {
        return filtered.sort((a, b) => {
            const nameA = a.assignedTo?.name || 'zzzz'; 
            const nameB = b.assignedTo?.name || 'zzzz';
            return nameA.localeCompare(nameB);
        });
    }

    return filtered;
  }, [pendingTasks, searchTerm, sortOption, selectedAssigneeIds]);

  const handlePrint = () => {
    window.print();
  };

  const isLoading = isLoadingTasks || isLoadingAssignees;
  
  if (!currentUser) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground">Please log in to view your dashboard.</p>
         <Button onClick={() => window.location.href = '/'} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }
  
  if (isLoading) {
     return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8">

        <Card className="shadow-lg no-print bg-card/60">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center">
              <PlusCircle className="mr-2 h-5 w-5 text-accent" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentUser?.id && <CreateTaskForm 
              currentUserId={currentUser.id} 
              lastSelectedAssigneeId={lastSelectedAssigneeId}
              onAssigneeChange={handleAssigneeChange}
            />}
          </CardContent>
        </Card>


        <div className="space-y-8">
          <section className="dashboard-printable-area">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 no-print">
              <div className="flex items-center self-start sm:self-center">
                <ListTodo className="mr-3 h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold font-headline">Pending Tasks ({filteredAndSortedTasks.length})</h2>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleDataRefresh} disabled={isFetchingTasks} aria-label="Refresh tasks">
                      <RefreshCw className={`h-4 w-4 ${isFetchingTasks ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh</p>
                  </TooltipContent>
                </Tooltip>
                <div className="relative flex-grow sm:flex-grow-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                </div>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                          {selectedAssigneeIds.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{selectedAssigneeIds.length}</span>}
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter by Assignee</p>
                    </TooltipContent>
                  </Tooltip>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Filter by Assignee</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {assignees.map(assignee => (
                        <DropdownMenuItem key={assignee.id} onSelect={(e) => e.preventDefault()}>
                           <label htmlFor={`filter-assignee-${assignee.id}`} className="w-full cursor-pointer flex items-center p-2 border rounded-md hover:bg-muted/50">
                            <Checkbox
                              id={`filter-assignee-${assignee.id}`}
                              className="mr-2"
                              checked={selectedAssigneeIds.includes(assignee.id)}
                              onCheckedChange={(checked) => {
                                handleFilterChange(!!checked, assignee.id);
                              }}
                            />
                            {assignee.name}
                          </label>
                        </DropdownMenuItem>
                      ))}
                      {assignees.length === 0 && (
                        <DropdownMenuItem disabled>No assignees to filter</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sort</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sortOption} onValueChange={setSortOption}>
                      <DropdownMenuRadioItem value="createdAtDesc">Date</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="assigneeNameAsc">Assignee</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Print</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            {currentUser?.id && (
              <>
                <TaskList 
                  tasks={filteredAndSortedTasks} 
                  assignableUsers={assignees}
                  currentUserId={currentUser.id}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTask={handleDataRefresh}
                  onMarkTaskAsComplete={handleMarkTaskAsComplete}
                  onMarkTaskAsPending={handleMarkTaskAsPending}
                  emptyStateMessage={searchTerm ? 'No tasks match your search.' : 'No pending tasks. Way to go!'}
                />
                <PrintOnlyBlankTasks count={Math.max(0, 40 - filteredAndSortedTasks.length)} />
              </>
            )}
          </section>

          <section className="no-print">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="completed-tasks" className="border-none">
                <AccordionTrigger className="hover:no-underline">
                   <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                          <CheckCircle2 className="mr-3 h-6 w-6 text-green-500" />
                          <h2 className="text-2xl font-semibold font-headline">Completed Tasks ({completedTasks.length})</h2>
                      </div>
                      {completedTasks.length > 0 && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation(); // prevent accordion from toggling
                            setIsDeleteAllConfirmOpen(true)
                          }}
                          className="mr-4"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete All
                        </Button>
                      )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {currentUser?.id && (
                    <TaskList
                      tasks={completedTasks}
                      assignableUsers={assignees}
                      currentUserId={currentUser.id}
                      onDeleteTask={handleDeleteTask}
                      onUpdateTask={handleDataRefresh}
                      onMarkTaskAsComplete={handleMarkTaskAsComplete}
                      onMarkTaskAsPending={handleMarkTaskAsPending}
                      emptyStateMessage="Completed tasks will appear here once they are marked as 'Done'."
                      emptyStateTitle="No Completed Tasks"
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>
      </div>
      
      <div className="print-only-extra-page">
        <PrintOnlyBlankTasks count={40} />
      </div>

      <AlertDialog open={isDeleteAllConfirmOpen} onOpenChange={setIsDeleteAllConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all {completedTasks.length} completed tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllCompleted}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Yes, delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </TooltipProvider>
  );
}
