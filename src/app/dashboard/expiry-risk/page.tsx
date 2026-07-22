import type { Metadata } from "next";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Expiry Risk Dashboard — Direct Inventory Manager",
};

export default function Page() {
  return <ComingSoon title="Expiry Risk Dashboard" />;
}
