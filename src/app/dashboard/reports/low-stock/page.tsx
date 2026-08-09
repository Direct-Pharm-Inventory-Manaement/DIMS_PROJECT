import type { Metadata } from "next";
import { LowStockReportPageClient } from "@/components/reports/low-stock-report-page-client";

export const metadata: Metadata = {
  title: "Low Stock Report — Direct Inventory Manager",
  description: "Medicines that have fallen below their minimum stock threshold.",
};

export default function Page() {
  return <LowStockReportPageClient />;
}
