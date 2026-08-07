import Link from "next/link";
import type { BranchRisk } from "@/lib/api/low-stock";

const LABEL_CLASS: Record<BranchRisk["label"], string> = {
  Stable: "text-emerald-600",
  "Medium Risk": "text-amber-600",
  "High Risk": "text-red-600",
};

const BAR_CLASS: Record<BranchRisk["label"], string> = {
  Stable: "bg-emerald-500",
  "Medium Risk": "bg-amber-400",
  "High Risk": "bg-red-500",
};

export function BranchRiskPanel({ risks }: { risks: BranchRisk[] }) {
  return (
    <div className="flex flex-col gap-5">
      {risks.map((risk) => (
        <div key={risk.branch}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-zinc-800">{risk.branch}</span>
            <span className={`text-xs font-bold uppercase tracking-wide ${LABEL_CLASS[risk.label]}`}>
              {risk.label}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full ${BAR_CLASS[risk.label]}`}
              style={{ width: `${Math.max(risk.atRiskPct, 4)}%` }}
            />
          </div>
        </div>
      ))}
      <Link
        href="/dashboard/transfers"
        className="mt-1 flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
      >
        View Detail Logistics
      </Link>
    </div>
  );
}
