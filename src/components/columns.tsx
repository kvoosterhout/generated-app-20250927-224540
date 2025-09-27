"use client"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Customer, Project, TimeEntry } from "@shared/types"
import { format } from "date-fns"
import { Badge } from "./ui/badge"
import { BudgetProgress } from "./BudgetProgress"
// Generic Actions Cell
const createActionsCell = <TData extends { id: string }>(
    onEdit: (item: TData) => void,
    onDelete: (item: TData) => void
): ColumnDef<TData>['cell'] => ({ row }) => {
    const item = row.original;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(item)}>
                    Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => onDelete(item)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50"
                >
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
// Generic Header with Sorting
const createSortableHeader = (label: string): ColumnDef<any>['header'] => ({ column }) => {
    return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            {label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    )
}
// Customer Columns
export const getCustomerColumns = (
    onEdit: (customer: Customer) => void,
    onDelete: (customer: Customer) => void
): ColumnDef<Customer>[] => [
    {
        accessorKey: "name",
        header: createSortableHeader("Name"),
    },
    {
        accessorKey: "createdAt",
        header: createSortableHeader("Created At"),
        cell: ({ row }) => format(new Date(row.original.createdAt), "PPP"),
    },
    {
        id: "actions",
        cell: createActionsCell(onEdit, onDelete),
        enableHiding: false,
    },
]
// Project Columns
export const getProjectColumns = (
    customers: Customer[],
    timeEntries: TimeEntry[],
    onEdit: (project: Project) => void,
    onDelete: (project: Project) => void
): ColumnDef<Project>[] => {
    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    const loggedMinutesByProject = timeEntries.reduce((acc, entry) => {
        acc[entry.projectId] = (acc[entry.projectId] || 0) + entry.duration;
        return acc;
    }, {} as Record<string, number>);
    return [
        {
            accessorKey: "name",
            header: createSortableHeader("Name"),
        },
        {
            accessorKey: "customerId",
            header: createSortableHeader("Customer"),
            cell: ({ row }) => {
                const customerId = row.original.customerId;
                return customerId ? customerMap.get(customerId) || "Unknown" : <span className="text-slate-500">None</span>;
            },
        },
        {
            accessorKey: "budgetHours",
            header: "Budget",
            cell: ({ row }) => {
                const budget = row.original.budgetHours;
                return budget ? `${budget}h` : <span className="text-slate-500">N/A</span>;
            },
        },
        {
            id: "budgetProgress",
            header: "Budget Progress",
            cell: ({ row }) => {
                const project = row.original;
                const loggedMinutes = loggedMinutesByProject[project.id] || 0;
                return <BudgetProgress loggedMinutes={loggedMinutes} budgetHours={project.budgetHours} />;
            },
        },
        {
            accessorKey: "createdAt",
            header: createSortableHeader("Created At"),
            cell: ({ row }) => format(new Date(row.original.createdAt), "PPP"),
        },
        {
            id: "actions",
            cell: createActionsCell(onEdit, onDelete),
            enableHiding: false,
        },
    ];
};
// Time Entry Columns
export const getTimeEntryColumns = (
    projects: Project[],
    customers: Customer[],
    onEdit?: (timeEntry: TimeEntry) => void,
    onDelete?: (timeEntry: TimeEntry) => void
): ColumnDef<TimeEntry>[] => {
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    const columns: ColumnDef<TimeEntry>[] = [
        {
            accessorKey: "date",
            header: createSortableHeader("Date"),
            cell: ({ row }) => format(new Date(row.original.date), "PPP"),
        },
        {
            accessorKey: "projectId",
            header: createSortableHeader("Project"),
            cell: ({ row }) => {
                const project = projectMap.get(row.original.projectId);
                return project?.name || "Unknown Project";
            },
        },
        {
            id: "customer",
            header: "Customer",
            cell: ({ row }) => {
                const project = projectMap.get(row.original.projectId);
                if (!project || !project.customerId) return <span className="text-slate-500">None</span>;
                return customerMap.get(project.customerId) || "Unknown Customer";
            },
        },
        {
            accessorKey: "duration",
            header: createSortableHeader("Duration"),
            cell: ({ row }) => {
                const minutes = row.original.duration;
                const h = Math.floor(minutes / 60);
                const m = minutes % 60;
                return `${h}h ${m}m`;
            },
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate" title={row.original.description}>
                    {row.original.description}
                </div>
            )
        },
        {
            accessorKey: "invoiceable",
            header: "Invoiceable",
            cell: ({ row }) => row.original.invoiceable && <Badge variant="outline">Yes</Badge>,
        },
        {
            accessorKey: "wbso",
            header: "WBSO",
            cell: ({ row }) => row.original.wbso && <Badge variant="outline" className="border-green-600 text-green-600">Yes</Badge>,
        },
    ];
    if (onEdit && onDelete) {
        columns.push({
            id: "actions",
            cell: createActionsCell(onEdit, onDelete),
            enableHiding: false,
        });
    }
    return columns;
};