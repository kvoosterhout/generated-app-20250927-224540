import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api-client';
import type { Project, Customer, TimeEntry } from '@shared/types';
import { DataTable } from '@/components/data-table';
import { getProjectColumns } from '@/components/columns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
const projectSchema = z.object({
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  customerId: z.string().nullable(),
  budgetHours: z.string().transform(val => val === '' ? null : Number(val)).nullable(),
});
type ProjectFormData = z.infer<typeof projectSchema>;
const ProjectsPage = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", customerId: null, budgetHours: null },
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
  const { data: timeEntries, isLoading: isLoadingTimeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['time-entries'],
    queryFn: () => api('/api/time-entries'),
    enabled: isAuthenticated,
  });
  const mutation = useMutation({
    mutationFn: (projectData: { data: ProjectFormData, id?: string }) => {
      const { data, id } = projectData;
      const url = id ? `/api/projects/${id}` : '/api/projects';
      const method = id ? 'PUT' : 'POST';
      return api(url, { method, body: JSON.stringify({ ...data, budgetHours: data.budgetHours ? Number(data.budgetHours) : null }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(selectedProject ? "Project updated successfully!" : "Project created successfully!");
      setIsFormOpen(false);
      setSelectedProject(null);
      form.reset();
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Project deleted successfully!");
      setIsConfirmOpen(false);
      setSelectedProject(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });
  const handleAdd = () => {
    setSelectedProject(null);
    form.reset({ name: "", customerId: null, budgetHours: null });
    setIsFormOpen(true);
  };
  const handleEdit = React.useCallback((project: Project) => {
    setSelectedProject(project);
    form.reset({ name: project.name, customerId: project.customerId, budgetHours: project.budgetHours ? String(project.budgetHours) : null });
    setIsFormOpen(true);
  }, [form]);
  const handleDelete = React.useCallback((project: Project) => {
    setSelectedProject(project);
    setIsConfirmOpen(true);
  }, []);
  const onSubmit = (data: ProjectFormData) => {
    mutation.mutate({ data, id: selectedProject?.id });
  };
  const columns = React.useMemo(() => getProjectColumns(customers || [], timeEntries || [], handleEdit, handleDelete), [customers, timeEntries, handleEdit, handleDelete]);
  if (isLoadingProjects || isLoadingCustomers || isLoadingTimeEntries) {
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
          <h1 className="text-4xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-50">Projects</h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Organize your work into projects.</p>
        </div>
        <Button onClick={handleAdd} className="bg-blue-800 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 active:scale-95">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { form.reset(); setSelectedProject(null); } setIsFormOpen(isOpen); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
            <DialogDescription>
              {selectedProject ? 'Update the details for this project.' : 'Enter the details for the new project.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Website Redesign" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer (Optional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === 'null' ? null : value)} value={field.value ?? 'null'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">None</SelectItem>
                        {customers?.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budgetHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (hours)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 100" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending} className="bg-blue-800 hover:bg-blue-700 text-white">
                  {mutation.isPending ? 'Saving...' : 'Save Project'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <DataTable
        columns={columns}
        data={projects || []}
        filterColumnId="name"
        filterPlaceholder="Filter by project name..."
      />
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project "{selectedProject?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProject && deleteMutation.mutate(selectedProject.id)}
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
export default ProjectsPage;