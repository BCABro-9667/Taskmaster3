
'use client';

import * as React from 'react';
import type { UrlCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface CategoryTabsProps {
  categories: UrlCategory[];
  activeCategoryId: string;
  onCategoryChange: (id: string) => void;
}

export function CategoryTabs({ categories, activeCategoryId, onCategoryChange }: CategoryTabsProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-2">
            <Button
              variant={activeCategoryId === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange('all')}
              className="rounded-full"
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={activeCategoryId === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(cat.id)}
                className="rounded-full"
              >
                {cat.name}
              </Button>
            ))}
        </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
