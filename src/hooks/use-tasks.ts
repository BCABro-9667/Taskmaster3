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
import { getCache, setCache } from '@/lib/cache-utils';

import type { Task, Assignee, User } from '@/types';
import { useEffect } from 'react';
import { io, type Socket } from "socket.io-client";


// --- Query Keys ---
const taskKeys = {
  all: (userId: string) => ['tasks', userId] as const,
  list: (userId: string) => [...taskKeys.all(userId), 'list'] as const,
};

const assigneeKeys = {
  all: (userId: string) => ['assignees', userId] as const,
  list: (userId: string) => [...assigneeKeys.all(userId), 'list'] as const,
};


// --- Realtime Sync Hook ---
// Disabled: Socket.IO requires a custom server in Next.js
function useRealtimeSync(currentUser: User | null) {
  // Disabled to prevent 404 errors
  return;
  
  /* Original socket.io implementation disabled
  const queryClient = useQueryClient();


  useEffect(() => {
    if (!currentUser) return;

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
  }, [currentUser, queryClient]);
  */
}


// --- Hooks for Tasks ---

export function useTasks(userId: string | null | undefined, currentUser: User | null) {
  const queryKey = taskKeys.list(userId!);
  useRealtimeSync(currentUser);

  const queryFn = async () => {
    // Try to get from cache first
    const cachedData = getCache<Task[]>(`tasks_${userId}`);
    if (cachedData) {
      console.log('Tasks loaded from cache');
      return cachedData;
    }
    
    // Fetch from database if not in cache
    const data = await getTasksFromDb(userId!);
    
    // Cache the result
    setCache(`tasks_${userId}`, data);
    
    return data;
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

type CreateTaskPayload = Parameters<typeof createTaskInDb>[1];

export function useCreateTask(userId: string | null | undefined) {
    const queryClient = useQueryClient();
    const queryKey = taskKeys.list(userId!);

    const mutationFn = createTaskInDb;

    return useMutation({
        mutationFn: (newTaskData: CreateTaskPayload) => {
            if (!userId) throw new Error("User not authenticated");
            return mutationFn(userId, newTaskData);
        },
        onMutate: async (newTaskData) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

            // Note: We're not creating an optimistic task here because of the complex type structure
            // The actual task will be fetched after creation
            return { previousTasks };
        },
        onError: (_err, _newTask, context) => {
            queryClient.setQueryData(queryKey, context?.previousTasks);
        },
        onSuccess: (newTask) => {
            // Update cache with new task
            const cachedTasks = getCache<Task[]>(`tasks_${userId}`);
            if (cachedTasks) {
              setCache(`tasks_${userId}`, [newTask, ...cachedTasks]);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}

type UpdateTaskPayload = { id: string; updates: Parameters<typeof updateTaskInDb>[2] };

export function useUpdateTask(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = taskKeys.list(userId!);
  
  const mutationFn = updateTaskInDb;

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateTaskPayload) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const result = await mutationFn(userId, id, updates);
        if (result === null) {
          throw new Error("Failed to update task. Task not found or you don't have permission to update it.");
        }
        return result;
      } catch (error) {
        console.error("Error updating task:", error);
        throw error;
      }
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

      // For optimistic updates, we need to handle the type conversion properly
      queryClient.setQueryData<Task[]>(queryKey, (old = []) => 
        old.map(task => {
          if (task.id === id) {
            // Create a new task object with the updates
            const updatedTask = { ...task };
            
            // Apply updates, handling special cases
            Object.keys(updates).forEach(key => {
              const typedKey = key as keyof Task;
              if (typedKey === 'assignedTo') {
                // Skip assigning assignedTo in optimistic update to avoid type issues
                // The actual update will happen on the server
                return;
              }
              (updatedTask as any)[typedKey] = (updates as any)[typedKey];
            });
            
            return updatedTask;
          }
          return task;
        })
      );

      return { previousTasks };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousTasks);
      console.error("Error in useUpdateTask:", error);
    },
    onSuccess: (updatedTask) => {
      // Update cache with updated task
      const cachedTasks = getCache<Task[]>(`tasks_${userId}`);
      if (cachedTasks) {
        const updatedTasks = cachedTasks.map(task => 
          task.id === updatedTask?.id ? updatedTask : task
        );
        setCache(`tasks_${userId}`, updatedTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!) });
    },
  });
}

export function useDeleteTask(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = taskKeys.list(userId!);
  
  const mutationFn = deleteTaskInDb;

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
    onSuccess: (_, taskId) => {
      // Update cache by removing deleted task
      const cachedTasks = getCache<Task[]>(`tasks_${userId}`);
      if (cachedTasks) {
        const updatedTasks = cachedTasks.filter(task => task.id !== taskId);
        setCache(`tasks_${userId}`, updatedTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!) });
    },
  });
}


export function useDeleteCompletedTasks(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = taskKeys.list(userId!);

  const mutationFn = deleteCompletedTasksInDb;

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
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousTasks);
    },
    onSuccess: () => {
      // Update cache by removing completed tasks
      const cachedTasks = getCache<Task[]>(`tasks_${userId}`);
      if (cachedTasks) {
        const updatedTasks = cachedTasks.filter(task => task.status !== 'done');
        setCache(`tasks_${userId}`, updatedTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: assigneeKeys.list(userId!) });
    },
  });
}


// --- Hooks for Assignees ---

export function useAssignees(userId: string | null | undefined) {
  const queryKey = assigneeKeys.list(userId!);

  const queryFn = async () => {
    // Try to get from cache first
    const cachedData = getCache<Assignee[]>(`assignees_${userId}`);
    if (cachedData) {
      console.log('Assignees loaded from cache');
      return cachedData;
    }
    
    // Fetch from database if not in cache
    const data = await getAssigneesFromDb(userId!);
    
    // Cache the result
    setCache(`assignees_${userId}`, data);
    
    return data;
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}


type CreateAssigneePayload = Parameters<typeof createAssigneeInDb>[1];

export function useCreateAssignee(userId: string | null | undefined) {
    const queryClient = useQueryClient();
    const queryKey = assigneeKeys.list(userId!);

    const mutationFn = createAssigneeInDb;

    return useMutation({
        mutationFn: (newAssigneeData: CreateAssigneePayload) => {
            if (!userId) throw new Error("User not authenticated");
            return mutationFn(userId, newAssigneeData);
        },
        onSuccess: (newAssignee) => {
            queryClient.invalidateQueries({ queryKey });
            
            // Update cache with new assignee
            const cachedAssignees = getCache<Assignee[]>(`assignees_${userId}`);
            if (cachedAssignees) {
              setCache(`assignees_${userId}`, [...cachedAssignees, newAssignee]);
            }
            
            return newAssignee;
        },
        onError: (error) => {
            console.error("Error creating assignee:", error);
        },
    });
}