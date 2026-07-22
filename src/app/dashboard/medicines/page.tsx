import type { Metadata } from "next";
import { MedicinesPageClient } from "@/components/medicines/medicines-page-client";

export const metadata: Metadata = {
  title: "Medicines List — Direct Inventory Manager",
  description:
    "View, search, and manage all medicines across Direct Pharmacy branches.",
};

export default function MedicinesPage() {
  return <MedicinesPageClient />;
}
