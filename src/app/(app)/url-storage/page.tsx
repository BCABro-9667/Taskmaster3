
'use client';

import { useState } from 'react';
import { useUrls, useUrlCategories } from '@/hooks/use-url-storage';
import { UrlForm } from '@/components/url-storage/UrlForm';
import { UrlList } from '@/components/url-storage/UrlList';
import { CategoryTabs } from '@/components/url-storage/CategoryTabs';
import { Loader2, Link as LinkIcon, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/client-auth';
import { Button } from '@/components/ui/button';

export default function UrlStoragePage() {
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const currentUser = getCurrentUser();

  const { data: urls = [], isLoading: isLoadingUrls } = useUrls(currentUser?.id);
  const { data: categories = [], isLoading: isLoadingCategories } = useUrlCategories(currentUser?.id);

  const filteredUrls = urls.filter(url => {
    if (activeCategoryId === 'all') return true;
    if (activeCategoryId === 'uncategorized') return url.categoryId === 'uncategorized' || !url.categoryId;
    return url.categoryId === activeCategoryId;
  });

  const isLoading = isLoadingUrls || isLoadingCategories;
  
  if (!currentUser) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground">Please log in to manage your URLs.</p>
         <Button onClick={() => window.location.href = '/'} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-3">
        <LinkIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-primary">URL Storage</h1>
      </div>

      <UrlForm categories={categories} />

      <div className="space-y-4">
        <CategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onCategoryChange={setActiveCategoryId}
        />
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <UrlList urls={filteredUrls} categories={categories} />
        )}
      </div>
    </div>
  );
}
