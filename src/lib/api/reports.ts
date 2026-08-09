import { apiRequest } from "./client";

export type ReportType = "full-inventory" | "expiry" | "low-stock" | "transfer-history";
export type ReportFormat = "pdf" | "csv";

export interface ReportLogEntry {
  id: string;
  reportType: ReportType;
  format: ReportFormat;
  fileName: string;
  generatedBy: { id: string; name: string };
  createdAt: string;
}

export interface ListReportLogResult {
  items: ReportLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export function listReportLog(
  params: { page?: number; pageSize?: number },
  signal?: AbortSignal,
): Promise<ListReportLogResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  return apiRequest<ListReportLogResult>(`/reports/log?${query}`, { signal });
}

export function logReport(input: {
  reportType: ReportType;
  format: ReportFormat;
  fileName: string;
}): Promise<ReportLogEntry> {
  return apiRequest<ReportLogEntry>("/reports/log", { method: "POST", body: input });
}
