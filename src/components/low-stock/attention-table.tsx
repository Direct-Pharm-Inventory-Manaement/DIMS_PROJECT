"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownAZ,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplet,
  HeartPulse,
  Pill,
  Sparkles,
  SquareArrowOutUpRight,
  Syringe,
  TrendingUp,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  listPredictions,
  type ListPredictionsParams,
  type ListPredictionsResult,
  type Prediction,
  type RiskTier,
} from "@/lib/api/low-stock";

const PAGE_SIZE = 4;

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Antibiotics: Pill,
  Analgesics: Pill,
  Antidiabetics: Droplet,
  Antihypertensives: HeartPulse,
  Antihistamines: Wind,
  Vaccines: Syringe,
  "Vitamins & Supplements": Sparkles,
  Respiratory: Wind,
};

const TIER_TILE: Record<RiskTier, string> = {
  critical: "bg-red-50 text-red-600",
  "reorder-soon": "bg-amber-50 text-amber-600",
  stable: "bg-brand-50 text-brand-600",
};

const TIER_BADGE: Record<RiskTier, { label: string; classes: string }> = {
  critical: { label: "Critical Risk", classes: "bg-red-100 text-red-600" },
  "reorder-soon": { label: "Reorder Soon", classes: "bg-amber-100 text-amber-700" },
  stable: { label: "Stable", classes: "bg-brand-100 text-brand-700" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatDaysAway(days: number): string {
  if (days < 1) return "Today";
  const rounded = Math.round(days * 10) / 10;
  return `In ${rounded} ${rounded === 1 ? "day" : "days"}`;
}

export function AttentionTable({
  filters,
  onOrder,
  orderedIds,
}: {
  filters: Omit<ListPredictionsParams, "page" | "pageSize" | "outOfStockOnly">;
  onOrder: (prediction: Prediction) => void;
  orderedIds: Set<string>;
}) {
  const [page, setPage] = useState(1);
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [alphabetical, setAlphabetical] = useState(false);

  const [answered, setAnswered] = useState<{
    key: string;
    data: ListPredictionsResult | null;
    error: string | null;
  } | null>(null);

  const queryKey = JSON.stringify({ ...filters, outOfStockOnly, page });
  const isCurrent = answered?.key === queryKey;
  const result = isCurrent ? answered.data : null;
  const error = isCurrent ? answered.error : null;
  const loading = !isCurrent;

  useEffect(() => {
    const controller = new AbortController();
    listPredictions(
      { ...filters, outOfStockOnly, page, pageSize: PAGE_SIZE },
      controller.signal,
    )
      .then((data) => setAnswered({ key: queryKey, data, error: null }))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAnswered({
          key: queryKey,
          data: null,
          error:
            err instanceof ApiError
              ? err.message
              : "Something went wrong loading predictions.",
        });
      });
    return () => controller.abort();
  }, [filters, outOfStockOnly, page, queryKey]);

  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = result ? [...result.items] : [];
  if (alphabetical) rows.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <h2 className="text-lg font-bold text-brand-800">Medicines Requiring Attention</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={alphabetical}
            onClick={() => setAlphabetical((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              alphabetical ? "bg-brand-700 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {alphabetical ? <ArrowDownAZ className="h-4 w-4" aria-hidden /> : <TrendingUp className="h-4 w-4" aria-hidden />}
            {alphabetical ? "Sorted A–Z" : "Sort by Confidence"}
          </button>
          <button
            type="button"
            aria-pressed={outOfStockOnly}
            onClick={() => {
              setOutOfStockOnly((v) => !v);
              setPage(1);
            }}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              outOfStockOnly ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Filter Out of Stock
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 overflow-x-auto px-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              <th scope="col" className="py-3 pr-4">Medicine Name</th>
              <th scope="col" className="py-3 pr-4">Current Stock</th>
              <th scope="col" className="py-3 pr-4">Avg. Daily Usage</th>
              <th scope="col" className="py-3 pr-4">Depletion Date</th>
              <th scope="col" className="py-3 pr-4">Risk Level</th>
              <th scope="col" className="py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: PAGE_SIZE }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }, (_, col) => (
                    <td key={col} className="py-4 pr-4">
                      <div className="h-4 animate-pulse rounded bg-zinc-200/80" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              rows.map((p) => {
                const Icon = CATEGORY_ICON[p.category] ?? Pill;
                const badge = TIER_BADGE[p.riskTier];
                const isOrdered = orderedIds.has(p.id);
                return (
                  <tr key={p.id}>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TIER_TILE[p.riskTier]}`}>
                          <Icon className="h-4.5 w-4.5" aria-hidden />
                        </span>
                        <div>
                          <p className="font-bold text-zinc-800">{`${p.name} ${p.strength}`.trim()}</p>
                          <p className="mt-0.5 text-xs uppercase tracking-wide text-zinc-400">
                            {p.category} • {p.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-bold tabular-nums text-zinc-800">
                      {p.currentStock.toLocaleString()} Units
                    </td>
                    <td className="py-4 pr-4 tabular-nums text-zinc-600">
                      {p.avgDailyUsage > 0 ? `${p.avgDailyUsage} / day` : "—"}
                    </td>
                    <td className="py-4 pr-4">
                      {p.depletionDate ? (
                        <>
                          <p
                            className={`font-semibold ${
                              p.riskTier === "critical" ? "text-red-600" : "text-zinc-700"
                            }`}
                          >
                            {formatDate(p.depletionDate)}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {formatDaysAway(p.daysUntilDepletion!)}
                          </p>
                        </>
                      ) : (
                        <span className="text-zinc-400">No usage data</span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {p.riskTier === "stable" ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400">
                          <Ban className="h-3.5 w-3.5" aria-hidden />
                          Monitor
                        </span>
                      ) : isOrdered ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                          <Check className="h-4 w-4" aria-hidden />
                          Added
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOrder(p)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                            p.riskTier === "critical"
                              ? "bg-brand-700 text-white hover:bg-brand-800"
                              : "border border-brand-300 text-brand-700 hover:bg-brand-50"
                          }`}
                        >
                          {p.riskTier === "critical" ? "Order Now" : "Quick Add"}
                          <SquareArrowOutUpRight className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-zinc-400">
                  No medicines match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {loading
            ? "Loading…"
            : total === 0
              ? "Showing 0 of 0 predicted stock-outs"
              : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(
                  currentPage * PAGE_SIZE,
                  total,
                )} of ${total} predicted stock-outs`}
        </p>
        <nav className="flex items-center gap-1.5" aria-label="Pagination">
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage === 1 || loading}
            onClick={() => setPage(currentPage - 1)}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              aria-current={p === currentPage ? "page" : undefined}
              disabled={loading}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                p === currentPage ? "bg-brand-700 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage === pageCount || loading}
            onClick={() => setPage(currentPage + 1)}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      </div>
    </section>
  );
}
