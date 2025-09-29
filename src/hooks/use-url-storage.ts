
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Url, UrlCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// --- Local Storage Cache Helpers ---
const URL_STORAGE_KEY = 'url-storage-data';

interface StorageData {
  urls: Url[];
  categories: UrlCategory[];
}

function getFromStorage(): StorageData {
  if (typeof window === 'undefined') {
    return { urls: [], categories: [] };
  }
  const cachedData = localStorage.getItem(URL_STORAGE_KEY);
  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      console.error("Failed to parse URL storage from localStorage", e);
    }
  }
  // Default data if nothing is in storage
  return {
    urls: [],
    categories: [
      { id: 'google', name: 'Google', createdAt: new Date().toISOString() },
      { id: 'youtube', name: 'Youtube', createdAt: new Date().toISOString() },
      { id: 'instagram', name: 'Instagram', createdAt: new Date().toISOString() },
      { id: 'facebook', name: 'Facebook', createdAt new Date().toISOString() },
    ],
  };
}

function setToStorage(data: StorageData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(URL_STORAGE_KEY, JSON.stringify(data));
  // Dispatch a custom event to notify other tabs/windows if needed
  window.dispatchEvent(new Event('url-storage-updated'));
}

// --- Query Keys ---
const urlStorageKeys = {
  all: ['urlStorage'] as const,
  urls: () => [...urlStorageKeys.all, 'urls'] as const,
  categories: () => [...urlStorageKeys.all, 'categories'] as const,
};

// This is a fake async function to simulate network latency for local storage operations
const fakeApi = async <T>(data: T, delay = 100): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), delay));


// --- Custom Hooks ---

// URLs
export function useUrls() {
  return useQuery<Url[]>({
    queryKey: urlStorageKeys.urls(),
    queryFn: () => fakeApi(getFromStorage().urls),
  });
}

type CreateUrlPayload = Omit<Url, 'id' | 'createdAt' | 'updatedAt'>;

export function useCreateUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newUrlData: CreateUrlPayload) => {
      const storage = getFromStorage();
      const newUrl: Url = {
        ...newUrlData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedData = { ...storage, urls: [newUrl, ...storage.urls] };
      setToStorage(updatedData);
      return fakeApi(newUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.urls() });
    },
  });
}

type UpdateUrlPayload = { id: string; updates: Partial<CreateUrlPayload> };

export function useUpdateUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: UpdateUrlPayload) => {
      const storage = getFromStorage();
      const updatedUrls = storage.urls.map(url =>
        url.id === id ? { ...url, ...updates, updatedAt: new Date().toISOString() } : url
      );
      setToStorage({ ...storage, urls: updatedUrls });
      const updatedUrl = updatedUrls.find(u => u.id === id);
      return fakeApi(updatedUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.urls() });
    },
  });
}


export function useDeleteUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (urlId: string) => {
      const storage = getFromStorage();
      const updatedUrls = storage.urls.filter(url => url.id !== urlId);
      setToStorage({ ...storage, urls: updatedUrls });
      return fakeApi({ deletedUrlId: urlId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.urls() });
    },
  });
}

// Categories
export function useUrlCategories() {
  return useQuery<UrlCategory[]>({
    queryKey: urlStorageKeys.categories(),
    queryFn: () => fakeApi(getFromStorage().categories),
  });
}

export function useCreateUrlCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const storage = getFromStorage();
      const newCategory: UrlCategory = {
        id: uuidv4(),
        name,
        createdAt: new Date().toISOString(),
      };
      const updatedData = { ...storage, categories: [...storage.categories, newCategory] };
      setToStorage(updatedData);
      return fakeApi(newCategory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.categories() });
    },
  });
}

export function useUpdateUrlCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const storage = getFromStorage();
      const updatedCategories = storage.categories.map(cat =>
        cat.id === id ? { ...cat, name } : cat
      );
      setToStorage({ ...storage, categories: updatedCategories });
      const updatedCategory = updatedCategories.find(c => c.id === id);
      return fakeApi(updatedCategory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.categories() });
    },
  });
}

export function useDeleteUrlCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const storage = getFromStorage();
      const updatedCategories = storage.categories.filter(cat => cat.id !== categoryId);
      // Also reset categoryId for URLs that belonged to the deleted category
      const updatedUrls = storage.urls.map(url =>
        url.categoryId === categoryId ? { ...url, categoryId: 'all' } : url
      );
      setToStorage({ categories: updatedCategories, urls: updatedUrls });
      return fakeApi({ deletedCategoryId: categoryId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: urlStorageKeys.all });
    },
  });
}
