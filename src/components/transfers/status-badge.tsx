import type { TransferPriority, TransferStatus } from "@/lib/api/transfers";

export const STATUS_BADGE: Record<TransferStatus, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-brand-100 text-brand-700" },
  approved: { label: "Approved", classes: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", classes: "bg-red-100 text-red-600" },
  completed: { label: "Completed", classes: "bg-sky-100 text-sky-700" },
};

export const PRIORITY_BADGE: Record<TransferPriority, string> = {
  standard: "bg-zinc-100 text-zinc-600",
  express: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-600",
};
