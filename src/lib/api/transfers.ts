import { apiRequest } from "./client";

export type TransferStatus = "pending" | "approved" | "rejected" | "completed";
export type TransferPriority = "standard" | "express" | "critical";

export interface Transfer {
  id: string;
  code: string;
  medicineId: string;
  medicineName: string;
  batchNo: string;
  packaging: string;
  sourceBranch: string;
  destinationBranch: string;
  quantity: number;
  status: TransferStatus;
  priority: TransferPriority;
  /** ISO date string, or null. */
  requestedDeliveryDate: string | null;
  notes: string;
  requestedBy: { id: string; name: string };
  reviewedBy: { id: string; name: string } | null;
  reviewNote: string;
  /** ISO datetime string. */
  createdAt: string;
  /** ISO datetime string, or null. */
  completedAt: string | null;
}

export interface CreateTransferInput {
  medicineId: string;
  destinationBranch: string;
  quantity: number;
  priority?: TransferPriority;
  /** yyyy-mm-dd */
  requestedDeliveryDate?: string;
  notes?: string;
}

export interface ListTransfersParams {
  status?: TransferStatus;
  sourceBranch?: string;
  search?: string;
  /** yyyy-mm-dd — requests created on or after this date. */
  dateFrom?: string;
  page?: number;
  pageSize?: number;
}

export interface ListTransfersResult {
  items: Transfer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TransfersSummary {
  pendingApproval: number;
  newSinceYesterday: number;
  approved: number;
  fulfillRatePct: number;
  rejected: number;
  completedThisQuarter: number;
}

export interface TransfersFacets {
  branches: string[];
}

export interface TransferReportSummary {
  totalTransfers: number;
  completed: number;
  rejected: number;
  totalUnits: number;
}

export function listTransfers(
  params: ListTransfersParams,
  signal?: AbortSignal,
): Promise<ListTransfersResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  return apiRequest<ListTransfersResult>(`/transfers?${query}`, { signal });
}

export function getTransfersSummary(signal?: AbortSignal): Promise<TransfersSummary> {
  return apiRequest<TransfersSummary>("/transfers/summary", { signal });
}

export function getTransfersFacets(signal?: AbortSignal): Promise<TransfersFacets> {
  return apiRequest<TransfersFacets>("/transfers/facets", { signal });
}

export function getTransferReportSummary(
  params: Omit<ListTransfersParams, "page" | "pageSize">,
  signal?: AbortSignal,
): Promise<TransferReportSummary> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  return apiRequest<TransferReportSummary>(`/transfers/report-summary?${query}`, { signal });
}

export function createTransfer(input: CreateTransferInput): Promise<Transfer> {
  return apiRequest<Transfer>("/transfers", { method: "POST", body: input });
}

export function approveTransfer(id: string): Promise<Transfer> {
  return apiRequest<Transfer>(`/transfers/${id}/approve`, { method: "POST" });
}

export function rejectTransfer(id: string, reviewNote: string): Promise<Transfer> {
  return apiRequest<Transfer>(`/transfers/${id}/reject`, {
    method: "POST",
    body: { reviewNote },
  });
}

export function completeTransfer(id: string): Promise<Transfer> {
  return apiRequest<Transfer>(`/transfers/${id}/complete`, { method: "POST" });
}
