
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Assignee, User } from '@/types';
import { getAssignees, deleteAssignee as deleteAssigneeApi } from '@/lib/tasks';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users as UsersIcon, PlusCircle, Search, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateAssigneeDialog } from '@/components/assignees/CreateAssigneeDialog';
import { EditAssigneeDialog } from '@/components/assignees/EditAssigneeDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { getCurrentUser as clientAuthGetCurrentUser } from '@/lib/client-auth';
import { useLoadingBar } from '@/hooks/use-loading-bar';
import { useRouter } from 'next/navigation';
import { useAssignees } from '@/hooks/use-tasks';


export default function AssigneesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState<Assignee | null>(null);
  const [deletingAssignee, setDeletingAssignee] = useState<Assignee | null>(null);
  
  const currentUser = clientAuthGetCurrentUser();
  const { data: assignees = [], isLoading } = useAssignees(currentUser?.id);

  const { toast } = useToast();
  const { start, complete } = useLoadingBar();
  const router = useRouter();

  const handleAssigneeUpdated = (updatedAssignee: Assignee) => {
    // React Query will handle the update, just need to close the dialog
    setEditingAssignee(null);
  };

  const confirmDeleteAssignee = async () => {
    if (!deletingAssignee || !currentUser?.id) return;
    start();
    try {
      await deleteAssigneeApi(currentUser.id, deletingAssignee.id);
      // React Query will handle the refetch
      toast({ title: 'Assignee Deleted', description: `${deletingAssignee.name} has been removed.` });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Assignee',
        description: (error as Error).message || 'Could not delete the assignee.',
      });
    } finally {
      setDeletingAssignee(null);
      complete();
    }
  };

  const filteredAssignees = useMemo(() => {
    return assignees.filter(assigneeItem => 
      assigneeItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assigneeItem.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assignees, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground">Please log in to manage assignees.</p>
         <Button onClick={() => window.location.href = '/'} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assignees by name or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!currentUser?.id} className="flex-shrink-0">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Assignee
        </Button>
      </div>
      {filteredAssignees.length > 0 ? (
        <div className="border rounded-lg shadow-sm bg-card/60 overflow-hidden">
          <Table>
            <TableHeader className="bg-primary">
              <TableRow className="hover:bg-primary border-primary">
                <TableHead className="text-primary-foreground">Name</TableHead>
                <TableHead className="text-primary-foreground">Designation</TableHead>
                <TableHead className="text-right text-primary-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignees.map(assigneeItem => ( 
                <TableRow key={assigneeItem.id} className="bg-transparent hover:bg-muted/50">
                  <TableCell className="font-medium">{assigneeItem.name}</TableCell>
                  <TableCell>{assigneeItem.designation || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                                <span className="sr-only">Assignee Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => router.push(`/assignees/${assigneeItem.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setEditingAssignee(assigneeItem)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={() => setDeletingAssignee(assigneeItem)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-card/60">
          <p>No assignees found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      )}

      {currentUser?.id && (
        <CreateAssigneeDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          currentUserId={currentUser.id}
        />
      )}

      {editingAssignee && currentUser?.id && (
        <EditAssigneeDialog
          isOpen={!!editingAssignee}
          onOpenChange={(isOpen) => !isOpen && setEditingAssignee(null)}
          assignee={editingAssignee}
          onAssigneeUpdated={handleAssigneeUpdated}
          currentUserId={currentUser.id}
        />
      )}

      {deletingAssignee && (
         <AlertDialog open={!!deletingAssignee} onOpenChange={(isOpen) => !isOpen && setDeletingAssignee(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {deletingAssignee.name} and unassign all their tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingAssignee(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteAssignee}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
