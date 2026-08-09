"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Pill,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { listExpiryRisk } from "@/lib/api/expiry-risk";
import { listMedicines } from "@/lib/api/medicines";
import { listTransfers, type Transfer } from "@/lib/api/transfers";
import { listReportLog, logReport, type ReportLogEntry, type ReportType } from "@/lib/api/reports";
import { downloadCsv } from "@/lib/csv";
import { useToast } from "@/components/ui/toast";

const PAGE_SIZE = 5;

interface ReportCard {
  reportType: ReportType;
  title: string;
  description: string;
  tag: string;
  tagTone: string;
  icon: React.ElementType;
  iconTone: string;
  viewHref: string;
}

const REPORTS: ReportCard[] = [
  {
    reportType: "full-inventory",
    title: "Full Inventory Report",
    description: "A comprehensive list of all stock items, current levels, unit prices, and total valuation across branches.",
    tag: "STOCK STANDARD",
    tagTone: "bg-zinc-100 text-zinc-500",
    icon: Pill,
    iconTone: "bg-sky-50 text-sky-600",
    viewHref: "/dashboard/reports/inventory",
  },
  {
    reportType: "expiry",
    title: "Expiry Report",
    description: "Identifies products nearing their expiration date to prevent stock loss and ensure safety compliance.",
    tag: "CRITICAL PRIORITY",
    tagTone: "bg-red-100 text-red-600",
    icon: CalendarClock,
    iconTone: "bg-red-50 text-red-600",
    viewHref: "/reports/expiry-risk",
  },
  {
    reportType: "low-stock",
    title: "Low Stock Report",
    description: "Medicines that have fallen below the minimum threshold. Essential for procurement planning.",
    tag: "RESTOCK ALERT",
    tagTone: "bg-amber-100 text-amber-700",
    icon: TrendingDown,
    iconTone: "bg-amber-50 text-amber-600",
    viewHref: "/dashboard/reports/low-stock",
  },
  {
    reportType: "transfer-history",
    title: "Transfer History Report",
    description: "Audit trail of inventory movements between branches, including approvals and rejections.",
    tag: "LOGISTICS",
    tagTone: "bg-sky-100 text-sky-700",
    icon: FileText,
    iconTone: "bg-brand-50 text-brand-600",
    viewHref: "/dashboard/reports/transfers",
  },
];

