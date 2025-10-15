
'use client';

import { useStorageMode } from '@/hooks/use-storage-mode';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Database, HardDrive } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function StorageModeToggle() {
  const { storageMode, setStorageMode } = useStorageMode();

  const isLocal = storageMode === 'local';

  const handleToggle = (checked: boolean) => {
    setStorageMode(checked ? 'local' : 'db');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2">
            <Label htmlFor="storage-mode-switch">
              <Database className={`h-5 w-5 transition-colors ${!isLocal ? 'text-primary' : 'text-muted-foreground'}`} />
            </Label>
            <Switch
              id="storage-mode-switch"
              checked={isLocal}
              onCheckedChange={handleToggle}
              aria-label="Toggle data storage mode"
            />
            <Label htmlFor="storage-mode-switch">
              <HardDrive className={`h-5 w-5 transition-colors ${isLocal ? 'text-primary' : 'text-muted-foreground'}`} />
            </Label>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Storage: {isLocal ? 'Local Device' : 'Cloud Database'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
