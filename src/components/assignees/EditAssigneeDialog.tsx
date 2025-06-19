
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditAssigneeForm } from "./EditAssigneeForm";
import type { Assignee } from '@/types'; // Changed User to Assignee

interface EditAssigneeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  assignee: Assignee; // Changed User to Assignee
  onAssigneeUpdated: (updatedAssignee: Assignee) => void; // Changed User to Assignee
}

export function EditAssigneeDialog({ isOpen, onOpenChange, assignee, onAssigneeUpdated }: EditAssigneeDialogProps) {
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
        />
      </DialogContent>
    </Dialog>
  );
}
