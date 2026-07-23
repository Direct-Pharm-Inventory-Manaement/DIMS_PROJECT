import type { Metadata } from "next";
import { MedicineForm } from "@/components/medicines/medicine-form";

export const metadata: Metadata = {
  title: "Add/Edit Medicine — Direct Inventory Manager",
  description:
    "Register a new medicine or update an existing entry in the pharmacy inventory system.",
};

export default async function ManageMedicinePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <MedicineForm medicineId={id} />;
}
