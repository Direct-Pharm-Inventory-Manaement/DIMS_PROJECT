"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  deleteMedicine,
  getMedicinesFacets,
  listMedicines,
  type ListMedicinesResult,
  type Medicine,
  type MedicineStatus,
} from "@/lib/api/medicines";
import { Dropdown } from "@/components/ui/dropdown";

const PAGE_SIZE = 5;
const EXPORT_PAGE_SIZE = 500;

type StatusFilter = "all" | MedicineStatus;

const FILTER_CHIPS: { value: StatusFilter; label: string; dot?: string }[] = [
  { value: "all", label: "All Items" },
  { value: "in-stock", label: "Available" },
  { value: "low-stock", label: "Low Stock", dot: "bg-amber-400" },
  { value: "critical-expiry", label: "Expiring Soon", dot: "bg-red-500" },
  { value: "out-of-stock", label: "Out of Stock" },
];

const STATUS_BADGE: Record<MedicineStatus, { label: string; classes: string }> = {
  "in-stock": { label: "In Stock", classes: "bg-emerald-100 text-emerald-700" },
  "low-stock": { label: "Low Stock", classes: "bg-amber-100 text-amber-700" },
  "critical-expiry": { label: "Critical Exp.", classes: "bg-red-100 text-red-600" },
  "out-of-stock": { label: "Out of Stock", classes: "bg-red-100 text-red-500" },
};

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function exportCsv(rows: Medicine[]) {
  const header = [
    "Medicine",
    "Category",
    "Batch No.",
    "Branch",
    "Quantity",
    "Unit Price (GHS)",
    "Expiry Date",
    "Status",
  ];
  const lines = rows.map((m) =>
    [
      `${m.name} ${m.strength}`.trim(),
      m.category,
      m.batchNo,
      m.branch,
      m.quantity,
      m.unitPriceGhs.toFixed(2),
      formatExpiry(m.expiryDate),
      STATUS_BADGE[m.status].label,
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "medicines-list.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }, (_, i) => (
        <tr key={i} className={i % 2 === 1 ? "bg-brand-50/40" : undefined}>
          {Array.from({ length: 9 }, (_, col) => (
            <td key={col} className={`py-4 pr-4 ${col === 0 ? "pl-4" : ""}`}>
              <div className="h-4 animate-pulse rounded bg-zinc-200/80" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function MedicinesTable({
  exportRequestId,
}: {
  /** Increment to trigger a CSV export of the currently filtered rows. */
  exportRequestId: number;
}) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [refreshId, setRefreshId] = useState(0);

  // Result and error are keyed by the query they answer; loading is derived
  // (current query differs from the answered one) instead of set in effects,
  // which the React Compiler forbids.
  const [answered, setAnswered] = useState<{
    key: string;
    data: ListMedicinesResult | null;
    error: string | null;
  } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filterParams = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      category: category ?? undefined,
      branch: branch ?? undefined,
    }),
    [status, category, branch],
  );
  const queryKey = JSON.stringify({ ...filterParams, page, refreshId });

  const isCurrent = answered?.key === queryKey;
  const result = isCurrent ? answered.data : null;
  const error = isCurrent ? answered.error : null;
  const loading = !isCurrent;

  useEffect(() => {
    const controller = new AbortController();
    getMedicinesFacets(controller.signal)
      .then((facets) => {
        setCategories(facets.categories);
        setBranches(facets.branches);
      })
      .catch(() => {
        // Non-fatal: dropdowns simply stay empty if facets fail.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    listMedicines(
      { ...filterParams, page, pageSize: PAGE_SIZE },
      controller.signal,
    )
      .then((data) => {
        setAnswered({ key: queryKey, data, error: null });
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAnswered({
          key: queryKey,
          data: null,
          error:
            err instanceof ApiError
              ? err.message
              : "Something went wrong loading medicines.",
        });
      });
    return () => controller.abort();
  }, [filterParams, page, refreshId, queryKey]);

  const lastExportHandled = useRef(0);
  useEffect(() => {
    if (exportRequestId <= lastExportHandled.current) return;
    lastExportHandled.current = exportRequestId;
    listMedicines({ ...filterParams, page: 1, pageSize: EXPORT_PAGE_SIZE })
      .then((data) => exportCsv(data.items))
      .catch(() => {
        // Export is best-effort; the table's own error banner covers API failure.
      });
  }, [exportRequestId, filterParams]);

  const applyFilter = useCallback((setter: () => void) => {
    setter();
    setPage(1);
  }, []);

  async function handleDelete(medicine: Medicine) {
    const confirmed = window.confirm(
      `Delete ${medicine.name} (${medicine.batchNo})? This cannot be undone.`,
    );
    if (!confirmed) return;
    setDeletingId(medicine.id);
    try {
      await deleteMedicine(medicine.id);
      setRefreshId((id) => id + 1);
    } catch (err) {
      setAnswered({
        key: queryKey,
        data: result,
        error:
          err instanceof ApiError ? err.message : "Failed to delete medicine.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = result?.items ?? [];

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              aria-pressed={status === chip.value}
              onClick={() => applyFilter(() => setStatus(chip.value))}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                status === chip.value
                  ? "bg-brand-700 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {chip.label}
              {chip.dot && (
                <span className={`h-2 w-2 rounded-full ${chip.dot}`} aria-hidden />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Dropdown
            label="All Categories"
            value={category}
            options={categories}
            onChange={(v) => applyFilter(() => setCategory(v))}
          />
          <Dropdown
            label="All Branches"
            value={branch}
            options={branches}
            onChange={(v) => applyFilter(() => setBranch(v))}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <span className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </span>
          <button
            type="button"
            onClick={() => setRefreshId((id) => id + 1)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Retry
          </button>
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-brand-50/60 text-xs font-bold uppercase tracking-wide text-brand-700">
              <th scope="col" className="rounded-l-lg py-3.5 pl-4 pr-4">Medicine</th>
              <th scope="col" className="py-3.5 pr-4">Category</th>
              <th scope="col" className="py-3.5 pr-4">Batch No.</th>
              <th scope="col" className="py-3.5 pr-4">Branch</th>
              <th scope="col" className="py-3.5 pr-4">Quantity</th>
              <th scope="col" className="py-3.5 pr-4">Unit Price</th>
              <th scope="col" className="py-3.5 pr-4">Expiry Date</th>
              <th scope="col" className="py-3.5 pr-4">Status</th>
              <th scope="col" className="rounded-r-lg py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : (
              rows.map((m, index) => (
                <tr
                  key={m.id}
                  className={index % 2 === 1 ? "bg-brand-50/40" : undefined}
                >
                  <td className="py-4 pl-4 pr-4">
                    <p className="font-bold text-zinc-800">
                      {`${m.name} ${m.strength}`.trim()}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {m.form} • {m.packaging}
                    </p>
                  </td>
                  <td className="py-4 pr-4 text-zinc-600">{m.category}</td>
                  <td className="py-4 pr-4 text-zinc-500">{m.batchNo}</td>
                  <td className="py-4 pr-4 text-zinc-600">{m.branch}</td>
                  <td
                    className={`py-4 pr-4 font-bold tabular-nums ${
                      m.quantity === 0
                        ? "text-red-600"
                        : m.status === "low-stock"
                          ? "text-amber-600"
                          : "text-zinc-800"
                    }`}
                  >
                    {m.quantity.toLocaleString()}
                  </td>
                  <td className="py-4 pr-4 tabular-nums text-zinc-600">
                    GH₵ {m.unitPriceGhs.toFixed(2)}
                  </td>
                  <td
                    className={`py-4 pr-4 ${
                      m.status === "critical-expiry"
                        ? "font-bold text-red-600"
                        : "text-zinc-600"
                    }`}
                  >
                    {formatExpiry(m.expiryDate)}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_BADGE[m.status].classes}`}
                    >
                      {STATUS_BADGE[m.status].label}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        href="/dashboard/medicines/manage"
                        aria-label={`Edit ${m.name}`}
                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Delete ${m.name}`}
                        disabled={deletingId === m.id}
                        onClick={() => handleDelete(m)}
                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed"
                      >
                        {deletingId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-zinc-400">
                  No medicines match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
        <p className="text-sm text-zinc-500">
          {loading
            ? "Loading…"
            : total === 0
              ? "Showing 0 entries"
              : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                  currentPage * PAGE_SIZE,
                  total,
                )} of ${total} entries`}
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
