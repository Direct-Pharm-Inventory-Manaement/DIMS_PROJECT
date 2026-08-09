"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle2,
  Download,
  Package,
  XCircle,
} from "lucide-react";
import { getTransferReportSummary, listTransfers, type Transfer, type TransferReportSummary } from "@/lib/api/transfers";
import { logReport } from "@/lib/api/reports";
import { downloadCsv } from "@/lib/csv";
import { reportBranding, reportReference } from "@/lib/report-utils";
import { TabularReportDocument } from "@/components/reports/tabular-report-document";

const PAGE_SIZE = 10;

const RANGE_OPTIONS = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "All Time", days: null },
] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function dateFromDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const STATUS_STYLE: Record<Transfer["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-sky-100 text-sky-700",
  rejected: "bg-red-100 text-red-600",
  completed: "bg-emerald-100 text-emerald-700",
};

export function TransferHistoryReportPageClient() {
  const [generatedAt] = useState(() => new Date());
  const [rangeIndex, setRangeIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState<TransferReportSummary | null>(null);
  const [rows, setRows] = useState<Transfer[] | null>(null);
  const [total, setTotal] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const dateFrom = RANGE_OPTIONS[rangeIndex].days !== null ? dateFromDaysAgo(RANGE_OPTIONS[rangeIndex].days!) : undefined;

  useEffect(() => {
    const controller = new AbortController();
    getTransferReportSummary({ dateFrom }, controller.signal)
      .then(setSummary)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      });
    listTransfers({ dateFrom, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((res) => {
        setRows(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [dateFrom, page]);

  async function fetchAllFiltered(): Promise<Transfer[]> {
    const res = await listTransfers({ dateFrom, page: 1, pageSize: 500 });
    return res.items;
  }

  async function handleExportCsv() {
    setExportError(null);
    try {
      const all = await fetchAllFiltered();
      downloadCsv(
        "Transfer_History_Report.csv",
        ["Transfer ID", "Medicine", "Batch", "Source", "Destination", "Qty", "Status", "Requested By", "Approved By", "Date"],
        all.map((t) => [
          t.code,
          t.medicineName,
          t.batchNo,
          t.sourceBranch,
          t.destinationBranch,
          t.quantity,
          t.status,
          t.requestedBy.name,
          t.reviewedBy?.name ?? "—",
          formatDate(t.createdAt),
        ]),
      );
      logReport({ reportType: "transfer-history", format: "csv", fileName: "Transfer_History_Report.csv" }).catch(() => {});
    } catch {
      setExportError("Failed to export CSV. Please try again.");
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    setExportError(null);
    try {
      const all = await fetchAllFiltered();
      const reportSummary =
        summary ?? {
          totalTransfers: all.length,
          completed: all.filter((t) => t.status === "completed").length,
          rejected: all.filter((t) => t.status === "rejected").length,
          totalUnits: all.reduce((s, t) => s + t.quantity, 0),
        };
      const doc = (
        <TabularReportDocument
          title="Transfer History Report"
          description="Audit trail of inter-branch medicine stock transfers, including approvals and rejections."
          reference={reportReference("TRF", generatedAt)}
          generatedAt={generatedAt}
          branding={reportBranding()}
          statCards={[
            { label: "TOTAL TRANSFERS", value: String(reportSummary.totalTransfers), bg: "#eff6ff", color: "#1d4ed8" },
            { label: "COMPLETED", value: String(reportSummary.completed), bg: "#f0fdf4", color: "#15803d" },
            { label: "REJECTED", value: String(reportSummary.rejected), bg: "#fdf2f2", color: "#b91c1c" },
            { label: "TOTAL UNITS", value: reportSummary.totalUnits.toLocaleString(), bg: "#fdf6e8", color: "#92400e" },
          ]}
          columns={[
            { header: "TRANSFER ID", width: "12%" },
            { header: "MEDICINE / BATCH", width: "22%" },
            { header: "SOURCE → DEST.", width: "22%" },
            { header: "QTY", width: "8%" },
            { header: "STATUS", width: "12%" },
            { header: "REQ. / APPR. BY", width: "16%" },
            { header: "DATE", width: "8%" },
          ]}
          rows={all.map((t) => [
            t.code,
            `${t.medicineName} · ${t.batchNo}`,
            `${t.sourceBranch} → ${t.destinationBranch}`,
            String(t.quantity),
            t.status,
            `${t.requestedBy.name} / ${t.reviewedBy?.name ?? "—"}`,
            formatDate(t.createdAt),
          ])}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Transfer_History_Report.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      logReport({ reportType: "transfer-history", format: "pdf", fileName: "Transfer_History_Report.pdf" }).catch(() => {});
    } catch {
      setExportError("Failed to generate the PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-brand-700">Transfer History Report</p>
          <p className="mt-1 text-sm text-zinc-500">Review inter-branch medicine stock transfers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/reports"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            Back to Reports
          </Link>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden />
            {exportingPdf ? "Generating…" : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </button>
        </div>
      </header>

      {exportError && (
        <div role="alert" className="no-print flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {exportError}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ArrowLeftRight} iconTone="bg-sky-50 text-sky-600" label="Total Transfers" value={summary?.totalTransfers} />
        <StatCard icon={CheckCircle2} iconTone="bg-emerald-50 text-emerald-600" label="Completed" value={summary?.completed} />
        <StatCard icon={XCircle} iconTone="bg-red-50 text-red-600" label="Rejected" value={summary?.rejected} />
        <StatCard icon={Package} iconTone="bg-amber-50 text-amber-600" label="Total Units" value={summary?.totalUnits} />
      </div>

      <div className="print-sheet rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="no-print flex items-center justify-between border-b border-zinc-100 p-5">
          <p className="text-sm font-bold text-zinc-700">Recent Transfer Activity</p>
          <select
            value={rangeIndex}
            onChange={(e) => {
              setRangeIndex(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-600 focus:border-brand-500 focus:outline-none"
          >
            {RANGE_OPTIONS.map((opt, i) => (
              <option key={opt.label} value={i}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-bold uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3">Transfer</th>
                <th className="px-3 py-3">Medicine</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Destination</th>
                <th className="px-3 py-3 text-right">Qty</th>
                <th className="px-3 py-3">Requested By</th>
                <th className="px-3 py-3">Approved By</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows === null
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b border-zinc-50">
                      {Array.from({ length: 8 }, (_, j) => (
                        <td key={j} className="px-3 py-4">
                          <div className="h-4 animate-pulse rounded bg-zinc-200/80" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((t) => (
                    <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                      <td className="px-5 py-3.5 font-bold text-brand-700">{t.code}</td>
                      <td className="px-3 py-3.5">
                        <p className="font-semibold text-zinc-800">{t.medicineName}</p>
                        <p className="text-xs text-zinc-400">{t.batchNo}</p>
                      </td>
                      <td className="px-3 py-3.5 text-zinc-600">{t.sourceBranch}</td>
                      <td className="px-3 py-3.5 text-zinc-600">{t.destinationBranch}</td>
                      <td className="px-3 py-3.5 text-right text-zinc-700">{t.quantity.toLocaleString()}</td>
                      <td className="px-3 py-3.5 text-zinc-600">{t.requestedBy.name}</td>
                      <td className="px-3 py-3.5 text-zinc-600">{t.reviewedBy?.name ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[t.status]}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              {rows !== null && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-zinc-400">
                    No transfers in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="no-print flex items-center justify-between border-t border-zinc-100 px-5 py-3.5 text-sm text-zinc-500">
          <p>
            Showing {rows && rows.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}-{Math.min(page * PAGE_SIZE, total)} of{" "}
            {total.toLocaleString()} records
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="rounded-lg bg-brand-700 px-3 py-1.5 font-semibold text-white">{page}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconTone,
  label,
  value,
}: {
  icon: React.ElementType;
  iconTone: string;
  label: string;
  value: number | undefined;
}) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</p>
        {value === undefined ? (
          <div className="mt-1.5 h-8 w-16 animate-pulse rounded bg-zinc-200/80" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-zinc-800">{value.toLocaleString()}</p>
        )}
      </div>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
        <Icon className="h-5.5 w-5.5" aria-hidden />
      </span>
    </article>
  );
}
