
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Task, Assignee, User } from '@/types'; 
import { getTasks, getAssignees } from '@/lib/tasks'; 
import { useToast } from '@/hooks/use-toast';
import { Loader2, BarChart3 as PageIcon, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { getCurrentUser as clientAuthGetCurrentUser } from '@/lib/client-auth';
import { Button } from '@/components/ui/button';


interface AssigneeProgressData {
  assigneeId: string;
  assigneeName: string;
  todo: number;
  inprogress: number;
  done: number;
  total: number;
}

const chartConfig = {
  todo: {
    label: "To Do",
    color: "hsl(var(--chart-4))", 
  },
  inprogress: {
    label: "In Progress",
    color: "hsl(var(--chart-1))", 
  },
  done: {
    label: "Done",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export default function TaskProgressPage() {
  const [progressData, setProgressData] = useState<AssigneeProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Covers initial auth check and data load
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchDataAndProcess = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const [tasks, assignees] = await Promise.all([getTasks(userId), getAssignees(userId)]); 

      const dataByAssignee: Record<string, AssigneeProgressData> = {};

      assignees.forEach(assignee => { 
        dataByAssignee[assignee.id] = {
          assigneeId: assignee.id,
          assigneeName: assignee.name || 'Unnamed Assignee', 
          todo: 0,
          inprogress: 0,
          done: 0,
          total: 0,
        };
      });

      tasks.forEach(task => {
        let assigneeIdForTask: string | undefined;
        if (typeof task.assignedTo === 'string') {
            assigneeIdForTask = task.assignedTo;
        } else if (task.assignedTo && typeof task.assignedTo === 'object') {
            assigneeIdForTask = task.assignedTo.id;
        }

        if (!assigneeIdForTask || !dataByAssignee[assigneeIdForTask]) {
          return; // Skip if task is unassigned or assignee doesn't exist in user's list
        }
        
        if (task.status === 'todo') {
          dataByAssignee[assigneeIdForTask].todo++;
        } else if (task.status === 'inprogress') {
          dataByAssignee[assigneeIdForTask].inprogress++;
        } else if (task.status === 'done') {
          dataByAssignee[assigneeIdForTask].done++;
        }
        dataByAssignee[assigneeIdForTask].total++;
      });
      
      setProgressData(Object.values(dataByAssignee).filter(data => data.total > 0));

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching progress data',
        description: 'Could not load data for charts. Please try refreshing.',
      });
      setProgressData([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = clientAuthGetCurrentUser();
    if (user && user.id) {
      setCurrentUser(user);
      fetchDataAndProcess(user.id);
    } else {
      setCurrentUser(null);
      setProgressData([]);
      setIsLoading(false); // Auth check done, no user/data
    }
  }, [fetchDataAndProcess]);

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
        <p className="text-lg text-muted-foreground">Please log in to view task progress.</p>
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
      <div className="flex items-center gap-3">
        <PageIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-primary">Assignee Task Progress</h1>
      </div>

      {progressData.length > 0 ? (
        <Card className="shadow-lg bg-card/80">
          <CardHeader>
            <CardTitle>Task Distribution by Assignee</CardTitle>
            <CardDescription>
              Overview of tasks by status for each assignee you manage.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2"> 
            <ChartContainer config={chartConfig} className="min-h-[350px] w-full aspect-video">
              <RechartsBarChart 
                data={progressData} 
                margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                barCategoryGap="20%" 
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="assigneeName"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  angle={-45}
                  textAnchor="end"
                  interval={0} 
                  height={70} 
                  fontSize={12}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Legend content={<ChartLegendContent nameKey="assigneeName" />} />
                <Bar dataKey="todo" stackId="a" fill="var(--color-todo)" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="inprogress" stackId="a" fill="var(--color-inprogress)" radius={[0, 0, 0, 0]} barSize={30} />
                <Bar dataKey="done" stackId="a" fill="var(--color-done)" radius={[0, 0, 0, 0]} barSize={30} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg bg-card/80">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center py-12 px-4">
              <ListChecks className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-1 font-headline">No Task Data</h3>
              <p className="text-muted-foreground">There is no task progress data to display for assignees you manage.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="shadow-lg bg-card/80">
        <CardHeader>
          <CardTitle>More Insights Coming Soon</CardTitle>
          <CardDescription>Additional statistics and visualizations will be available here in the future.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Stay tuned for more detailed progress tracking!</p>
        </CardContent>
      </Card>
    </div>
  );
}
