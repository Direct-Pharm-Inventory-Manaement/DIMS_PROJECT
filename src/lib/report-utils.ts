import { getAuth } from "@/lib/auth-storage";
import { ROLE_BADGE } from "@/components/users/badges";
import type { ReportBranding } from "@/components/expiry-risk/expiry-risk-report-document";

const APP_VERSION = "0.1.0";

export function reportBranding(): ReportBranding {
  const session = getAuth();
  const role = session?.user.role;
  return {
    logoUrl: `${window.location.origin}/logo-dark.png`,
    appVersion: APP_VERSION,
    generatedByName: session?.user.name ?? "System User",
    generatedByRole: role ? ROLE_BADGE[role].label : "Staff",
  };
}

export function reportReference(prefix: string, generatedAt: Date): string {
  const y = generatedAt.getFullYear();
  const m = String(generatedAt.getMonth() + 1).padStart(2, "0");
  const d = String(generatedAt.getDate()).padStart(2, "0");
  const hh = String(generatedAt.getHours()).padStart(2, "0");
  const mm = String(generatedAt.getMinutes()).padStart(2, "0");
  return `RPT-${prefix}-${y}${m}${d}-${hh}${mm}`;
}
