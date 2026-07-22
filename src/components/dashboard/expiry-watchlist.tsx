import Link from "next/link";
import type { RiskLevel, WatchlistRow } from "@/lib/mock/dashboard-data";

const RISK_BADGE: Record<RiskLevel, { label: string; classes: string }> = {
  critical: { label: "Critical", classes: "bg-red-100 text-red-700" },
  high: { label: "High", classes: "bg-amber-100 text-amber-800" },
  moderate: { label: "Moderate", classes: "bg-brand-100 text-brand-700" },
};

export function ExpiryWatchlist({ rows }: { rows: WatchlistRow[] }) {
  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 pt-6">
        <h2 className="text-lg font-bold text-brand-800">
          Critical Expiry Watchlist
        </h2>
        <Link
          href="/dashboard/expiry-risk"
          className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          View All Risks
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto px-6 pb-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              <th scope="col" className="py-3 pr-4">Medicine Name</th>
              <th scope="col" className="py-3 pr-4">Batch ID</th>
              <th scope="col" className="py-3 pr-4">Remaining Stock</th>
              <th scope="col" className="py-3 pr-4">Expiry Date</th>
              <th scope="col" className="py-3">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => {
              const badge = RISK_BADGE[row.risk];
              return (
                <tr key={row.batchId}>
                  <td className="py-4 pr-4 font-semibold text-brand-600">
                    {row.medicine}
                  </td>
                  <td className="py-4 pr-4 text-zinc-500">{row.batchId}</td>
                  <td className="py-4 pr-4 tabular-nums text-zinc-600">
                    {row.remainingStock.toLocaleString()} Units
                  </td>
                  <td
                    className={`py-4 pr-4 ${
                      row.risk === "critical"
                        ? "font-bold text-red-600"
                        : "text-zinc-600"
                    }`}
                  >
                    {row.expiryDate}
                  </td>
                  <td className="py-4">
                    <span
                      className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
