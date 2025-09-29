
'use client';

import { useState } from 'react';
import { useUrls, useUrlCategories } from '@/hooks/use-url-storage';
import { UrlForm } from '@/components/url-storage/UrlForm';
import { UrlList } from '@/components/url-storage/UrlList';
import { CategoryTabs } from '@/components/url-storage/CategoryTabs';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function UrlStoragePage() {
  const [activeCategoryId, setActiveCategoryId] = useState('all');

  const { data: urls = [], isLoading: isLoadingUrls } = useUrls();
  const { data: categories = [], isLoading: isLoadingCategories } = useUrlCategories();

  const filteredUrls = urls.filter(url => {
    if (activeCategoryId === 'all') return true;
    return url.categoryId === activeCategoryId;
  });

  const isLoading = isLoadingUrls || isLoadingCategories;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-3">
        <LinkIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-primary">URL Storage</h1>
      </div>

      <Card className="shadow-lg bg-card/60">
        <CardContent className="p-4 md:p-6">
          <UrlForm categories={categories} />
        </CardContent>
      </Card>

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
