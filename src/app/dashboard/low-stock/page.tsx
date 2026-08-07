import type { Metadata } from "next";
import { LowStockPageClient } from "@/components/low-stock/low-stock-page-client";

export const metadata: Metadata = {
  title: "Low-Stock Predictions — Direct Inventory Manager",
  description: "Identify medicines likely to run out based on historical sales and lead times.",
};

export default function LowStockPage() {
  return <LowStockPageClient />;
}
