
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { User } from '@/types';
import { getAssignableUsers, deleteAssignableUser } from '@/lib/tasks';
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

export default function AssigneesPage() {
  const [assignees, setAssignees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState<User | null>(null);
  const [deletingAssignee, setDeletingAssignee] = useState<User | null>(null);

  const { toast } = useToast();

  const fetchAssignees = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedAssignees = await getAssignableUsers();
      setAssignees(fetchedAssignees);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching assignees',
        description: 'Could not load assignees. Please try refreshing.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  const handleAssigneeCreated = (newUser: User) => {
    setAssignees(prev => [...prev, newUser].sort((a,b) => (a.name || '').localeCompare(b.name || '')));
    setIsCreateDialogOpen(false);
  };

  const handleAssigneeUpdated = (updatedUser: User) => {
    setAssignees(prev => prev.map(user => user.id === updatedUser.id ? updatedUser : user).sort((a,b) => (a.name || '').localeCompare(b.name || '')));
    setEditingAssignee(null);
  };

  const confirmDeleteAssignee = async () => {
    if (!deletingAssignee) return;
    try {
      await deleteAssignableUser(deletingAssignee.id);
      setAssignees(prev => prev.filter(user => user.id !== deletingAssignee.id));
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
    return assignees.filter(assignee =>
      assignee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignee.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assignees, searchTerm]);

  if (isLoading) {
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
        <Button onClick={() => setIsCreateDialogOpen(true)}>
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
              {filteredAssignees.map(assignee => (
                <TableRow key={assignee.id}>
                  <TableCell className="font-medium">{assignee.name}</TableCell>
                  <TableCell>{assignee.designation}</TableCell>
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
                          <Link href={`/assignees/${assignee.id}`} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingAssignee(assignee)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeletingAssignee(assignee)} className="cursor-pointer text-destructive focus:text-destructive">
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

      <CreateAssigneeDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onAssigneeCreated={handleAssigneeCreated}
      />

      {editingAssignee && (
        <EditAssigneeDialog
          isOpen={!!editingAssignee}
          onOpenChange={(isOpen) => !isOpen && setEditingAssignee(null)}
          assignee={editingAssignee}
          onAssigneeUpdated={handleAssigneeUpdated}
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
