"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  listTransfers,
  type ListTransfersResult,
  type Transfer,
} from "@/lib/api/transfers";
import { RequesterAvatar } from "@/components/transfers/requester-avatar";
import { STATUS_BADGE } from "@/components/transfers/status-badge";
import { TransferDetailModal } from "@/components/transfers/transfer-detail-modal";

const PAGE_SIZE = 10;
const EXPORT_PAGE_SIZE = 500;

export interface TransfersFilters {
  status?: Transfer["status"];
  sourceBranch?: string;
  search?: string;
  dateFrom?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function exportCsv(rows: Transfer[]) {
  const header = [
    "Transfer ID",
    "Medicine",
    "Source",
    "Destination",
    "Quantity",
    "Requested By",
    "Date",
    "Status",
  ];
  const lines = rows.map((t) =>
    [
      t.code,
      t.medicineName,
      t.sourceBranch,
      t.destinationBranch,
      t.quantity,
      t.requestedBy.name,
      formatDate(t.createdAt),
      STATUS_BADGE[t.status].label,
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
  anchor.download = "transfer-requests.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function TransfersTable({
  filters,
  refreshId,
  onMutated,
}: {
  filters: TransfersFilters;
  refreshId: number;
  onMutated: () => void;
}) {
  const [page, setPage] = useState(1);
  const [exportRequestId, setExportRequestId] = useState(0);
  const [selected, setSelected] = useState<Transfer | null>(null);

  const [answered, setAnswered] = useState<{
    key: string;
    data: ListTransfersResult | null;
    error: string | null;
  } | null>(null);

  const queryKey = JSON.stringify({ ...filters, page, refreshId });
  const isCurrent = answered?.key === queryKey;
  const result = isCurrent ? answered.data : null;
  const error = isCurrent ? answered.error : null;
  const loading = !isCurrent;

  useEffect(() => {
    const controller = new AbortController();
    listTransfers({ ...filters, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((data) => setAnswered({ key: queryKey, data, error: null }))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAnswered({
          key: queryKey,
          data: null,
          error:
            err instanceof ApiError
              ? err.message
              : "Something went wrong loading transfer requests.",
        });
      });
    return () => controller.abort();
  }, [filters, page, refreshId, queryKey]);

  const lastExportHandled = useRef(0);
  useEffect(() => {
    if (exportRequestId <= lastExportHandled.current) return;
    lastExportHandled.current = exportRequestId;
    listTransfers({ ...filters, page: 1, pageSize: EXPORT_PAGE_SIZE })
      .then((data) => exportCsv(data.items))
      .catch(() => {
        // Export is best-effort; the table's own error banner covers API failure.
      });
  }, [exportRequestId, filters]);

  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = result?.items ?? [];

  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 pt-6">
        <h2 className="text-lg font-bold text-brand-800">Stock Transfer Requests</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Export as CSV"
            onClick={() => setExportRequestId((id) => id + 1)}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <Download className="h-4.5 w-4.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Print"
            onClick={() => window.print()}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <Printer className="h-4.5 w-4.5" aria-hidden />
          </button>
        </div>
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
            <tr className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              <th scope="col" className="py-3 pr-4">Transfer ID</th>
              <th scope="col" className="py-3 pr-4">Medicine</th>
              <th scope="col" className="py-3 pr-4">Source</th>
              <th scope="col" className="py-3 pr-4">Destination</th>
              <th scope="col" className="py-3 pr-4">Qty</th>
              <th scope="col" className="py-3 pr-4">Requested By</th>
              <th scope="col" className="py-3 pr-4">Date</th>
              <th scope="col" className="py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }, (_, col) => (
                    <td key={col} className="py-4 pr-4">
                      <div className="h-4 animate-pulse rounded bg-zinc-200/80" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              rows.map((t) => {
                const badge = STATUS_BADGE[t.status];
                return (
                  <tr key={t.id}>
                    <td className="py-4 pr-4">
                      <button
                        type="button"
                        onClick={() => setSelected(t)}
                        className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        {t.code}
                      </button>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-zinc-800">{t.medicineName}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">{t.packaging}</p>
                    </td>
                    <td className="py-4 pr-4 text-zinc-600">{t.sourceBranch}</td>
                    <td className="py-4 pr-4 text-zinc-600">{t.destinationBranch}</td>
                    <td className="py-4 pr-4 font-bold tabular-nums text-zinc-800">
                      {t.quantity.toLocaleString()}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <RequesterAvatar name={t.requestedBy.name} />
                        <span className="text-zinc-600">{t.requestedBy.name}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-zinc-500">{formatDate(t.createdAt)}</td>
                    <td className="py-4">
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-zinc-400">
                  No transfer requests match the selected filters.
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
              ? "Showing 0 of 0 requests"
              : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                  currentPage * PAGE_SIZE,
                  total,
                )} of ${total} requests`}
        </p>
        <nav className="flex items-center gap-1.5" aria-label="Pagination">
          <button
            type="button"
            disabled={currentPage === 1 || loading}
            onClick={() => setPage(currentPage - 1)}
            className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-zinc-400 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .slice(0, 3)
            .map((p) => (
              <button
                key={p}
                type="button"
                aria-current={p === currentPage ? "page" : undefined}
                disabled={loading}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${
                  p === currentPage ? "bg-brand-700 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {p}
              </button>
            ))}
          {pageCount > 3 && <span className="px-1 text-zinc-400">…</span>}
          <button
            type="button"
            disabled={currentPage === pageCount || loading}
            onClick={() => setPage(currentPage + 1)}
            className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-zinc-400 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      </div>

      {selected && (
        <TransferDetailModal
          transfer={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated);
            onMutated();
          }}
        />
      )}
    </section>
  );
}
