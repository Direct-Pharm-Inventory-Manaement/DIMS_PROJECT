import type { ExpiryRiskRow, RiskTier } from "@/lib/api/expiry-risk";

/** Sub-threshold within "critical" where destruction (not resale) is the only option. */
const DESTROY_WITHIN_DAYS = 15;

export function daysUntil(iso: string, now = new Date()): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Deterministic, rule-based recommendation from tier + days-to-expiry — never
 * per-row flavor text, since nothing in the data justifies inventing variety.
 */
export function recommendedAction(row: ExpiryRiskRow): string {
  if (row.riskTier === "critical") {
    return daysUntil(row.expiryDate) <= DESTROY_WITHIN_DAYS
      ? "Destroy according to biohazard protocols."
      : "Immediate discount sale or return to vendor.";
  }
  if (row.riskTier === "warning") {
    return "Prioritize FEFO dispensing; consider inter-branch transfer to a higher-turnover location.";
  }
  return "Monitor monthly. Plan redistribution to high-volume branches if turnover remains low.";
}

export const TIER_LABEL: Record<RiskTier, string> = {
  critical: "Critical",
  warning: "Warning",
  advisory: "Advisory",
};

export function sortByUrgency(rows: ExpiryRiskRow[]): ExpiryRiskRow[] {
  return [...rows].sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
  );
}

export function reportReference(generatedAt: Date): string {
  const y = generatedAt.getFullYear();
  const m = String(generatedAt.getMonth() + 1).padStart(2, "0");
  const d = String(generatedAt.getDate()).padStart(2, "0");
  const hh = String(generatedAt.getHours()).padStart(2, "0");
  const mm = String(generatedAt.getMinutes()).padStart(2, "0");
  return `RPT-EXP-${y}${m}${d}-${hh}${mm}`;
}
