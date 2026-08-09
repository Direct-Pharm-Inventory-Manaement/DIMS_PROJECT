import type { Metadata } from "next";
import { InventoryReportPageClient } from "@/components/reports/inventory-report-page-client";

export const metadata: Metadata = {
  title: "Full Inventory Report — Direct Inventory Manager",
  description: "Comprehensive stock levels, valuation, and status across all branches.",
};

export default function Page() {
  return <InventoryReportPageClient />;
}
