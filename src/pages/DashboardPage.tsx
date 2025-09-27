import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Hourglass, FileClock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeEntryForm } from "@/components/TimeEntryForm";
import { WeeklyHoursChart } from "@/components/WeeklyHoursChart";
import { api } from "@/lib/api-client";
import type { TimeEntry } from "@shared/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
const DashboardPage = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const { data: timeEntries, isLoading } = useQuery<TimeEntry[]>({
    queryKey: ['time-entries'],
    queryFn: () => api('/api/time-entries'),
    enabled: isAuthenticated,
  });
  const handleSuccess = () => {
    toast.success("Time entry saved successfully!");
    queryClient.invalidateQueries({ queryKey: ['time-entries'] });
  };
  const totalMinutes = timeEntries?.reduce((sum, entry) => sum + entry.duration, 0) || 0;
  const totalHours = (totalMinutes / 60).toFixed(2);
  const invoiceableMinutes = timeEntries?.filter(e => e.invoiceable).reduce((sum, entry) => sum + entry.duration, 0) || 0;
  const invoiceableHours = (invoiceableMinutes / 60).toFixed(2);
  const wbsoMinutes = timeEntries?.filter(e => e.wbso).reduce((sum, entry) => sum + entry.duration, 0) || 0;
  const wbsoHours = (wbsoMinutes / 60).toFixed(2);
  return (
    <div className="space-y-8 md:py-12 animate-fade-in">
      <header>
        <h1 className="text-4xl lg:text-5xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Welcome back! Quickly log your time and see your weekly progress.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <Card className="bg-white dark:bg-slate-900/70 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Hours Logged</CardTitle>
                <Hourglass className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHours}h</div>
                <p className="text-xs text-muted-foreground">Across all projects</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900/70 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Invoiceable Hours</CardTitle>
                <FileClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoiceableHours}h</div>
                <p className="text-xs text-muted-foreground">Ready for billing</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900/70 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">WBSO Hours</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{wbsoHours}h</div>
                <p className="text-xs text-muted-foreground">Eligible for subsidies</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <div className="grid gap-8 md:grid-cols-5">
        <Card className="bg-white dark:bg-slate-900/70 shadow-sm hover:shadow-lg transition-shadow duration-300 md:col-span-3">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-400">Log Your Time</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeEntryForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900/70 shadow-sm hover:shadow-lg transition-shadow duration-300 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">This Week's Hours</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64" /> : <WeeklyHoursChart data={timeEntries || []} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default DashboardPage;