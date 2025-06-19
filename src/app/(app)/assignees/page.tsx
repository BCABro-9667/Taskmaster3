
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { User } from '@/types';
import { getAssignableUsers, deleteAssignableUser } from '@/lib/tasks';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users as UsersIcon, PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AssigneeCard } from '@/components/assignees/AssigneeCard';
import { CreateAssigneeDialog } from '@/components/assignees/CreateAssigneeDialog';

export default function AssigneesPage() {
  const [assignees, setAssignees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
  };

  const handleAssigneeDeleted = async (assigneeId: string) => {
    try {
      await deleteAssignableUser(assigneeId);
      setAssignees(prev => prev.filter(user => user.id !== assigneeId));
      toast({ title: 'Assignee Deleted', description: 'The assignee has been removed.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Assignee',
        description: (error as Error).message || 'Could not delete the assignee.',
      });
    }
  };

  const filteredAssignees = useMemo(() => {
    return assignees.filter(assignee =>
      assignee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          placeholder="Search assignees by name, email, or designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      {filteredAssignees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignees.map(assignee => (
            <AssigneeCard
              key={assignee.id}
              assignee={assignee}
              onAssigneeUpdated={handleAssigneeUpdated}
              onAssigneeDeleted={handleAssigneeDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p>No assignees found{searchTerm ? ' matching your search' : ''}.</p>
        </div>
      )}

      <CreateAssigneeDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onAssigneeCreated={handleAssigneeCreated}
      />
    </div>
  );
}
