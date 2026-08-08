"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ShieldCheck, UserPlus, Users, type LucideIcon } from "lucide-react";
import { getTransfersFacets } from "@/lib/api/transfers";
import { getUsersSummary, type SystemUser, type UserRole, type UsersSummary } from "@/lib/api/users";
import { UsersTable } from "@/components/users/users-table";
import { UserFormModal } from "@/components/users/user-form-modal";

const TABS: { label: string; roles?: UserRole[] }[] = [
  { label: "All" },
  { label: "Administrators", roles: ["super_admin", "administrator"] },
  { label: "Pharmacists", roles: ["pharmacist"] },
  { label: "Store Managers", roles: ["store_manager"] },
];

function StatCard({
  icon: Icon,
  border,
  iconTone,
  label,
  value,
  footnote,
  footnoteTone,
}: {
  icon: LucideIcon;
  border: string;
  iconTone: string;
  label: string;
  value: number | null;
  footnote: string;
  footnoteTone: string;
}) {
  return (
    <article className={`flex items-center justify-between gap-4 rounded-2xl border-l-4 bg-white p-5 shadow-sm ${border}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</p>
        {value === null ? (
          <div className="mt-1.5 h-9 w-14 animate-pulse rounded bg-zinc-200/80" />
        ) : (
          <p className="mt-1 text-3xl font-bold text-zinc-800">{value}</p>
        )}
        <p className={`mt-1.5 text-xs font-semibold ${footnoteTone}`}>{footnote}</p>
      </div>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
        <Icon className="h-5.5 w-5.5" aria-hidden />
      </span>
    </article>
  );
}

export function UsersPageClient() {
  const [refreshId, setRefreshId] = useState(0);
  const [summary, setSummary] = useState<UsersSummary | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [modalUser, setModalUser] = useState<SystemUser | "new" | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getUsersSummary(controller.signal).then(setSummary).catch(() => {});
    return () => controller.abort();
  }, [refreshId]);

  useEffect(() => {
    const controller = new AbortController();
    getTransfersFacets(controller.signal)
      .then((facets) => setBranches(facets.branches))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const filters = useMemo(() => ({ role: TABS[activeTab].roles }), [activeTab]);

  function handleMutated() {
    setRefreshId((id) => id + 1);
  }

  const tabs = (
    <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
      {TABS.map((tab, i) => (
        <button
          key={tab.label}
          type="button"
          aria-pressed={activeTab === i}
          onClick={() => setActiveTab(i)}
          className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
            activeTab === i ? "bg-brand-800 text-white" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-800">System Users</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage system users, roles, and branch access across the network.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalUser("new")}
          className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          Add User
        </button>
      </header>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          icon={Users}
          border="border-brand-600"
          iconTone="bg-brand-50 text-brand-600"
          label="Total Users"
          value={summary?.totalUsers ?? null}
          footnote={summary ? `+${summary.newThisMonth} this month` : "…"}
          footnoteTone="text-emerald-600"
        />
        <StatCard
          icon={Activity}
          border="border-emerald-500"
          iconTone="bg-emerald-50 text-emerald-600"
          label="Active Now"
          value={summary?.activeNow ?? null}
          footnote="Global activity"
          footnoteTone="text-zinc-500"
        />
        <StatCard
          icon={ShieldCheck}
          border="border-amber-400"
          iconTone="bg-amber-50 text-amber-600"
          label="Admin Roles"
          value={summary?.adminRoles ?? null}
          footnote="Restricted access"
          footnoteTone="text-zinc-500"
        />
      </div>

      <UsersTable
        filters={filters}
        refreshId={refreshId}
        branches={branches}
        tabs={tabs}
        onEdit={(user) => setModalUser(user)}
        onMutated={handleMutated}
      />

      {modalUser && (
        <UserFormModal
          user={modalUser === "new" ? undefined : modalUser}
          onClose={() => setModalUser(null)}
          onSaved={handleMutated}
        />
      )}
    </div>
  );
}
