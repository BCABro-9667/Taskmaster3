
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreateAssigneeForm } from "./CreateAssigneeForm";
import type { Assignee } from '@/types'; // Changed User to Assignee

interface CreateAssigneeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAssigneeCreated: (newAssignee: Assignee) => void; // Changed User to Assignee
}

export function CreateAssigneeDialog({ isOpen, onOpenChange, onAssigneeCreated }: CreateAssigneeDialogProps) {
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
        />
      </DialogContent>
    </Dialog>
  );
}
