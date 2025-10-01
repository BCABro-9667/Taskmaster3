
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Url, UrlCategory } from '@/types';
import { 
    getUrls, 
    createUrl, 
    updateUrl, 
    deleteUrl, 
    getUrlCategories, 
    createUrlCategory, 
    updateUrlCategory, 
    deleteUrlCategory 
} from '@/lib/url-storage';

// --- Local Storage Cache Helpers ---
function getFromCache<T>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined;
  const cachedData = localStorage.getItem(key);
  try {
    return cachedData ? JSON.parse(cachedData) : undefined;
  } catch (e) {
    console.error("Failed to parse cache", e);
    return undefined;
  }
}

function setToCache<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}


// --- Query Keys ---
const urlStorageKeys = {
  all: (userId: string) => ['urlStorage', userId] as const,
  urls: (userId: string) => [...urlStorageKeys.all(userId), 'urls'] as const,
  categories: (userId: string) => [...urlStorageKeys.all(userId), 'categories'] as const,
};

// --- Custom Hooks ---

// URLs
export function useUrls(userId: string | null | undefined) {
  const queryKey = urlStorageKeys.urls(userId!);
  return useQuery<Url[]>({
    queryKey,
    queryFn: async () => {
        const data = await getUrls(userId!);
        setToCache(JSON.stringify(queryKey), data);
        return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    placeholderData: () => getFromCache(JSON.stringify(queryKey)),
  });
}

type CreateUrlPayload = Parameters<typeof createUrl>[1];

export function useCreateUrl(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newUrlData: CreateUrlPayload) => {
        if (!userId) throw new Error("User not authenticated");
        return createUrl(userId, newUrlData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.urls(userId!) });
    },
  });
}

type UpdateUrlPayload = { id: string; updates: Partial<CreateUrlPayload> };

export function useUpdateUrl(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: UpdateUrlPayload) => {
        if (!userId) throw new Error("User not authenticated");
        return updateUrl(userId, id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.urls(userId!) });
    },
  });
}


export function useDeleteUrl(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (urlId: string) => {
        if (!userId) throw new Error("User not authenticated");
        return deleteUrl(userId, urlId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.urls(userId!) });
    },
  });
}

// Categories
export function useUrlCategories(userId: string | null | undefined) {
    const queryKey = urlStorageKeys.categories(userId!);
  return useQuery<UrlCategory[]>({
    queryKey,
    queryFn: async () => {
        const data = await getUrlCategories(userId!);
        setToCache(JSON.stringify(queryKey), data);
        return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes for categories
    placeholderData: () => getFromCache(JSON.stringify(queryKey)),
  });
}

type CreateUrlCategoryPayload = Parameters<typeof createUrlCategory>[1];

export function useCreateUrlCategory(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUrlCategoryPayload) => {
        if (!userId) throw new Error("User not authenticated");
        return createUrlCategory(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.categories(userId!) });
    },
  });
}

type UpdateUrlCategoryPayload = { id: string; name: string };

export function useUpdateUrlCategory(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: UpdateUrlCategoryPayload) => {
      if (!userId) throw new Error("User not authenticated");
      return updateUrlCategory(userId, id, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.categories(userId!) });
    },
  });
}

export function useDeleteUrlCategory(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => {
        if (!userId) throw new Error("User not authenticated");
        return deleteUrlCategory(userId, categoryId);
    },
    onSuccess: () => {
      // Invalidate both categories and URLs since URLs might have been updated
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.all(userId!) });
    },
  });
}
