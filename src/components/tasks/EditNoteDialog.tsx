
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditNoteForm } from "./EditNoteForm";
import type { Task } from '@/types';

interface EditNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task;
  onNoteUpdated: () => void;
}

export function EditNoteDialog({ isOpen, onOpenChange, task, onNoteUpdated }: EditNoteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task.description ? 'Edit Note' : 'Add Note'} for "{task.title}"</DialogTitle>
          <DialogDescription>
            {task.description ? 'Update the note for this task.' : 'Add a detailed note or description for this task.'}
          </DialogDescription>
        </DialogHeader>
        <EditNoteForm
          task={task}
          onNoteUpdated={onNoteUpdated}
          closeDialog={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
