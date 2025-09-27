import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { TimeEntry, Project, Customer } from '@shared/types';
import { DataTable } from '@/components/data-table';
import { getTimeEntryColumns } from '@/components/columns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TimeEntryForm } from '@/components/TimeEntryForm';
import { useAuth } from '@/hooks/useAuth';
const TimeEntriesPage = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<TimeEntry | null>(null);
  const { data: timeEntries, isLoading: isLoadingEntries } = useQuery<TimeEntry[]>({
    queryKey: ['time-entries'],
    queryFn: () => api('/api/time-entries'),
    enabled: isAuthenticated,
  });
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api('/api/projects'),
    enabled: isAuthenticated,
  });
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => api('/api/customers'),
    enabled: isAuthenticated,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/time-entries/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success("Time entry deleted successfully!");
      setIsConfirmOpen(false);
      setSelectedEntry(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete entry: ${error.message}`);
    },
  });
  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    toast.success(selectedEntry ? "Time entry updated!" : "Time entry created!");
    setIsFormOpen(false);
    setSelectedEntry(null);
  };
  const handleAdd = () => {
    setSelectedEntry(null);
    setIsFormOpen(true);
  };
  const handleEdit = React.useCallback((entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsFormOpen(true);
  }, []);
  const handleDelete = React.useCallback((entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsConfirmOpen(true);
  }, []);
  const columns = React.useMemo(
    () => getTimeEntryColumns(projects || [], customers || [], handleEdit, handleDelete),
    [projects, customers, handleEdit, handleDelete]
  );
  const isLoading = isLoadingEntries || isLoadingProjects || isLoadingCustomers;
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-50">Time Entries</h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">View and manage all your time logs.</p>
        </div>
        <Button onClick={handleAdd} className="bg-blue-800 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 active:scale-95">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Entry
        </Button>
      </div>
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedEntry(null); setIsFormOpen(isOpen); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEntry ? 'Edit Time Entry' : 'Add New Time Entry'}</DialogTitle>
            <DialogDescription>
              {selectedEntry ? 'Update the details for this time log.' : 'Fill in the details for the new time log.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <TimeEntryForm onSuccess={handleSuccess} entry={selectedEntry} />
          </div>
        </DialogContent>
      </Dialog>
      <DataTable
        columns={columns}
        data={timeEntries || []}
        filterColumnId="description"
        filterPlaceholder="Filter by description..."
      />
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this time entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEntry && deleteMutation.mutate(selectedEntry.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default TimeEntriesPage;