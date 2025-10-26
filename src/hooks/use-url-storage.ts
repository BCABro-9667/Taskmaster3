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
import { getCache, setCache } from '@/lib/cache-utils';

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
  
  const queryFn = async () => {
    // Try to get from cache first
    const cachedData = getCache<Url[]>(`urls_${userId}`);
    if (cachedData) {
      console.log('URLs loaded from cache');
      return cachedData;
    }
    
    // Fetch from database if not in cache
    const data = await getUrlsFromDb(userId!);
    
    // Cache the result
    setCache(`urls_${userId}`, data);
    
    return data;
  };

  return useQuery<Url[]>({
    queryKey,
    queryFn: () => queryFn(),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

type CreateUrlPayload = Parameters<typeof createUrlInDb>[1];

export function useCreateUrl(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = urlStorageKeys.urls(userId!);

  const mutationFn = createUrlInDb;

  return useMutation({
    mutationFn: (newUrlData: CreateUrlPayload) => {
        if (!userId) throw new Error("User not authenticated");
        return mutationFn(userId, newUrlData);
    },
    onSuccess: (newUrl) => {
      queryClient.invalidateQueries({ queryKey });
      
      // Update cache with new URL
      const cachedUrls = getCache<Url[]>(`urls_${userId}`);
      if (cachedUrls) {
        setCache(`urls_${userId}`, [newUrl, ...cachedUrls]);
      }
    },
  });
}

type UpdateUrlPayload = { id: string; updates: Partial<CreateUrlPayload> };

export function useUpdateUrl(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = urlStorageKeys.urls(userId!);

  const mutationFn = updateUrlInDb;

  return useMutation({
    mutationFn: ({ id, updates }: UpdateUrlPayload) => {
        if (!userId) throw new Error("User not authenticated");
        return mutationFn(userId, id, updates);
    },
    onSuccess: (updatedUrl) => {
      queryClient.invalidateQueries({ queryKey });
      
      // Update cache with updated URL
      const cachedUrls = getCache<Url[]>(`urls_${userId}`);
      if (cachedUrls) {
        const updatedUrls = cachedUrls.map(url => 
          url.id === updatedUrl?.id ? updatedUrl : url
        );
        setCache(`urls_${userId}`, updatedUrls);
      }
    },
  });
}


export function useDeleteUrl(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = urlStorageKeys.urls(userId!,);
  
  const mutationFn = deleteUrlInDb;

  return useMutation({
    mutationFn: (urlId: string) => {
        if (!userId) throw new Error("User not authenticated");
        return mutationFn(userId, urlId);
    },
    onSuccess: (_, urlId) => {
      queryClient.invalidateQueries({ queryKey });
      
      // Update cache by removing deleted URL
      const cachedUrls = getCache<Url[]>(`urls_${userId}`);
      if (cachedUrls) {
        const updatedUrls = cachedUrls.filter(url => url.id !== urlId);
        setCache(`urls_${userId}`, updatedUrls);
      }
    },
  });
}

// Categories
export function useUrlCategories(userId: string | null | undefined) {
    const queryKey = urlStorageKeys.categories(userId!);

    const queryFn = async () => {
      // Try to get from cache first
      const cachedData = getCache<UrlCategory[]>(`url_categories_${userId}`);
      if (cachedData) {
        console.log('URL categories loaded from cache');
        return cachedData;
      }
      
      // Fetch from database if not in cache
      const data = await getUrlCategoriesFromDb(userId!);
      
      // Cache the result
      setCache(`url_categories_${userId}`, data);
      
      return data;
    };

  return useQuery<UrlCategory[]>({
    queryKey,
    queryFn: () => queryFn(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes for categories
  });
}

type CreateUrlCategoryPayload = Parameters<typeof createUrlCategoryInDb>[1];

export function useCreateUrlCategory(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = urlStorageKeys.categories(userId!);
  
  const mutationFn = createUrlCategoryInDb;

  return useMutation({
    mutationFn: (data: CreateUrlCategoryPayload) => {
        if (!userId) throw new Error("User not authenticated");
        return mutationFn(userId, data);
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey });
      
      // Update cache with new category
      const cachedCategories = getCache<UrlCategory[]>(`url_categories_${userId}`);
      if (cachedCategories) {
        setCache(`url_categories_${userId}`, [...cachedCategories, newCategory]);
      }
    },
  });
}

type UpdateUrlCategoryPayload = { id: string; name: string };

export function useUpdateUrlCategory(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = urlStorageKeys.categories(userId!);

  const mutationFn = updateUrlCategoryInDb;

  return useMutation({
    mutationFn: async ({ id, name }: UpdateUrlCategoryPayload) => {
      if (!userId) throw new Error("User not authenticated");
      return mutationFn(userId, id, { name });
    },
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey });
      
      // Update cache with updated category
      const cachedCategories = getCache<UrlCategory[]>(`url_categories_${userId}`);
      if (cachedCategories) {
        const updatedCategories = cachedCategories.map(category => 
          category.id === updatedCategory?.id ? updatedCategory : category
        );
        setCache(`url_categories_${userId}`, updatedCategories);
      }
    },
  });
}

export function useDeleteUrlCategory(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  
  const mutationFn = deleteUrlCategoryInDb;

  return useMutation({
    mutationFn: (categoryId: string) => {
        if (!userId) throw new Error("User not authenticated");
        return mutationFn(userId, categoryId);
    },
    onSuccess: (_, categoryId) => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.all(userId!) });
      
      // Update cache by removing deleted category
      const cachedCategories = getCache<UrlCategory[]>(`url_categories_${userId}`);
      if (cachedCategories) {
        const updatedCategories = cachedCategories.filter(category => category.id !== categoryId);
        setCache(`url_categories_${userId}`, updatedCategories);
      }
    },
  });
}