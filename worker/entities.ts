import { IndexedEntity } from "./core-utils";
import type { Customer, Project, TimeEntry, User } from "@shared/types";
// USER ENTITY
export interface UserState extends User {
    hashedPassword: string;
}
export class UserEntity extends IndexedEntity<UserState> {
    static readonly entityName = "user";
    static readonly indexName = "users";
    static readonly initialState: UserState = { id: "", email: "", hashedPassword: "", createdAt: "" };
    static override keyOf(state: any): string {
        return state.email;
    }
}
// CUSTOMER ENTITY
export class CustomerEntity extends IndexedEntity<Customer> {
  static readonly entityName = "customer";
  static readonly indexName = "customers";
  static readonly initialState: Customer = { id: "", name: "", userId: "", createdAt: "" };
}
// PROJECT ENTITY
export class ProjectEntity extends IndexedEntity<Project> {
  static readonly entityName = "project";
  static readonly indexName = "projects";
  static readonly initialState: Project = { id: "", name: "", customerId: null, userId: "", createdAt: "", budgetHours: null };
}
// TIME ENTRY ENTITY
export class TimeEntryEntity extends IndexedEntity<TimeEntry> {
    static readonly entityName = "timeEntry";
    static readonly indexName = "timeEntries";
    static readonly initialState: TimeEntry = {
        id: "",
        projectId: "",
        date: "",
        duration: 0,
        description: "",
        invoiceable: false,
        wbso: false,
        userId: "",
        createdAt: "",
    };
}