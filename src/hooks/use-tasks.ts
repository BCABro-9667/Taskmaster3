
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask, getAssignees, deleteCompletedTasks } from '@/lib/tasks';
import type { Task, Assignee } from '@/types';
import { useEffect } from 'react';

// --- Local Storage Cache Helpers ---
function getFromCache<T>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined;
  const cachedData = localStorage.getItem(key);
  return cachedData ? JSON.parse(cachedData) : undefined;
}

function setToCache<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}


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
  const queryKey = taskKeys.list(userId!);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const data = await getTasks(userId!);
      setToCache(JSON.stringify(queryKey), data);
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    placeholderData: () => getFromCache(JSON.stringify(queryKey)), // Load initial data from cache
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
                    assignedTo: undefined, // Assignee info isn't available on client yet
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
            queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!) });
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
          task.id === id ? { ...task, ...updates } : task
        )
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(taskKeys.list(userId!), context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(userId!) });
      queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!) });
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
      queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!) });
    },
  });
}


export function useDeleteCompletedTasks(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("User not authenticated");
      return deleteCompletedTasks(userId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list(userId!) });
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.list(userId!));
      
      // Optimistically remove all 'done' tasks
      queryClient.setQueryData<Task[]>(taskKeys.list(userId!), (old = []) => 
        old.filter(task => task.status !== 'done')
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(taskKeys.list(userId!), context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(userId!) });
      queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!) });
    },
  });
}



// --- Hooks for Assignees ---

export function useAssignees(userId: string | null | undefined) {
  const queryKey = assigneeKeys.list(userId!);
  
  return useQuery({
    queryKey: assigneeKeys.list(userId!),
    queryFn: async () => {
      const data = await getAssignees(userId!);
      setToCache(JSON.stringify(queryKey), data);
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    placeholderData: () => getFromCache(JSON.stringify(queryKey)),
  });
}
