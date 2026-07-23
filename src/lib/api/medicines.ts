import { apiRequest } from "./client";

export type MedicineStatus =
  | "in-stock"
  | "low-stock"
  | "critical-expiry"
  | "out-of-stock";

export interface Medicine {
  id: string;
  name: string;
  strength: string;
  form: string;
  packaging: string;
  category: string;
  batchNo: string;
  branch: string;
  quantity: number;
  unitPriceGhs: number;
  /** ISO datetime string. */
  expiryDate: string;
  status: MedicineStatus;
}

export interface ListMedicinesParams {
  status?: MedicineStatus;
  category?: string;
  branch?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListMedicinesResult {
  items: Medicine[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MedicinesFacets {
  categories: string[];
  branches: string[];
}

export interface MedicinesSummary {
  totalSkus: number;
  lowStockAlerts: number;
  stockOuts: number;
  stockOutBranches: number;
}

export function listMedicines(
  params: ListMedicinesParams,
  signal?: AbortSignal,
): Promise<ListMedicinesResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  return apiRequest<ListMedicinesResult>(`/medicines?${query}`, { signal });
}

export function getMedicinesFacets(signal?: AbortSignal): Promise<MedicinesFacets> {
  return apiRequest<MedicinesFacets>("/medicines/facets", { signal });
}

export function getMedicinesSummary(signal?: AbortSignal): Promise<MedicinesSummary> {
  return apiRequest<MedicinesSummary>("/medicines/summary", { signal });
}

export function deleteMedicine(id: string): Promise<void> {
  return apiRequest<void>(`/medicines/${id}`, { method: "DELETE" });
}
