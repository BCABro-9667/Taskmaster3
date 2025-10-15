
import type { Url, UrlCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const URLS_STORAGE_KEY = 'local_urls';
const CATEGORIES_STORAGE_KEY = 'local_url_categories';

// --- Helper Functions ---
function getFromStorage<T>(key: string, userId: string): T[] {
  if (typeof window === 'undefined') return [];
  const allData: { [key: string]: T[] } = JSON.parse(localStorage.getItem(key) || '{}');
  return allData[userId] || [];
}

function saveToStorage<T>(key: string, userId: string, data: T[]) {
  if (typeof window === 'undefined') return;
  const allData: { [key: string]: T[] } = JSON.parse(localStorage.getItem(key) || '{}');
  allData[userId] = data;
  localStorage.setItem(key, JSON.stringify(allData));
}

// --- URL Functions ---

export async function getLocalUrls(userId: string): Promise<Url[]> {
  return getFromStorage<Url>(URLS_STORAGE_KEY, userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createLocalUrl(userId: string, urlData: Pick<Url, 'title' | 'url' | 'categoryId'>): Promise<Url> {
  const urls = getFromStorage<Url>(URLS_STORAGE_KEY, userId);
  const newUrl: Url = {
    ...urlData,
    id: uuidv4(),
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveToStorage<Url>(URLS_STORAGE_KEY, userId, [newUrl, ...urls]);
  return newUrl;
}

type UrlUpdatePayload = Partial<Pick<Url, 'title' | 'url' | 'categoryId'>>;

export async function updateLocalUrl(userId: string, urlId: string, updates: UrlUpdatePayload): Promise<Url | null> {
    let urls = getFromStorage<Url>(URLS_STORAGE_KEY, userId);
    const urlIndex = urls.findIndex(u => u.id === urlId);

    if (urlIndex === -1) {
        return null;
    }

    const updatedUrl = {
        ...urls[urlIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    urls[urlIndex] = updatedUrl;
    saveToStorage<Url>(URLS_STORAGE_KEY, userId, urls);
    return updatedUrl;
}

export async function deleteLocalUrl(userId: string, urlId: string): Promise<{ deletedUrlId: string }> {
  let urls = getFromStorage<Url>(URLS_STORAGE_KEY, userId);
  const initialLength = urls.length;
  urls = urls.filter(u => u.id !== urlId);

  if (urls.length === initialLength) {
    throw new Error("URL not found in local storage.");
  }
  
  saveToStorage<Url>(URLS_STORAGE_KEY, userId, urls);
  return { deletedUrlId: urlId };
}

// --- Category Functions ---

export async function getLocalUrlCategories(userId: string): Promise<UrlCategory[]> {
  return getFromStorage<UrlCategory>(CATEGORIES_STORAGE_KEY, userId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createLocalUrlCategory(userId: string, categoryData: Pick<UrlCategory, 'name'>): Promise<UrlCategory> {
    const categories = getFromStorage<UrlCategory>(CATEGORIES_STORAGE_KEY, userId);
    const newCategory: UrlCategory = {
        name: categoryData.name,
        id: uuidv4(),
        createdBy: userId,
        createdAt: new Date().toISOString(),
    };
    saveToStorage<UrlCategory>(CATEGORIES_STORAGE_KEY, userId, [...categories, newCategory]);
    return newCategory;
}

export async function updateLocalUrlCategory(userId: string, categoryId: string, updates: Pick<UrlCategory, 'name'>): Promise<UrlCategory | null> {
    let categories = getFromStorage<UrlCategory>(CATEGORIES_STORAGE_KEY, userId);
    const categoryIndex = categories.findIndex(c => c.id === categoryId);

    if (categoryIndex === -1) {
        return null;
    }

    const updatedCategory = {
        ...categories[categoryIndex],
        ...updates,
    };
    categories[categoryIndex] = updatedCategory;
    saveToStorage<UrlCategory>(CATEGORIES_STORAGE_KEY, userId, categories);
    return updatedCategory;
}

export async function deleteLocalUrlCategory(userId: string, categoryId: string): Promise<{ deletedCategoryId: string }> {
    let categories = getFromStorage<UrlCategory>(CATEGORIES_STORAGE_KEY, userId);
    const initialLength = categories.length;
    categories = categories.filter(c => c.id !== categoryId);
    
    if (categories.length === initialLength) {
        throw new Error("Category not found in local storage.");
    }
    
    saveToStorage<UrlCategory>(CATEGORIES_STORAGE_KEY, userId, categories);

    // Update URLs that were in the deleted category
    let urls = getFromStorage<Url>(URLS_STORAGE_KEY, userId);
    urls = urls.map(url => url.categoryId === categoryId ? { ...url, categoryId: 'uncategorized' } : url);
    saveToStorage<Url>(URLS_STORAGE_KEY, userId, urls);
    
    return { deletedCategoryId: categoryId };
}
