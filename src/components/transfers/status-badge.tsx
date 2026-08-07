import type { TransferStatus } from "@/lib/api/transfers";

export const STATUS_BADGE: Record<TransferStatus, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-brand-100 text-brand-700" },
  approved: { label: "Approved", classes: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", classes: "bg-red-100 text-red-600" },
  completed: { label: "Completed", classes: "bg-sky-100 text-sky-700" },
};
