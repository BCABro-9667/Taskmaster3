
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Url, UrlCategory } from '@/types';
import { 
    getUrls as getUrlsFromDb, 
    createUrl as createUrlInDb, 
    updateUrl as updateUrlInDb, 
    deleteUrl as deleteUrlInDb, 
    getUrlCategories as getUrlCategoriesFromDb, 
    createUrlCategory as createUrlCategoryInDb, 
    updateUrlCategory as updateUrlCategoryInDb, 
    deleteUrlCategory as deleteUrlCategoryInDb 
} from '@/lib/url-storage';

import {
    getLocalUrls,
    createLocalUrl,
    updateLocalUrl,
    deleteLocalUrl,
    getLocalUrlCategories,
    createLocalUrlCategory,
    updateLocalUrlCategory,
    deleteLocalUrlCategory,
} from '@/lib/local-storage/url-storage';
import { useStorageMode } from './use-storage-mode';


// --- Query Keys ---
const urlStorageKeys = {
  all: (userId: string, mode: 'db' | 'local') => ['urlStorage', userId, mode] as const,
  urls: (userId: string, mode: 'db' | 'local') => [...urlStorageKeys.all(userId, mode), 'urls'] as const,
  categories: (userId: string, mode: 'db' | 'local') => [...urlStorageKeys.all(userId, mode), 'categories'] as const,
};

// --- Custom Hooks ---

// URLs
export function useUrls(userId: string | null | undefined) {
  const { storageMode } = useStorageMode();
  const queryKey = urlStorageKeys.urls(userId!, storageMode);
  
  const queryFn = storageMode === 'db' ? getUrlsFromDb : getLocalUrls;

  return useQuery<Url[]>({
    queryKey,
    queryFn: () => queryFn(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

type CreateUrlPayload = Parameters<typeof createUrlInDb>[1];

export function useCreateUrl(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = urlStorageKeys.urls(userId!, storageMode);

  const mutationFn = storageMode === 'db' ? createUrlInDb : createLocalUrl;

  return useMutation({
    mutationFn: (newUrlData: CreateUrlPayload) => {
        if (!userId) throw new Error("User not authenticated");
        return mutationFn(userId, newUrlData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

type UpdateUrlPayload = { id: string; updates: Partial<CreateUrlPayload> };

export function useUpdateUrl(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = urlStorageKeys.urls(userId!, storageMode);

  const mutationFn = storageMode === 'db' ? updateUrlInDb : updateLocalUrl;

  return useMutation({
    mutationFn: ({ id, updates }: UpdateUrlPayload) => {
        if (!userId) throw new Error("User not authenticated");
        return mutationFn(userId, id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}


export function useDeleteUrl(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = urlStorageKeys.urls(userId!, storageMode);
  
  const mutationFn = storageMode === 'db' ? deleteUrlInDb : deleteLocalUrl;

  return useMutation({
    mutationFn: (urlId: string) => {
        if (!userId) throw new Error("User not authenticated");
        return mutationFn(userId, urlId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Categories
export function useUrlCategories(userId: string | null | undefined) {
    const { storageMode } = useStorageMode();
    const queryKey = urlStorageKeys.categories(userId!, storageMode);

    const queryFn = storageMode === 'db' ? getUrlCategoriesFromDb : getLocalUrlCategories;

  return useQuery<UrlCategory[]>({
    queryKey,
    queryFn: () => queryFn(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes for categories
  });
}

type CreateUrlCategoryPayload = Parameters<typeof createUrlCategoryInDb>[1];

export function useCreateUrlCategory(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = urlStorageKeys.categories(userId!, storageMode);
  
  const mutationFn = storageMode === 'db' ? createUrlCategoryInDb : createLocalUrlCategory;

  return useMutation({
    mutationFn: (data: CreateUrlCategoryPayload) => {
        if (!userId) throw new Error("User not authenticated");
        return mutationFn(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

type UpdateUrlCategoryPayload = { id: string; name: string };

export function useUpdateUrlCategory(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  const queryKey = urlStorageKeys.categories(userId!, storageMode);

  const mutationFn = storageMode === 'db' ? updateUrlCategoryInDb : updateLocalUrlCategory;

  return useMutation({
    mutationFn: async ({ id, name }: UpdateUrlCategoryPayload) => {
      if (!userId) throw new Error("User not authenticated");
      return mutationFn(userId, id, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteUrlCategory(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { storageMode } = useStorageMode();
  
  const mutationFn = storageMode === 'db' ? deleteUrlCategoryInDb : deleteLocalUrlCategory;

  return useMutation({
    mutationFn: (categoryId: string) => {
        if (!userId) throw new Error("User not authenticated");
        return mutationFn(userId, categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.all(userId!, storageMode) });
    },
  });
}
