import { apiRequest } from "./client";

export type UserRole = "super_admin" | "administrator" | "pharmacist" | "store_manager" | "cashier";
export type UserAccountStatus = "active" | "suspended";

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  branch: string;
  status: UserAccountStatus;
  online: boolean;
  /** ISO datetime string, or null if never logged in. */
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ListUsersParams {
  search?: string;
  role?: UserRole[];
  branch?: string;
  page?: number;
  pageSize?: number;
}

export interface ListUsersResult {
  items: SystemUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UsersSummary {
  totalUsers: number;
  newThisMonth: number;
  activeNow: number;
  adminRoles: number;
}

export interface UserInput {
  name: string;
  email: string;
  username: string;
  role: UserRole;
  branch: string;
}

function toQuery(params: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    query.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return query.toString();
}

export function listUsers(params: ListUsersParams, signal?: AbortSignal): Promise<ListUsersResult> {
  return apiRequest<ListUsersResult>(`/users?${toQuery(params)}`, { signal });
}

export function getUsersSummary(signal?: AbortSignal): Promise<UsersSummary> {
  return apiRequest<UsersSummary>("/users/summary", { signal });
}

export function createUser(
  input: UserInput,
): Promise<{ user: SystemUser; temporaryPassword: string; emailSent: boolean }> {
  return apiRequest("/users", { method: "POST", body: input });
}

export function updateUser(id: string, input: Partial<UserInput>): Promise<SystemUser> {
  return apiRequest<SystemUser>(`/users/${id}`, { method: "PATCH", body: input });
}

export function setUserStatus(id: string, status: UserAccountStatus): Promise<SystemUser> {
  return apiRequest<SystemUser>(`/users/${id}/status`, { method: "POST", body: { status } });
}

export function resetUserPassword(id: string): Promise<{ temporaryPassword: string; emailSent: boolean }> {
  return apiRequest(`/users/${id}/reset-password`, { method: "POST" });
}
