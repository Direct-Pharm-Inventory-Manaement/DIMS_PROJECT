"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  CircleCheck,
  CircleX,
  Clock,
  Info,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { TransfersTable, type TransfersFilters } from "@/components/transfers/transfers-table";
import {
  getTransfersFacets,
  getTransfersSummary,
  type TransferStatus,
  type TransfersSummary,
} from "@/lib/api/transfers";

const STATUS_LABELS: Record<TransferStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

function StatCard({
  icon: Icon,
  border,
  iconBg,
  label,
  value,
  footnote,
  footnoteClass,
}: {
  icon: LucideIcon;
  border: string;
  iconBg: string;
  label: string;
  value: number | null;
  footnote: string;
  footnoteClass: string;
}) {
  return (
    <article className={`flex flex-col gap-3 rounded-2xl border-l-4 bg-white p-5 shadow-sm ${border}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className="h-4 w-4 text-white" aria-hidden />
        </span>
      </div>
      {value === null ? (
        <div className="h-9 w-14 animate-pulse rounded bg-zinc-200/80" />
      ) : (
        <p className="text-3xl font-bold text-zinc-800">{value}</p>
      )}
      <p className={`text-xs font-semibold ${footnoteClass}`}>{footnote}</p>
    </article>
  );
}

export function TransfersPageClient() {
  const [refreshId, setRefreshId] = useState(0);
  const [summary, setSummary] = useState<TransfersSummary | null>(null);
  const [branches, setBranches] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [sourceBranch, setSourceBranch] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getTransfersSummary(controller.signal).then(setSummary).catch(() => {
      // Stat cards simply stay skeletal if this fails.
    });
    return () => controller.abort();
  }, [refreshId]);

  useEffect(() => {
    const controller = new AbortController();
    getTransfersFacets(controller.signal)
      .then((facets) => setBranches(facets.branches))
      .catch(() => {
        // Non-fatal: the branch dropdown simply stays empty.
      });
    return () => controller.abort();
  }, []);

  const filters: TransfersFilters = useMemo(
    () => ({
      status: (status as TransferStatus | null) ?? undefined,
      sourceBranch: sourceBranch ?? undefined,
      search: search.trim() || undefined,
      dateFrom: dateFrom || undefined,
    }),
    [status, sourceBranch, search, dateFrom],
  );

  function resetFilters() {
    setSearch("");
    setSourceBranch(null);
    setStatus(null);
    setDateFrom("");
  }

  const hasFilters = Boolean(search || sourceBranch || status || dateFrom);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-800">Transfer Requests</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Review, approve, and track stock transfers across branches.
          </p>
        </div>
        <Link
          href="/dashboard/transfers/new"
          className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create New Request
        </Link>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Clock}
          border="border-brand-500"
          iconBg="bg-brand-500"
          label="Pending Approval"
          value={summary?.pendingApproval ?? null}
          footnote={
            summary ? `${summary.newSinceYesterday} new since yesterday` : "…"
          }
          footnoteClass="text-brand-600"
        />
        <StatCard
          icon={CircleCheck}
          border="border-emerald-500"
          iconBg="bg-emerald-500"
          label="Approved"
          value={summary?.approved ?? null}
          footnote={summary ? `${summary.fulfillRatePct}% fulfil rate` : "…"}
          footnoteClass="text-emerald-600"
        />
        <StatCard
          icon={CircleX}
          border="border-red-500"
          iconBg="bg-red-500"
          label="Rejected"
          value={summary?.rejected ?? null}
          footnote="Review comments attached"
          footnoteClass="text-red-500"
        />
        <StatCard
          icon={Boxes}
          border="border-amber-400"
          iconBg="bg-amber-400"
          label="Completed"
          value={summary?.completedThisQuarter ?? null}
          footnote="Total this quarter"
          footnoteClass="text-zinc-500"
        />
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-brand-800">
          <SlidersHorizontal className="h-4.5 w-4.5 text-brand-500" aria-hidden />
          Filter Requests
        </h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[220px] flex-1">
            <label
              htmlFor="search-medicine"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400"
            >
              Search Medicine
            </label>
            <input
              id="search-medicine"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Paracetamol"
              className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
              Source Branch
            </p>
            <Dropdown
              label="All Branches"
              value={sourceBranch}
              options={branches}
              onChange={setSourceBranch}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">Status</p>
            <Dropdown
              label="Any Status"
              value={status ? STATUS_LABELS[status as TransferStatus] : null}
              options={Object.values(STATUS_LABELS)}
              onChange={(label) => {
                const entry = Object.entries(STATUS_LABELS).find(([, v]) => v === label);
                setStatus(entry ? entry[0] : null);
              }}
            />
          </div>
          <div>
            <label
              htmlFor="date-from"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400"
            >
              Date Range
            </label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-200"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset Filters
            </button>
          )}
        </div>
      </section>

      <TransfersTable
        filters={filters}
        refreshId={refreshId}
        onMutated={() => setRefreshId((id) => id + 1)}
      />

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Info className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-bold text-brand-800">Authorization Protocol</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Stock transfers exceeding 500 units or high-value items (Tier 1) require
              secondary authorization from the Logistics Manager. Ensure all waybills are
              signed digitally upon physical receipt.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-brand-800 p-6 shadow-sm">
          <Boxes className="absolute -bottom-4 -right-4 h-24 w-24 text-white/10" aria-hidden />
          <h3 className="text-base font-bold text-white">Need a Bulk Transfer?</h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-brand-100">
            Use our specialized tool for bulk branch balancing and seasonal stocking.
          </p>
          <Link
            href="/dashboard/transfers/new"
            className="mt-4 inline-block rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
          >
            Access Bulk Tool
          </Link>
        </div>
      </div>
    </div>
  );
}
