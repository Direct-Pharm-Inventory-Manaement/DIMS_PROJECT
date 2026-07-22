import type { Metadata } from "next";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Transfer Requests — Direct Inventory Manager",
};

export default function Page() {
  return <ComingSoon title="Transfer Requests" />;
}
