import type { Metadata } from "next";
import { TransferHistoryReportPageClient } from "@/components/reports/transfer-history-report-page-client";

export const metadata: Metadata = {
  title: "Transfer History Report — Direct Inventory Manager",
  description: "Audit trail of inter-branch medicine stock transfers.",
};

export default function Page() {
  return <TransferHistoryReportPageClient />;
}
