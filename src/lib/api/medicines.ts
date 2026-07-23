import { apiRequest } from "./client";

export type MedicineStatus =
  | "in-stock"
  | "low-stock"
  | "critical-expiry"
  | "out-of-stock";

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  form: string;
  packaging: string;
  category: string;
  batchNo: string;
  branch: string;
  manufacturer: string;
  supplier: string;
  stockCategory: string;
  quantity: number;
  unitOfMeasurement: string;
  unitPriceGhs: number;
  sellingPriceGhs: number | null;
  storageLocation: string;
  lowStockThreshold: number;
  reorderLevel: number | null;
  /** ISO datetime string, or null. */
  manufacturingDate: string | null;
  internalNotes: string;
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
  lastBatchNo: string | null;
}

export interface MedicineInput {
  name: string;
  genericName?: string;
  strength?: string;
  form: string;
  packaging?: string;
  category: string;
  batchNo: string;
  branch: string;
  manufacturer?: string;
  supplier?: string;
  stockCategory?: string;
  quantity: number;
  unitOfMeasurement?: string;
  unitPriceGhs: number;
  sellingPriceGhs?: number | null;
  storageLocation?: string;
  lowStockThreshold?: number;
  reorderLevel?: number | null;
  manufacturingDate?: string | null;
  internalNotes?: string;
  expiryDate: string;
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

export function getMedicine(id: string, signal?: AbortSignal): Promise<Medicine> {
  return apiRequest<Medicine>(`/medicines/${id}`, { signal });
}

export function getMedicinesFacets(signal?: AbortSignal): Promise<MedicinesFacets> {
  return apiRequest<MedicinesFacets>("/medicines/facets", { signal });
}

export function getMedicinesSummary(signal?: AbortSignal): Promise<MedicinesSummary> {
  return apiRequest<MedicinesSummary>("/medicines/summary", { signal });
}

export function createMedicine(input: MedicineInput): Promise<Medicine> {
  return apiRequest<Medicine>("/medicines", { method: "POST", body: input });
}

export function updateMedicine(
  id: string,
  input: Partial<MedicineInput>,
): Promise<Medicine> {
  return apiRequest<Medicine>(`/medicines/${id}`, { method: "PATCH", body: input });
}

export function deleteMedicine(id: string): Promise<void> {
  return apiRequest<void>(`/medicines/${id}`, { method: "DELETE" });
}
