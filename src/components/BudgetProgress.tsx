import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
interface BudgetProgressProps {
  loggedMinutes: number;
  budgetHours: number | null;
}
export const BudgetProgress = ({ loggedMinutes, budgetHours }: BudgetProgressProps) => {
  if (budgetHours === null || budgetHours <= 0) {
    return <span className="text-slate-500">Not set</span>;
  }
  const budgetMinutes = budgetHours * 60;
  const progressPercentage = Math.min(100, (loggedMinutes / budgetMinutes) * 100);
  const loggedHours = (loggedMinutes / 60).toFixed(1);
  const progressColor =
    progressPercentage > 100
      ? "bg-red-600"
      : progressPercentage > 85
      ? "bg-yellow-500"
      : "bg-green-600";
  return (
    <div className="flex flex-col gap-1.5 w-40">
      <Progress value={progressPercentage} className="h-2 [&>*]:transition-all [&>*]:duration-500" indicatorClassName={progressColor} />
      <div className="text-xs text-slate-600 dark:text-slate-400">
        <span>{loggedHours}h / {budgetHours}h used</span>
        <span
          className={cn(
            "font-semibold float-right",
            progressPercentage > 100 ? "text-red-600" : "text-slate-800 dark:text-slate-200"
          )}
        >
          {Math.round(progressPercentage)}%
        </span>
      </div>
    </div>
  );
};