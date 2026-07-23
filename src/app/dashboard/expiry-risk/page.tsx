import type { Metadata } from "next";
import { ExpiryRiskPageClient } from "@/components/expiry-risk/expiry-risk-page-client";

export const metadata: Metadata = {
  title: "Expiry Risk Dashboard — Direct Inventory Manager",
  description:
    "Monitor medicines approaching expiration and manage inventory waste.",
};

export default function ExpiryRiskPage() {
  return <ExpiryRiskPageClient />;
}
