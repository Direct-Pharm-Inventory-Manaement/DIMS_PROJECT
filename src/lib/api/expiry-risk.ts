import { apiRequest } from "./client";

export type RiskTier = "critical" | "warning" | "advisory";
export type ExpiryActionType = "clearance" | "transfer" | "review";
export type StockCategory = "essential" | "cold-chain" | "restricted";

export interface ExpiryRiskSummary {
  critical: number;
  warning: number;
  advisory: number;
  reviewedBatches: number;
}

export interface ExpiryRiskRow {
  id: string;
  name: string;
  strength: string;
  form: string;
  batchNo: string;
  branch: string;
  manufacturer: string;
  stockCategory: string;
  quantity: number;
  packaging: string;
  expiryDate: string;
  riskTier: RiskTier;
  suggestedAction: ExpiryActionType;
  actioned: boolean;
}

export interface ListRiskParams {
  riskTier?: RiskTier;
  manufacturer?: string;
  stockCategory?: StockCategory;
  page?: number;
  pageSize?: number;
}

export interface ListRiskResult {
  items: ExpiryRiskRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TrendMonth {
  month: string;
  lossValueGhs: number;
  protectedValueGhs: number;
}

export interface RiskDistribution {
  criticalLossPct: number;
  underWatchPct: number;
  healthySupplyPct: number;
  safeStockPct: number;
}

export interface RecentAction {
  id: string;
  type: ExpiryActionType;
  title: string;
  note: string;
  createdAt: string;
}

export function getExpiryRiskSummary(signal?: AbortSignal): Promise<ExpiryRiskSummary> {
  return apiRequest<ExpiryRiskSummary>("/expiry-risk/summary", { signal });
}

export function listExpiryRisk(
  params: ListRiskParams,
  signal?: AbortSignal,
): Promise<ListRiskResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  return apiRequest<ListRiskResult>(`/expiry-risk/medicines?${query}`, { signal });
}

export function getExpiryTrend(signal?: AbortSignal): Promise<TrendMonth[]> {
  return apiRequest<TrendMonth[]>("/expiry-risk/trend", { signal });
}

export function getRiskDistribution(signal?: AbortSignal): Promise<RiskDistribution> {
  return apiRequest<RiskDistribution>("/expiry-risk/distribution", { signal });
}

export function getRecentActions(signal?: AbortSignal): Promise<RecentAction[]> {
  return apiRequest<RecentAction[]>("/expiry-risk/actions/recent", { signal });
}

export function getManufacturers(signal?: AbortSignal): Promise<{ manufacturers: string[] }> {
  return apiRequest<{ manufacturers: string[] }>("/expiry-risk/manufacturers", { signal });
}

export function recordExpiryAction(
  medicineId: string,
  type: ExpiryActionType,
): Promise<RecentAction> {
  return apiRequest<RecentAction>("/expiry-risk/actions", {
    method: "POST",
    body: { medicineId, type },
  });
}
