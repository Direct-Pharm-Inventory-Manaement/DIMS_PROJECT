import type { Metadata } from "next";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Low-Stock Predictions — Direct Inventory Manager",
};

export default function Page() {
  return <ComingSoon title="Low-Stock Predictions" />;
}
