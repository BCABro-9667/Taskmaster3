
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Assignee, User } from '@/types';
import { getAssignees, deleteAssignee as deleteAssigneeApi } from '@/lib/tasks';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users as UsersIcon, PlusCircle, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import Link from 'next/link';
import { getCurrentUser as clientAuthGetCurrentUser } from '@/lib/client-auth';

export default function AssigneesPage() {
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Covers initial auth check and data load
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState<Assignee | null>(null);
  const [deletingAssignee, setDeletingAssignee] = useState<Assignee | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const fetchedAssignees = await getAssignees(userId);
      setAssignees(fetchedAssignees);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching assignees',
        description: 'Could not load assignees. Please try refreshing.',
      });
      setAssignees([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = clientAuthGetCurrentUser();
    if (user && user.id) {
      setCurrentUser(user);
      fetchData(user.id);
    } else {
      setCurrentUser(null);
      setAssignees([]);
      setIsLoading(false); // Auth check done, no user/data
    }
  }, [fetchData]);


  const handleAssigneeCreated = (newAssignee: Assignee) => {
    setAssignees(prev => [...prev, newAssignee].sort((a,b) => (a.name || '').localeCompare(b.name || '')));
    setIsCreateDialogOpen(false);
  };

  const handleAssigneeUpdated = (updatedAssignee: Assignee) => {
    setAssignees(prev => prev.map(item => item.id === updatedAssignee.id ? updatedAssignee : item).sort((a,b) => (a.name || '').localeCompare(b.name || '')));
    setEditingAssignee(null);
    // Optionally re-fetch if complex updates might affect sorting or other derived state
    // if (currentUser && currentUser.id) fetchData(currentUser.id);
  };

  const confirmDeleteAssignee = async () => {
    if (!deletingAssignee || !currentUser?.id) return;
    try {
      await deleteAssigneeApi(currentUser.id, deletingAssignee.id);
      setAssignees(prev => prev.filter(item => item.id !== deletingAssignee.id));
      toast({ title: 'Assignee Deleted', description: `${deletingAssignee.name} has been removed.` });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Assignee',
        description: (error as Error).message || 'Could not delete the assignee.',
      });
    } finally {
      setDeletingAssignee(null);
    }
  };

  const filteredAssignees = useMemo(() => {
    return assignees.filter(assigneeItem => // Renamed to avoid conflict with state
      assigneeItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assigneeItem.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assignees, searchTerm]);

  if (!currentUser && isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser && !isLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground">Please log in to manage assignees.</p>
         <Button onClick={() => window.location.href = '/'} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }
  
  if (currentUser && isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-primary">Manage Assignees</h1>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!currentUser?.id}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Assignee
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search assignees by name or designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      {filteredAssignees.length > 0 ? (
        <div className="border rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignees.map(assigneeItem => ( // Renamed to avoid conflict
                <TableRow key={assigneeItem.id}>
                  <TableCell className="font-medium">{assigneeItem.name}</TableCell>
                  <TableCell>{assigneeItem.designation || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Assignee Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/assignees/${assigneeItem.id}`} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingAssignee(assigneeItem)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeletingAssignee(assigneeItem)} className="cursor-pointer text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No assignees found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      )}

      {currentUser?.id && (
        <CreateAssigneeDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onAssigneeCreated={handleAssigneeCreated}
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
