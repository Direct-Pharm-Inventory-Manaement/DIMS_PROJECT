import type { Metadata } from "next";
import { TransfersPageClient } from "@/components/transfers/transfers-page-client";

export const metadata: Metadata = {
  title: "Transfer Requests — Direct Inventory Manager",
  description: "Review, approve, and track stock transfers across branches.",
};

export default function TransfersPage() {
  return <TransfersPageClient />;
}
