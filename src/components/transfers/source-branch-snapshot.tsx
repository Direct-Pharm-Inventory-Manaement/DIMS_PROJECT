"use client";

import { useEffect, useState } from "react";
import { Building2, PackageSearch } from "lucide-react";
import { getBranchRisk, type BranchRisk } from "@/lib/api/low-stock";
import { listMedicines } from "@/lib/api/medicines";

const LABEL_CLASS: Record<BranchRisk["label"], string> = {
  Stable: "bg-emerald-100 text-emerald-700",
  "Medium Risk": "bg-amber-100 text-amber-700",
  "High Risk": "bg-red-100 text-red-600",
};

interface SnapshotData {
  branch: string;
  risk: BranchRisk | null;
  medicineCount: number | null;
}

export function SourceBranchSnapshot({ branch }: { branch: string }) {
  // Keyed by branch so switching source branches doesn't require a
  // synchronous reset at the top of the effect — stale data from the
  // previous branch just doesn't match `branch` and renders as loading.
  const [data, setData] = useState<SnapshotData | null>(null);
  const current = data?.branch === branch ? data : null;
  const risk = current?.risk ?? null;
  const medicineCount = current?.medicineCount ?? null;

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getBranchRisk({ windowDays: 7 }, controller.signal)
        .then((rows) => rows.find((r) => r.branch === branch) ?? null)
        .catch(() => null),
      listMedicines({ branch, pageSize: 1 }, controller.signal)
        .then((res) => res.total)
        .catch(() => null),
    ]).then(([riskResult, medicineCountResult]) => {
      setData({ branch, risk: riskResult, medicineCount: medicineCountResult });
    });
    return () => controller.abort();
  }, [branch]);

  return (
    <div className="rounded-2xl border border-zinc-200 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-brand-800">
        <Building2 className="h-4 w-4 text-brand-500" aria-hidden />
        {branch} Snapshot
      </h3>
      <dl className="mt-4 flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-1.5 text-zinc-500">
            <PackageSearch className="h-3.5 w-3.5" aria-hidden />
            Stock on hand
          </dt>
          <dd className="font-bold text-zinc-800">
            {medicineCount === null ? "…" : `${medicineCount} SKUs`}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500">Supply risk</dt>
          {risk ? (
            <dd
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${LABEL_CLASS[risk.label]}`}
            >
              {risk.label}
            </dd>
          ) : (
            <dd className="text-zinc-400">…</dd>
          )}
        </div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-zinc-400">
        Live from this branch&apos;s current inventory — check before requesting
        high quantities of at-risk stock.
      </p>
    </div>
  );
}
