export type ApiResponse<T = unknown> = { success: true; data: T } | { success: false; error: string }
export interface User {
  id: string;
  email: string;
  createdAt: string;
}
export interface Customer {
  id: string
  name: string
  userId: string
  createdAt: string
}
export interface Project {
  id: string
  name:string
  customerId: string | null
  userId: string
  createdAt: string
  budgetHours: number | null;
}
export interface TimeEntry {
  id: string
  projectId: string
  date: string // YYYY-MM-DD
  duration: number // in minutes
  description: string
  invoiceable: boolean
  wbso: boolean
  userId: string
  createdAt: string
}