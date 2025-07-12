
'use client';

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask, getAssignees } from '@/lib/tasks';
import type { Task, Assignee } from '@/types';
import { getCurrentUser } from '@/lib/client-auth';

// --- Query Keys ---
const taskKeys = {
  all: (userId: string) => ['tasks', userId] as const,
  list: (userId: string) => [...taskKeys.all(userId), 'list'] as const,
};

const assigneeKeys = {
  all: (userId: string) => ['assignees', userId] as const,
  list: (userId: string) => [...assigneeKeys.all(userId), 'list'] as const,
};


// --- Hooks for Tasks ---

export function useTasks(userId: string | null | undefined) {
  return useQuery({
    queryKey: taskKeys.list(userId!),
    queryFn: () => getTasks(userId!),
    enabled: !!userId, // Only run the query if userId is available
  });
}

type CreateTaskPayload = Parameters<typeof createTask>[1];

export function useCreateTask(userId: string | null | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newTaskData: CreateTaskPayload) => {
            if (!userId) throw new Error("User not authenticated");
            return createTask(userId, newTaskData);
        },
        onMutate: async (newTaskData) => {
            await queryClient.cancelQueries({ queryKey: taskKeys.list(userId!) });
            const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.list(userId!));

            // Optimistically update to the new value
            queryClient.setQueryData<Task[]>(taskKeys.list(userId!), (old = []) => {
                const optimisticTask: Task = {
                    id: `temp-${Date.now()}`,
                    title: newTaskData.title,
                    description: newTaskData.description || '',
                    deadline: newTaskData.deadline,
                    status: 'todo',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdBy: userId!,
                    assignedTo: undefined, // Assignee info isn't available without a server roundtrip
                };
                return [optimisticTask, ...old];
            });

            return { previousTasks };
        },
        onError: (_err, _newTask, context) => {
            // Rollback on error
            queryClient.setQueryData(taskKeys.list(userId!), context?.previousTasks);
        },
        onSettled: () => {
            // Refetch after error or success to get the final server state
            queryClient.invalidateQueries({ queryKey: taskKeys.list(userId!) });
        },
    });
}

type UpdateTaskPayload = { id: string, updates: Parameters<typeof updateTask>[2] };

export function useUpdateTask(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: UpdateTaskPayload) => {
      if (!userId) throw new Error("User not authenticated");
      return updateTask(userId, id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list(userId!) });
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.list(userId!));

      // Optimistically update the specific task
      queryClient.setQueryData<Task[]>(taskKeys.list(userId!), (old = []) => 
        old.map(task =>
          task.id === id ? { ...task, ...updates, assignedTo: task.assignedTo } : task
        )
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(taskKeys.list(userId!), context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(userId!) });
    },
  });
}

export function useDeleteTask(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (taskId: string) => {
      if (!userId) throw new Error("User not authenticated");
      return deleteTask(userId, taskId);
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list(userId!) });
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.list(userId!));
      
      // Optimistically remove the task from the list
      queryClient.setQueryData<Task[]>(taskKeys.list(userId!), (old = []) => 
        old.filter(task => task.id !== taskId)
      );

      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      queryClient.setQueryData(taskKeys.list(userId!), context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(userId!) });
    },
  });
}


// --- Hooks for Assignees ---

export function useAssignees(userId: string | null | undefined) {
  return useQuery({
    queryKey: assigneeKeys.list(userId!),
    queryFn: () => getAssignees(userId!),
    enabled: !!userId,
  });
}
