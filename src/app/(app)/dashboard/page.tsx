
'use client';

import { useState, useMemo } from 'react';
import type { User } from '@/types';
import { TaskList, PrintOnlyBlankTasks } from '@/components/tasks/TaskList';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, RefreshCw, ListTodo, CheckCircle2, Search, Printer, ArrowUpDown, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useTasks, useAssignees, useUpdateTask, useDeleteTask } from '@/hooks/use-tasks';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const currentUser: User | null = clientAuthGetCurrentUser();
  const { toast } = useToast();

  const { data: tasks = [], isLoading: isLoadingTasks, isFetching: isFetchingTasks, refetch: refetchTasks } = useTasks(currentUser?.id);
  const { data: assignees = [], isLoading: isLoadingAssignees } = useAssignees(currentUser?.id);
  const { mutate: updateTask } = useUpdateTask(currentUser?.id);
  const { mutate: deleteTask } = useDeleteTask(currentUser?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('createdAtDesc');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const handleDataRefresh = () => {
    refetchTasks();
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId, {
      onSuccess: () => toast({ title: 'Task Deleted', description: 'The task has been successfully deleted.' }),
      onError: (error) => toast({ variant: 'destructive', title: 'Error Deleting Task', description: error.message }),
    });
  };
  
  const handleMarkTaskAsComplete = (taskId: string) => {
    updateTask({ id: taskId, updates: { status: 'done' } }, {
      onSuccess: () => toast({ title: 'Task Completed!', description: 'The task has been marked as done.' }),
      onError: (error) => toast({ variant: 'destructive', title: 'Error Updating Task', description: 'Could not mark the task as complete.' }),
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <h1 className="text-3xl font-bold font-headline text-primary">My Tasks</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDataRefresh} disabled={isFetchingTasks} aria-label="Refresh tasks">
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetchingTasks ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="shadow-lg no-print bg-card/60">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <PlusCircle className="mr-2 h-5 w-5 text-accent" />
            Add New Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentUser?.id && <CreateTaskForm currentUserId={currentUser.id} />}
        </CardContent>
      </Card>


      <div className="space-y-8">
        <section className="dashboard-printable-area">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 no-print">
            <div className="flex items-center">
              <ListTodo className="mr-3 h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold font-headline">Pending Tasks ({filteredAndSortedTasks.length})</h2>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
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
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Assignee
                      {selectedAssigneeIds.length > 0 && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{selectedAssigneeIds.length}</span>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Assignee</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {assignees.map(assignee => (
                      <DropdownMenuItem key={assignee.id} onSelect={(e) => e.preventDefault()}>
                        <Checkbox
                          id={`filter-assignee-${assignee.id}`}
                          className="mr-2"
                          checked={selectedAssigneeIds.includes(assignee.id)}
                          onCheckedChange={(checked) => {
                            const isChecked = !!checked;
                            return isChecked
                              ? setSelectedAssigneeIds([...selectedAssigneeIds, assignee.id])
                              : setSelectedAssigneeIds(selectedAssigneeIds.filter(id => id !== assignee.id));
                          }}
                        />
                        <label htmlFor={`filter-assignee-${assignee.id}`} className="w-full cursor-pointer">{assignee.name}</label>
                      </DropdownMenuItem>
                    ))}
                    {assignees.length === 0 && (
                      <DropdownMenuItem disabled>No assignees to filter</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortOption} onValueChange={setSortOption}>
                    <DropdownMenuRadioItem value="createdAtDesc">Date</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="assigneeNameAsc">Assignee</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
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
                emptyStateMessage={searchTerm ? 'No tasks match your search.' : 'No pending tasks. Way to go!'}
              />
              <PrintOnlyBlankTasks count={25 - filteredAndSortedTasks.length} />
            </>
          )}
        </section>

        <section className="no-print">
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
