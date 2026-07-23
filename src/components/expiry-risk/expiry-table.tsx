"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Droplet,
  FlaskConical,
  Loader2,
  Package,
  Pill,
  RefreshCw,
  SquareArrowOutUpRight,
  Syringe,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  listExpiryRisk,
  recordExpiryAction,
  type ExpiryRiskRow,
  type ListRiskParams,
  type ListRiskResult,
  type RiskTier,
} from "@/lib/api/expiry-risk";

const PAGE_SIZE = 5;

const TIER_BADGE: Record<RiskTier, { label: string; classes: string }> = {
  critical: { label: "Critical", classes: "bg-red-100 text-red-600" },
  warning: { label: "Warning", classes: "bg-amber-100 text-amber-700" },
  advisory: { label: "Advisory", classes: "bg-brand-100 text-brand-700" },
};

const TIER_DATE_CLASS: Record<RiskTier, string> = {
  critical: "font-bold text-red-600",
  warning: "font-bold text-amber-600",
  advisory: "text-zinc-600",
};

const TIER_ICON_TILE: Record<RiskTier, string> = {
  critical: "bg-red-50 text-red-600",
  warning: "bg-amber-50 text-amber-600",
  advisory: "bg-brand-50 text-brand-600",
};

const ACTION_LABEL: Record<ExpiryRiskRow["suggestedAction"], string> = {
  clearance: "Mark Clearance",
  transfer: "Transfer Stock",
  review: "View Report",
};

const FORM_ICON: Record<string, LucideIcon> = {
  Injectable: Syringe,
  Liquid: FlaskConical,
  Inhaler: Wind,
  Powder: Package,
  Topical: Droplet,
};

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function unitsLabel(row: ExpiryRiskRow): string {
  const qty = row.quantity.toLocaleString();
  if (row.form === "Liquid") return `${qty} Bottles`;
  if (row.form === "Tablet") return `${qty} Tabs`;
  return `${qty} Units`;
}

export function ExpiryTable({
  filters,
  onMutated,
}: {
  filters: Omit<ListRiskParams, "page" | "pageSize">;
  /** Called after an action is recorded so sibling panels can refresh. */
  onMutated: () => void;
}) {
  const [page, setPage] = useState(1);
  const [refreshId, setRefreshId] = useState(0);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [answered, setAnswered] = useState<{
    key: string;
    data: ListRiskResult | null;
    error: string | null;
  } | null>(null);

  const queryKey = JSON.stringify({ ...filters, page, refreshId });
  const isCurrent = answered?.key === queryKey;
  const result = isCurrent ? answered.data : null;
  const error = isCurrent ? answered.error : null;
  const loading = !isCurrent;

  useEffect(() => {
    const controller = new AbortController();
    listExpiryRisk({ ...filters, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((data) => setAnswered({ key: queryKey, data, error: null }))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAnswered({
          key: queryKey,
          data: null,
          error:
            err instanceof ApiError
              ? err.message
              : "Something went wrong loading at-risk medicines.",
        });
      });
    return () => controller.abort();
  }, [filters, page, refreshId, queryKey]);

  async function handleAction(row: ExpiryRiskRow) {
    setActioningId(row.id);
    try {
      await recordExpiryAction(row.id, row.suggestedAction);
      setRefreshId((id) => id + 1);
      onMutated();
    } catch (err) {
      setAnswered({
        key: queryKey,
        data: result,
        error:
          err instanceof ApiError ? err.message : "Failed to record the action.",
      });
    } finally {
      setActioningId(null);
    }
  }

  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = result?.items ?? [];

  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 pt-6">
        <h2 className="text-lg font-bold text-brand-800">
          Medicines Approaching Expiry
        </h2>
        <button
          type="button"
          aria-label="Refresh list"
          onClick={() => setRefreshId((id) => id + 1)}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="mt-4 overflow-x-auto px-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
              <th scope="col" className="rounded-l-lg py-3.5 pl-4 pr-4">Medicine Name</th>
              <th scope="col" className="py-3.5 pr-4">Batch No.</th>
              <th scope="col" className="py-3.5 pr-4">Quantity</th>
              <th scope="col" className="py-3.5 pr-4">Expiry Date</th>
              <th scope="col" className="py-3.5 pr-4">Status</th>
              <th scope="col" className="rounded-r-lg py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: PAGE_SIZE }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }, (_, col) => (
                    <td key={col} className={`py-4 pr-4 ${col === 0 ? "pl-4" : ""}`}>
                      <div className="h-4 animate-pulse rounded bg-zinc-200/80" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              rows.map((row) => {
                const FormIcon = FORM_ICON[row.form] ?? Pill;
                const badge = TIER_BADGE[row.riskTier];
                return (
                  <tr key={row.id}>
                    <td className="py-4 pl-4 pr-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TIER_ICON_TILE[row.riskTier]}`}
                        >
                          <FormIcon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="font-bold text-brand-600">
                          {`${row.name} ${row.strength}`.trim()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-mono text-xs text-zinc-500">
                      {row.batchNo}
                    </td>
                    <td className="py-4 pr-4 tabular-nums text-zinc-600">
                      {unitsLabel(row)}
                    </td>
                    <td className={`py-4 pr-4 ${TIER_DATE_CLASS[row.riskTier]}`}>
                      {formatExpiry(row.expiryDate)}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {row.actioned ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                          <CircleCheck className="h-4 w-4" aria-hidden />
                          Actioned
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={actioningId === row.id}
                          onClick={() => handleAction(row)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actioningId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <>
                              {ACTION_LABEL[row.suggestedAction]}
                              <SquareArrowOutUpRight className="h-3.5 w-3.5" aria-hidden />
                            </>
                          )}
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
        <p className="text-sm text-zinc-500">
          {loading
            ? "Loading…"
            : total === 0
              ? "Showing 0 medicines"
              : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                  currentPage * PAGE_SIZE,
                  total,
                )} of ${total} medicines`}
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
                p === currentPage
                  ? "bg-brand-700 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
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
