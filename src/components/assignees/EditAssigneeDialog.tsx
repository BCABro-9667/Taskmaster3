
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditAssigneeForm } from "./EditAssigneeForm";
import type { Assignee } from '@/types'; 

interface EditAssigneeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  assignee: Assignee; 
  onAssigneeUpdated: (updatedAssignee: Assignee) => void; 
  currentUserId: string; // Added currentUserId
}

export function EditAssigneeDialog({ isOpen, onOpenChange, assignee, onAssigneeUpdated, currentUserId }: EditAssigneeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Assignee</DialogTitle>
          <DialogDescription>
            Update the details for {assignee.name}.
          </DialogDescription>
        </DialogHeader>
        <EditAssigneeForm
          assignee={assignee}
          onAssigneeUpdated={onAssigneeUpdated}
          closeDialog={() => onOpenChange(false)}
          currentUserId={currentUserId} // Pass currentUserId
        />
      </DialogContent>
    </Dialog>
  );
}
