"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CircleMinus,
  ClipboardCheck,
  Download,
  Plus,
  Printer,
  TrendingUp,
} from "lucide-react";
import { MedicinesTable } from "@/components/medicines/medicines-table";
import {
  getMedicinesSummary,
  type MedicinesSummary,
} from "@/lib/api/medicines";

function SummaryValue({
  value,
  className,
}: {
  value: number | null;
  className: string;
}) {
  if (value === null) {
    return <div className="h-9 w-16 animate-pulse rounded bg-zinc-200/80" />;
  }
  return <p className={className}>{value.toLocaleString()}</p>;
}

export function MedicinesPageClient() {
  const [exportRequestId, setExportRequestId] = useState(0);
  const [summary, setSummary] = useState<MedicinesSummary | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getMedicinesSummary(controller.signal)
      .then(setSummary)
      .catch(() => {
        // The table's error banner covers API failure; strips stay skeletal.
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-800">Medicines List</h1>
          <p className="mt-1 text-sm text-zinc-500">
            View, search, and manage all medicines across Direct Pharmacy
            branches.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/medicines/manage"
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Medicine
          </Link>
          <button
            type="button"
            onClick={() => setExportRequestId((id) => id + 1)}
            className="flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print
          </button>
        </div>
      </header>

      <MedicinesTable exportRequestId={exportRequestId} />

      <div className="grid gap-5 md:grid-cols-3">
        <article className="flex flex-col gap-2 rounded-2xl border-l-4 border-brand-500 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              Total SKUs
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <ClipboardCheck className="h-4.5 w-4.5" aria-hidden />
            </span>
          </div>
          <SummaryValue
            value={summary?.totalSkus ?? null}
            className="text-3xl font-bold text-brand-800"
          />
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            Updated live from inventory
          </p>
        </article>

        <article className="flex flex-col gap-2 rounded-2xl border-l-4 border-amber-400 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              Low Stock Alerts
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <BellRing className="h-4.5 w-4.5" aria-hidden />
            </span>
          </div>
          <SummaryValue
            value={summary?.lowStockAlerts ?? null}
            className="text-3xl font-bold text-amber-600"
          />
          <p className="text-xs italic text-zinc-500">
            Requires immediate reorder
          </p>
        </article>

        <article className="flex flex-col gap-2 rounded-2xl border-l-4 border-red-500 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              Stock Outs
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <CircleMinus className="h-4.5 w-4.5" aria-hidden />
            </span>
          </div>
          <SummaryValue
            value={summary?.stockOuts ?? null}
            className="text-3xl font-bold text-red-600"
          />
          <p className="text-xs text-zinc-500">
            {summary
              ? `Impacting ${summary.stockOutBranches} service ${
                  summary.stockOutBranches === 1 ? "branch" : "branches"
                }`
              : "…"}
          </p>
        </article>
      </div>
    </div>
  );
}
