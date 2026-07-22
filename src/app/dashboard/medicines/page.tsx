import type { Metadata } from "next";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Medicines List — Direct Inventory Manager",
};

export default function Page() {
  return <ComingSoon title="Medicines List" />;
}
