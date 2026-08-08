import type { Metadata } from "next";
import { ExpiryRiskReportPageClient } from "@/components/expiry-risk/expiry-risk-report-page-client";

export const metadata: Metadata = {
  title: "Medicine Expiry Risk Report — Direct Inventory Manager",
  description: "Printable audit of stock approaching expiration with recommended mitigation actions.",
};

export default function ExpiryRiskReportPage() {
  return <ExpiryRiskReportPageClient />;
}