const REPORT_TYPE_ROUTE: Record<ReportType, string> = {
  "full-inventory": "/dashboard/reports/inventory",
  expiry: "/reports/expiry-risk",
  "low-stock": "/dashboard/reports/low-stock",
  "transfer-history": "/dashboard/reports/transfers",
};

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  "full-inventory": "Full Inventory Report",
  expiry: "Expiry Report",
  "low-stock": "Low Stock Report",
  "transfer-history": "Transfer History Report",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} • ${d.toLocaleTimeString(
    "en-GB",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

export function ReportsPageClient() {
  const { showToast } = useToast();
  const [log, setLog] = useState<{ items: ReportLogEntry[]; total: number } | null>(null);
  const [page, setPage] = useState(1);
  const [refreshId, setRefreshId] = useState(0);
  const [exporting, setExporting] = useState<ReportType | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listReportLog({ page, pageSize: PAGE_SIZE }, controller.signal)
      .then(setLog)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [page, refreshId]);

  async function quickExportCsv(reportType: ReportType) {
    setExporting(reportType);
    try {
      if (reportType === "full-inventory") {
        const res = await listMedicines({ page: 1, pageSize: 500 });
        downloadCsv(
          "Full_Inventory_Report.csv",
          ["Medicine", "Category", "Batch No.", "Branch", "Quantity", "Unit Price (GHS)", "Expiry Date", "Status"],
          res.items.map((m) => [
            `${m.name} ${m.strength}`.trim(),
            m.category,
            m.batchNo,
            m.branch,
            m.quantity,
            m.unitPriceGhs.toFixed(2),
            new Date(m.expiryDate).toLocaleDateString("en-GB"),
            m.status,
          ]),
        );
        await logReport({ reportType, format: "csv", fileName: "Full_Inventory_Report.csv" });
      } else if (reportType === "expiry") {
        const res = await listExpiryRisk({ page: 1, pageSize: 500 });
        downloadCsv(
          "Expiry_Report.csv",
          ["Medicine", "Batch No.", "Branch", "Quantity", "Expiry Date", "Risk Tier"],
          res.items.map((r) => [
            `${r.name} ${r.strength}`.trim(),
            r.batchNo,
            r.branch,
            r.quantity,
            new Date(r.expiryDate).toLocaleDateString("en-GB"),
            r.riskTier,
          ]),
        );
        await logReport({ reportType, format: "csv", fileName: "Expiry_Report.csv" });
      } else if (reportType === "low-stock") {
        const res = await listMedicines({ status: "low-stock", page: 1, pageSize: 500 });
        downloadCsv(
          "Low_Stock_Report.csv",
          ["Medicine", "Category", "Branch", "Current Stock", "Threshold"],
          res.items.map((m) => [`${m.name} ${m.strength}`.trim(), m.category, m.branch, m.quantity, m.lowStockThreshold]),
        );
        await logReport({ reportType, format: "csv", fileName: "Low_Stock_Report.csv" });
      } else {
        const res = await listTransfers({ page: 1, pageSize: 500 });
        downloadCsv(
          "Transfer_History_Report.csv",
          ["Transfer ID", "Medicine", "Source", "Destination", "Qty", "Status", "Date"],
          res.items.map((t: Transfer) => [
            t.code,
            t.medicineName,
            t.sourceBranch,
            t.destinationBranch,
            t.quantity,
            t.status,
            new Date(t.createdAt).toLocaleDateString("en-GB"),
          ]),
        );
        await logReport({ reportType, format: "csv", fileName: "Transfer_History_Report.csv" });
      }
      showToast("success", "Report exported.");
      setRefreshId((id) => id + 1);
      setPage(1);
    } catch {
      showToast("error", "Failed to export report.");
    } finally {
      setExporting(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil((log?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-800">Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">Generate, review, print, and export pharmacy inventory and transfer reports.</p>
        </div>
        <Link
          href="/dashboard/reports/inventory"
          className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          New Custom Report
        </Link>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {REPORTS.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.reportType} className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div>
                <div className="flex items-start justify-between">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconTone}`}>
                    <Icon className="h-5.5 w-5.5" aria-hidden />
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${card.tagTone}`}>
                    {card.tag}
                  </span>
                </div>
                <p className="mt-3 font-bold text-zinc-800">{card.title}</p>
                <p className="mt-1 text-sm text-zinc-500">{card.description}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Link
                  href={card.viewHref}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
                >
                  <Eye className="h-4 w-4" aria-hidden />
                  View Report
                </Link>
                <button
                  type="button"
                  onClick={() => quickExportCsv(card.reportType)}
                  disabled={exporting === card.reportType}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {exporting === card.reportType ? "Exporting…" : "Export"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <p className="font-bold text-zinc-800">Recent Reports</p>
          <button
            type="button"
            onClick={() => setRefreshId((id) => id + 1)}
            aria-label="Refresh"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-bold uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3">Report Name</th>
                <th className="px-3 py-3">Generated By</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Format</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {log === null
                ? Array.from({ length: 4 }, (_, i) => (
                    <tr key={i} className="border-b border-zinc-50">
                      {Array.from({ length: 5 }, (_, j) => (
                        <td key={j} className="px-3 py-4">
                          <div className="h-4 animate-pulse rounded bg-zinc-200/80" />
                        </td>
                      ))}
                    </tr>
                  ))
                : log.items.map((entry) => (
                    <tr key={entry.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {entry.format === "pdf" ? (
                            <FileText className="h-4 w-4 text-red-500" aria-hidden />
                          ) : (
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden />
                          )}
                          <div>
                            <p className="font-semibold text-zinc-800">{entry.fileName}</p>
                            <p className="text-xs text-zinc-400">{REPORT_TYPE_LABEL[entry.reportType]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-zinc-600">{entry.generatedBy.name}</td>
                      <td className="px-3 py-3.5 text-zinc-500">{formatDateTime(entry.createdAt)}</td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold uppercase text-zinc-500">
                          {entry.format}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={REPORT_TYPE_ROUTE[entry.reportType]}
                          aria-label={`View ${REPORT_TYPE_LABEL[entry.reportType]}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
                        >
                          <Eye className="h-4 w-4" aria-hidden />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
              {log !== null && log.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-zinc-400">
                    No reports generated yet. Export one above to see it here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3.5 text-sm text-zinc-500">
          <p>
            Showing {log && log.items.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}-
            {log ? Math.min(page * PAGE_SIZE, log.total) : 0} of {log?.total ?? 0} reports
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="rounded-lg border border-zinc-300 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <span className="rounded-lg bg-brand-700 px-3 py-1.5 font-semibold text-white">{page}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
              className="rounded-lg border border-zinc-300 p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-800">
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Need a custom report? Use <span className="font-semibold">&quot;New Custom Report&quot;</span> to filter inventory by
          branch, category, supplier, or status on the Full Inventory Report page.
        </p>
      </div>
    </div>
  );
}
