import { apiRequest } from "./client";

export type BranchType = "primary" | "satellite";

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  address: string;
  phone: string;
  licenseNumber: string;
  medicineCount: number;
  staffCount: number;
}

export interface UpdateBranchInput {
  type?: BranchType;
  address?: string;
  phone?: string;
  licenseNumber?: string;
}

export function listBranches(signal?: AbortSignal): Promise<Branch[]> {
  return apiRequest<Branch[]>("/branches", { signal });
}

export function updateBranch(id: string, input: UpdateBranchInput): Promise<Branch> {
  return apiRequest<Branch>(`/branches/${id}`, { method: "PATCH", body: input });
}
