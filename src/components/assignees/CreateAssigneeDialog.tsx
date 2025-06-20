
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreateAssigneeForm } from "./CreateAssigneeForm";
import type { Assignee } from '@/types'; 

interface CreateAssigneeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAssigneeCreated: (newAssignee: Assignee) => void; 
  currentUserId: string; // Added currentUserId
}

export function CreateAssigneeDialog({ isOpen, onOpenChange, onAssigneeCreated, currentUserId }: CreateAssigneeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Assignee</DialogTitle>
          <DialogDescription>
            Add a new person to assign tasks to.
          </DialogDescription>
        </DialogHeader>
        <CreateAssigneeForm 
          onAssigneeCreated={onAssigneeCreated} 
          closeDialog={() => onOpenChange(false)}
          currentUserId={currentUserId} // Pass currentUserId
        />
      </DialogContent>
    </Dialog>
  );
}
