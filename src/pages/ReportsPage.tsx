import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Calendar as CalendarIcon, Download, SlidersHorizontal } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { api } from '@/lib/api-client';
import type { TimeEntry, Project, Customer } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/data-table';
import { getTimeEntryColumns } from '@/components/columns';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCsv } from '@/lib/csv-export';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
const ReportsPage = () => {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [filters, setFilters] = useState({
    projectId: 'all',
    customerId: 'all',
    invoiceable: 'all',
    wbso: 'all',
  });
  const { data: projects, isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api('/api/projects'),
    enabled: isAuthenticated,
  });
  const { data: customers, isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => api('/api/customers'),
    enabled: isAuthenticated,
  });
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'));
    if (filters.projectId !== 'all') params.append('projectId', filters.projectId);
    if (filters.customerId !== 'all') params.append('customerId', filters.customerId);
    if (filters.invoiceable !== 'all') params.append('invoiceable', filters.invoiceable);
    if (filters.wbso !== 'all') params.append('wbso', filters.wbso);
    return params.toString();
  }, [dateRange, filters]);
  const { data: timeEntries, isLoading: loadingEntries } = useQuery<TimeEntry[]>({
    queryKey: ['time-entries', queryParams],
    queryFn: () => api(`/api/time-entries?${queryParams}`),
    enabled: isAuthenticated,
  });
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const handleExport = () => {
    if (!timeEntries || timeEntries.length === 0) {
      alert("No data to export.");
      return;
    }
    const projectMap = new Map(projects?.map(p => [p.id, p.name]));
    const customerMap = new Map(customers?.map(c => [c.id, c.name]));
    const dataToExport = timeEntries.map(entry => {
      const project = projects?.find(p => p.id === entry.projectId);
      return {
        Date: entry.date,
        Project: projectMap.get(entry.projectId) || 'N/A',
        Customer: project?.customerId ? customerMap.get(project.customerId) || 'N/A' : 'N/A',
        Duration_Minutes: entry.duration,
        Description: entry.description,
        Invoiceable: entry.invoiceable ? 'Yes' : 'No',
        WBSO: entry.wbso ? 'Yes' : 'No',
      };
    });
    exportToCsv(dataToExport, `chronoflow_report_${format(new Date(), 'yyyyMMdd')}.csv`);
  };
  const columns = useMemo(() => getTimeEntryColumns(projects || [], customers || []), [projects, customers]);
  const isLoading = loadingProjects || loadingCustomers;
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl lg:text-5xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-50">Reports</h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Filter, analyze, and export your time tracking data.
        </p>
      </header>
      <Card className="bg-white dark:bg-slate-900/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
            <SlidersHorizontal className="h-5 w-5" />
            Filter Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Select value={filters.projectId} onValueChange={(v) => handleFilterChange('projectId', v)}>
                <SelectTrigger><SelectValue placeholder="All Projects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.customerId} onValueChange={(v) => handleFilterChange('customerId', v)}>
                <SelectTrigger><SelectValue placeholder="All Customers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.invoiceable} onValueChange={(v) => handleFilterChange('invoiceable', v)}>
                <SelectTrigger><SelectValue placeholder="Invoiceable Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Invoiceable</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.wbso} onValueChange={(v) => handleFilterChange('wbso', v)}>
                <SelectTrigger><SelectValue placeholder="WBSO Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any WBSO</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
      <div>
        <div className="flex justify-end mb-4">
          <Button onClick={handleExport} disabled={!timeEntries || timeEntries.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>
        {loadingEntries ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <DataTable
            columns={columns}
            data={timeEntries || []}
            filterColumnId="description"
            filterPlaceholder="Filter by description..."
          />
        )}
      </div>
    </div>
  );
};
export default ReportsPage;