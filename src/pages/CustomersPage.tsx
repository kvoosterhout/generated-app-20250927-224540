import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api-client';
import type { Customer } from '@shared/types';
import { DataTable } from '@/components/data-table';
import { getCustomerColumns } from '@/components/columns';
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
import { useAuth } from '@/hooks/useAuth';
const customerSchema = z.object({
  name: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
});
type CustomerFormData = z.infer<typeof customerSchema>;
const CustomersPage = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "" },
  });
  const { data: customers, isLoading, isError } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => api('/api/customers'),
    enabled: isAuthenticated,
  });
  const mutation = useMutation({
    mutationFn: (customerData: { data: CustomerFormData, id?: string }) => {
      const { data, id } = customerData;
      const url = id ? `/api/customers/${id}` : '/api/customers';
      const method = id ? 'PUT' : 'POST';
      return api(url, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(selectedCustomer ? "Customer updated successfully!" : "Customer created successfully!");
      setIsFormOpen(false);
      setSelectedCustomer(null);
      form.reset();
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success("Customer deleted successfully!");
      setIsConfirmOpen(false);
      setSelectedCustomer(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });
  const handleAdd = () => {
    setSelectedCustomer(null);
    form.reset({ name: "" });
    setIsFormOpen(true);
  };
  const handleEdit = React.useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    form.reset({ name: customer.name });
    setIsFormOpen(true);
  }, [form]);
  const handleDelete = React.useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsConfirmOpen(true);
  }, []);
  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate({ data, id: selectedCustomer?.id });
  };
  const columns = React.useMemo(() => getCustomerColumns(handleEdit, handleDelete), [handleEdit, handleDelete]);
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
  if (isError) {
    return <div className="text-red-500 p-4 bg-red-100 dark:bg-red-900/30 rounded-md">Failed to load customers. Please try again later.</div>;
  }
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-50">Customers</h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Manage your clients and contacts.</p>
        </div>
        <Button onClick={handleAdd} className="bg-blue-800 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 active:scale-95">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { form.reset(); setSelectedCustomer(null); } setIsFormOpen(isOpen); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription>
              {selectedCustomer ? 'Update the details for this customer.' : 'Enter the details for the new customer.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Cloudflare" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending} className="bg-blue-800 hover:bg-blue-700 text-white">
                  {mutation.isPending ? 'Saving...' : 'Save Customer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <DataTable
        columns={columns}
        data={customers || []}
        filterColumnId="name"
        filterPlaceholder="Filter by name..."
      />
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer "{selectedCustomer?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCustomer && deleteMutation.mutate(selectedCustomer.id)}
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
export default CustomersPage;