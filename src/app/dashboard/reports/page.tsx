import type { Metadata } from "next";
import { ReportsPageClient } from "@/components/reports/reports-page-client";

export const metadata: Metadata = {
  title: "Reports — Direct Inventory Manager",
  description: "Every report the system can generate, in one place.",
};

export default function Page() {
  return <ReportsPageClient />;
}
