
'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStorageMode } from '@/hooks/use-storage-mode';
import { getCurrentUser } from '@/lib/client-auth';

const LOCAL_STORAGE_KEYS = [
  'local_tasks', 
  'local_assignees', 
  'local_notes', 
  'local_url_categories', 
  'local_urls'
];

export function StorageManagement() {
  const { toast } = useToast();
  const { storageMode } = useStorageMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();

  const handleExport = () => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to export data.' });
      return;
    }

    try {
      const allData: { [key: string]: any } = {};
      LOCAL_STORAGE_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          allData[key] = JSON.parse(data);
        }
      });
      
      const userSpecificData = allData;

      if (Object.keys(userSpecificData).length === 0) {
        toast({ title: 'No Data to Export', description: 'There is no local data to export.' });
        return;
      }

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(userSpecificData, null, 2)
      )}`;
      const link = document.createElement('a');
      link.href = jsonString;
      link.download = `taskmaster-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast({ variant: 'success', title: 'Export Successful', description: 'Your local data has been downloaded.' });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export your data.' });
    }
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File is not readable");
        }
        const importedData = JSON.parse(text);
        
        // Basic validation
        if (typeof importedData !== 'object' || importedData === null) {
            throw new Error("Invalid backup file format.");
        }

        // Clear existing data before import
        LOCAL_STORAGE_KEYS.forEach(key => {
            localStorage.removeItem(key);
        });

        // Set new data
        Object.keys(importedData).forEach(key => {
            if (LOCAL_STORAGE_KEYS.includes(key)) {
                localStorage.setItem(key, JSON.stringify(importedData[key]));
            }
        });
        
        // Force refresh all data in the app
        queryClient.invalidateQueries();

        toast({ variant: 'success', title: 'Import Successful', description: 'Your data has been restored from the backup.' });

      } catch (error) {
        console.error("Import failed:", error);
        toast({ variant: 'destructive', title: 'Import Failed', description: (error as Error).message || 'The backup file is invalid or corrupted.' });
      } finally {
        // Reset file input
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const isLocalStorageMode = storageMode === 'local';

  return (
    <>
      <Card className="mt-6 shadow-lg bg-card/60">
        <CardHeader>
          <CardTitle>Local Storage Management</CardTitle>
          <CardDescription>
            Export or import your application data stored on this device. This only affects data in "Local Device" mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isLocalStorageMode && (
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
              You are currently in **Cloud Database** mode. These actions will only affect data stored on this device from when you were in "Local Device" mode. Switch modes to manage active local data.
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExport} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Export Local Data
            </Button>
            <Button onClick={handleImportClick} variant="secondary" className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Import from Backup
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="application/json"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
