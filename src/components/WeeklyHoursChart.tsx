import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO } from 'date-fns';
import type { TimeEntry } from '@shared/types';
import { useTheme } from '@/hooks/use-theme';
interface WeeklyHoursChartProps {
  data: TimeEntry[];
}
export function WeeklyHoursChart({ data }: WeeklyHoursChartProps) {
  const { isDark } = useTheme();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const chartData = weekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const entriesForDay = data.filter(entry => entry.date === dayStr);
    const totalMinutes = entriesForDay.reduce((sum, entry) => sum + entry.duration, 0);
    return {
      name: format(day, 'EEE'),
      hours: parseFloat((totalMinutes / 60).toFixed(2)),
    };
  });
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        Log some time this week to see your chart.
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
          <XAxis dataKey="name" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
          <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} unit="h" />
          <Tooltip
            cursor={{ fill: isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(203, 213, 225, 0.5)' }}
            contentStyle={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Bar dataKey="hours" fill="rgb(30 64 175)" name="Hours Logged" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}