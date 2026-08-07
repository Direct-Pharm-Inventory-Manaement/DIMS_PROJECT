import { apiRequest } from "./client";

export type RiskTier = "critical" | "reorder-soon" | "stable";

export interface LowStockSummary {
  criticalLowStock: number;
  criticalAddedToday: number;
  reorderSoon: number;
  adequateStock: number;
  adequatePct: number;
  predictedStockOuts: number;
  totalMedicines: number;
}

export interface Prediction {
  id: string;
  name: string;
  strength: string;
  sku: string;
  category: string;
  branch: string;
  currentStock: number;
  avgDailyUsage: number;
  /** ISO date string, or null if there's no usage history to predict from. */
  depletionDate: string | null;
  daysUntilDepletion: number | null;
  riskTier: RiskTier;
}

export interface ListPredictionsParams {
  branch?: string;
  windowDays?: number;
  outOfStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListPredictionsResult {
  items: Prediction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BranchRisk {
  branch: string;
  atRiskPct: number;
  label: "Stable" | "Medium Risk" | "High Risk";
}

export interface RestockingRecommendation {
  medicineId: string;
  name: string;
  strength: string;
  targetStock: number;
  recommendedOrder: number;
  primarySupplier: string;
  estCostGhs: number;
}

export interface VelocityPoint {
  date: string;
  weekday: string;
  actual: number;
  predicted: number;
}

function toQuery(params: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    // Omit false/undefined/null/"" — a query string has no way to carry a
    // real `false`, since any present value coerces truthy server-side.
    // Absence IS false for every boolean flag this API uses.
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      query.set(key, String(value));
    }
  }
  return query.toString();
}

export function getLowStockSummary(
  params: { branch?: string; windowDays?: number },
  signal?: AbortSignal,
): Promise<LowStockSummary> {
  return apiRequest<LowStockSummary>(`/low-stock/summary?${toQuery(params)}`, { signal });
}

export function listPredictions(
  params: ListPredictionsParams,
  signal?: AbortSignal,
): Promise<ListPredictionsResult> {
  return apiRequest<ListPredictionsResult>(`/low-stock/predictions?${toQuery(params)}`, {
    signal,
  });
}

export function getBranchRisk(
  params: { windowDays?: number },
  signal?: AbortSignal,
): Promise<BranchRisk[]> {
  return apiRequest<BranchRisk[]>(`/low-stock/branch-risk?${toQuery(params)}`, { signal });
}

export function getRestockingRecommendations(
  params: { branch?: string; windowDays?: number },
  signal?: AbortSignal,
): Promise<RestockingRecommendation[]> {
  return apiRequest<RestockingRecommendation[]>(`/low-stock/restocking?${toQuery(params)}`, {
    signal,
  });
}

export function getConsumptionVelocity(
  params: { branch?: string; windowDays?: number },
  signal?: AbortSignal,
): Promise<VelocityPoint[]> {
  return apiRequest<VelocityPoint[]>(`/low-stock/velocity?${toQuery(params)}`, { signal });
}
