
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getTasks as getTasksFromDb, 
    createTask as createTaskInDb, 
    updateTask as updateTaskInDb, 
    deleteTask as deleteTaskInDb, 
    getAssignees as getAssigneesFromDb,
    createAssignee as createAssigneeInDb,
    deleteCompletedTasks as deleteCompletedTasksInDb 
} from '@/lib/tasks';
import {
    getLocalTasks,
    createLocalTask,
    updateLocalTask,
    deleteLocalTask,
    getLocalAssignees,
    createLocalAssignee,
    deleteLocalCompletedTasks,
} from '@/lib/local-storage/tasks';

import type { Task, Assignee, User } from '@/types';
import { useEffect } from 'react';
import { io, type Socket } from "socket.io-client";
import { useStorageMode } from './use-storage-mode';


// --- Query Keys ---
const taskKeys = {
  all: (userId: string, mode: 'db' | 'local') => ['tasks', userId, mode] as const,
  list: (userId: string, mode: 'db' | 'local') => [...taskKeys.all(userId, mode), 'list'] as const,
};

const assigneeKeys = {
  all: (userId: string, mode: 'db' | 'local') => ['assignees', userId, mode] as const,
  list: (userId: string, mode: 'db' | 'local') => [...assigneeKeys.all(userId, mode), 'list'] as const,
};


// --- Realtime Sync Hook ---
function useRealtimeSync(currentUser: User | null) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();


  useEffect(() => {
    if (!currentUser || storageMode === 'local') return;

    let socket: Socket;

    const connectSocket = async () => {
      // This fetch call initializes the socket server on the backend
      await fetch("/api/socket");

      socket = io({ path: "/api/socket_io" });

      socket.on("connect", () => {
        console.log("Socket connected");
        socket.emit("join_room", `user_${currentUser.id}`);
      });

      socket.on("data_changed", (source) => {
        console.log(`Data changed event received from ${source}, invalidating queries.`);
        queryClient.invalidateQueries();
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
      });
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentUser, queryClient, storageMode]);
}


// --- Hooks for Tasks ---

export function useTasks(userId: string | null | undefined, currentUser: User | null) {
  const { storageMode } = useStorageMode();
  const queryKey = taskKeys.list(userId!, storageMode);
  useRealtimeSync(currentUser);

  const queryFn = storageMode === 'db' ? getTasksFromDb : getLocalTasks;

  return useQuery({
    queryKey,
    queryFn: () => queryFn(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

type CreateTaskPayload = Parameters<typeof createTaskInDb>[1];

export function useCreateTask(userId: string | null | undefined) {
    const queryClient = useQueryClient();
    const { storageMode } = useStorageMode();
    const queryKey = taskKeys.list(userId!, storageMode);

    const mutationFn = storageMode === 'db' ? createTaskInDb : createLocalTask;

    return useMutation({
        mutationFn: (newTaskData: CreateTaskPayload) => {
            if (!userId) throw new Error("User not authenticated");
            return mutationFn(userId, newTaskData);
        },
        onMutate: async (newTaskData) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

            queryClient.setQueryData<Task[]>(queryKey, (old = []) => {
                const optimisticTask: Task = {
                    id: `temp-${Date.now()}`,
                    title: newTaskData.title,
                    description: newTaskData.description || '',
                    deadline: newTaskData.deadline,
                    status: 'todo',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdBy: userId!,
                    assignedTo: undefined,
                };
                return [optimisticTask, ...old];
            });

            return { previousTasks };
        },
        onError: (_err, _newTask, context) => {
            queryClient.setQueryData(queryKey, context?.previousTasks);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!, storageMode) });
        },
    });
}

type UpdateTaskPayload = { id: string, updates: Parameters<typeof updateTaskInDb>[2] };

export function useUpdateTask(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = taskKeys.list(userId!, storageMode);
  
  const mutationFn = storageMode === 'db' ? updateTaskInDb : updateLocalTask;

  return useMutation({
    mutationFn: ({ id, updates }: UpdateTaskPayload) => {
      if (!userId) throw new Error("User not authenticated");
      return mutationFn(userId, id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

      queryClient.setQueryData<Task[]>(queryKey, (old = []) => 
        old.map(task =>
          task.id === id ? { ...task, ...updates } : task
        )
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!, storageMode) });
    },
  });
}

export function useDeleteTask(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = taskKeys.list(userId!, storageMode);
  
  const mutationFn = storageMode === 'db' ? deleteTaskInDb : deleteLocalTask;

  return useMutation({
    mutationFn: (taskId: string) => {
      if (!userId) throw new Error("User not authenticated");
      return mutationFn(userId, taskId);
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      
      queryClient.setQueryData<Task[]>(queryKey, (old = []) => 
        old.filter(task => task.id !== taskId)
      );

      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      queryClient.setQueryData(queryKey, context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!, storageMode) });
    },
  });
}


export function useDeleteCompletedTasks(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = taskKeys.list(userId!, storageMode);

  const mutationFn = storageMode === 'db' ? deleteCompletedTasksInDb : deleteLocalCompletedTasks;

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("User not authenticated");
      return mutationFn(userId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      
      queryClient.setQueryData<Task[]>(queryKey, (old = []) => 
        old.filter(task => task.status !== 'done')
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!, storageMode) });
    },
  });
}



// --- Hooks for Assignees ---
export function useAssignees(userId: string | null | undefined) {
  const { storageMode } = useStorageMode();
  const queryKey = assigneeKeys.list(userId!, storageMode);

  const queryFn = storageMode === 'db' ? getAssigneesFromDb : getLocalAssignees;

  return useQuery({
    queryKey,
    queryFn: () => queryFn(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}


type CreateAssigneePayload = Parameters<typeof createAssigneeInDb>[1];

export function useCreateAssignee(userId: string | null | undefined) {
    const queryClient = useQueryClient();
    const { storageMode } = useStorageMode();
    const queryKey = assigneeKeys.list(userId!, storageMode);

    const mutationFn = storageMode === 'db' ? createAssigneeInDb : createLocalAssignee;

    return useMutation({
        mutationFn: (newAssigneeData: CreateAssigneePayload) => {
            if (!userId) throw new Error("User not authenticated");
            return mutationFn(userId, newAssigneeData);
        },
        onSuccess: (newAssignee) => {
            queryClient.invalidateQueries({ queryKey });
            return newAssignee;
        },
        onError: (error) => {
            console.error("Error creating assignee:", error);
        },
    });
}
