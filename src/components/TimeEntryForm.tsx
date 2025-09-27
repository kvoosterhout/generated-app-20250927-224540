import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import type { TimeEntry, Project } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from './ui/skeleton';
const timeEntryFormSchema = z.object({
  projectId: z.string().min(1, "Please select a project."),
  date: z.date(),
  duration: z.coerce.number({invalid_type_error: "Duration must be a number."}).int().positive("Duration must be a positive number."),
  description: z.string().min(2, "Description must be at least 2 characters."),
  invoiceable: z.boolean().default(false),
  wbso: z.boolean().default(false),
});
type TimeEntryFormData = z.infer<typeof timeEntryFormSchema>;
interface TimeEntryFormProps {
  entry?: TimeEntry | null;
  onSuccess: () => void;
}
export function TimeEntryForm({ entry, onSuccess }: TimeEntryFormProps) {
  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      projectId: entry?.projectId || '',
      date: entry ? parse(entry.date, 'yyyy-MM-dd', new Date()) : new Date(),
      duration: entry?.duration ?? undefined,
      description: entry?.description || '',
      invoiceable: entry?.invoiceable || false,
      wbso: entry?.wbso || false,
    },
  });
  React.useEffect(() => {
    form.reset({
      projectId: entry?.projectId || '',
      date: entry ? parse(entry.date, 'yyyy-MM-dd', new Date()) : new Date(),
      duration: entry?.duration ?? undefined,
      description: entry?.description || '',
      invoiceable: entry?.invoiceable || false,
      wbso: entry?.wbso || false,
    });
  }, [entry, form]);
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api('/api/projects'),
  });
  const mutation = useMutation({
    mutationFn: (data: Omit<TimeEntry, 'id' | 'createdAt' | 'userId'>) => {
      const url = entry ? `/api/time-entries/${entry.id}` : '/api/time-entries';
      const method = entry ? 'PUT' : 'POST';
      return api(url, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      form.reset({
        projectId: '',
        date: new Date(),
        duration: undefined,
        description: '',
        invoiceable: false,
        wbso: false,
      });
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
    },
  });
  function onSubmit(data: TimeEntryFormData) {
    const submissionData = {
      ...data,
      date: format(data.date, 'yyyy-MM-dd'),
    };
    mutation.mutate(submissionData);
  }
  if (isLoadingProjects) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 60" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="What did you work on?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center space-x-6">
            <FormField
              control={form.control}
              name="invoiceable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Invoiceable</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wbso"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>WBSO</FormLabel>
                  </div>
                </FormItem>
              )}
            />
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full bg-blue-800 hover:bg-blue-700 text-white">
          {mutation.isPending ? 'Saving...' : (entry ? 'Update Entry' : 'Save Entry')}
        </Button>
      </form>
    </Form>
  );
}