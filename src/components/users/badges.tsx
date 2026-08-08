import type { UserRole } from "@/lib/api/users";

export const ROLE_BADGE: Record<UserRole, { label: string; classes: string }> = {
  super_admin: { label: "Super Admin", classes: "bg-brand-800 text-white" },
  administrator: { label: "Administrator", classes: "bg-brand-100 text-brand-700" },
  pharmacist: { label: "Pharmacist", classes: "bg-sky-100 text-sky-700" },
  store_manager: { label: "Store Manager", classes: "bg-amber-100 text-amber-700" },
  cashier: { label: "Cashier", classes: "bg-zinc-100 text-zinc-500" },
};

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "administrator", label: "Administrator" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "store_manager", label: "Store Manager" },
  { value: "cashier", label: "Cashier" },
];

export function StatusDot({
  status,
  online,
}: {
  status: "active" | "suspended";
  online: boolean;
}) {
  if (status === "suspended") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
        <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
        Suspended
      </span>
    );
  }
  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
      <span className="h-2 w-2 rounded-full bg-zinc-300" aria-hidden />
      Offline
    </span>
  );
}
