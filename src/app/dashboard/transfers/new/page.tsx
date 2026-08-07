import type { Metadata } from "next";
import { CreateTransferForm } from "@/components/transfers/create-transfer-form";

export const metadata: Metadata = {
  title: "Create Transfer Request — Direct Inventory Manager",
  description: "Request movement of medicines between branches to maintain optimal stock levels.",
};

export default function CreateTransferPage() {
  return <CreateTransferForm />;
}
