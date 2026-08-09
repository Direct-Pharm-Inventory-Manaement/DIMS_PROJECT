"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { AlertCircle, ArrowLeft, Download, FileSpreadsheet, Loader2, Printer } from "lucide-react";
import {
  getInventoryReportSummary,
  getMedicinesFacets,
  listMedicines,
  type InventoryReportSummary,
  type Medicine,
  type MedicinesFacets,
  type MedicineStatus,
} from "@/lib/api/medicines";
import { logReport } from "@/lib/api/reports";
import { downloadCsv } from "@/lib/csv";
import { reportBranding, reportReference } from "@/lib/report-utils";
import { TabularReportDocument } from "@/components/reports/tabular-report-document";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: MedicineStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "in-stock", label: "In Stock" },
  { value: "low-stock", label: "Low Stock" },
  { value: "critical-expiry", label: "Critical Expiry" },
  { value: "out-of-stock", label: "Out of Stock" },
];

interface Filters {
  search: string;
  branch: string;
  category: string;
  supplier: string;
  status: MedicineStatus | "";
}

const EMPTY_FILTERS: Filters = { search: "", branch: "", category: "", supplier: "", status: "" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const selectClass =
  "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

export function InventoryReportPageClient() {
  const [generatedAt] = useState(() => new Date());
  const [facets, setFacets] = useState<MedicinesFacets | null>(null);
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [summary, setSummary] = useState<InventoryReportSummary | null>(null);
  const [rows, setRows] = useState<Medicine[] | null>(null);
  const [total, setTotal] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getMedicinesFacets(controller.signal)
      .then(setFacets)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const filterParams = {
      search: appliedFilters.search || undefined,
      branch: appliedFilters.branch || undefined,
      category: appliedFilters.category || undefined,
      supplier: appliedFilters.supplier || undefined,
      status: appliedFilters.status || undefined,
    };
    getInventoryReportSummary(filterParams, controller.signal)
      .then(setSummary)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      });
    listMedicines({ ...filterParams, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((res) => {
        setRows(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [appliedFilters, page]);

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setPage(1);
  }

  async function fetchAllFiltered(): Promise<Medicine[]> {
    const filterParams = {
      search: appliedFilters.search || undefined,
      branch: appliedFilters.branch || undefined,
      category: appliedFilters.category || undefined,
      supplier: appliedFilters.supplier || undefined,
      status: appliedFilters.status || undefined,
    };
    const res = await listMedicines({ ...filterParams, page: 1, pageSize: 500 });
    return res.items;
  }

  async function handleExportCsv() {
    setExportError(null);
    try {
      const all = await fetchAllFiltered();
      downloadCsv(
        "Full_Inventory_Report.csv",
        ["Medicine", "Category", "Batch No.", "Branch", "Quantity", "Unit Price (GHS)", "Value (GHS)", "Expiry Date", "Status"],
        all.map((m) => [
          `${m.name} ${m.strength}`.trim(),
          m.category,
          m.batchNo,
          m.branch,
          m.quantity,
          m.unitPriceGhs.toFixed(2),
          (m.quantity * m.unitPriceGhs).toFixed(2),
          formatDate(m.expiryDate),
          m.status,
        ]),
      );
      logReport({ reportType: "full-inventory", format: "csv", fileName: "Full_Inventory_Report.csv" }).catch(() => {});
    } catch {
      setExportError("Failed to export CSV. Please try again.");
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    setExportError(null);
    try {
      const all = await fetchAllFiltered();
      const reportSummary = summary ?? {
        totalMedicines: all.length,
        totalUnits: all.reduce((s, m) => s + m.quantity, 0),
        inventoryValueGhs: all.reduce((s, m) => s + m.quantity * m.unitPriceGhs, 0),
        lowStockAlerts: all.filter((m) => m.status === "low-stock").length,
      };
      const doc = (
        <TabularReportDocument
          title="Full Inventory Report"
          description="A comprehensive list of all stock items, current levels, unit prices, and total valuation across the filtered branches."
          reference={reportReference("INV", generatedAt)}
          generatedAt={generatedAt}
          branding={reportBranding()}
          statCards={[
            { label: "TOTAL MEDICINES", value: reportSummary.totalMedicines.toLocaleString(), bg: "#eef2ff", color: "#3730a3" },
            { label: "TOTAL UNITS", value: reportSummary.totalUnits.toLocaleString(), bg: "#eff6ff", color: "#1d4ed8" },
            { label: "INVENTORY VALUE", value: `GHS ${reportSummary.inventoryValueGhs.toLocaleString()}`, bg: "#f0fdf4", color: "#15803d" },
            { label: "LOW STOCK ALERTS", value: String(reportSummary.lowStockAlerts), bg: "#fdf2f2", color: "#b91c1c" },
          ]}
          columns={[
            { header: "MEDICINE", width: "24%" },
            { header: "CATEGORY", width: "16%" },
            { header: "BATCH / BRANCH", width: "18%" },
            { header: "QTY", width: "8%" },
            { header: "VALUE (GHS)", width: "14%" },
            { header: "EXPIRY", width: "12%" },
            { header: "STATUS", width: "8%" },
          ]}
          rows={all.map((m) => [
            `${m.name} ${m.strength}`.trim(),
            m.category,
            `${m.batchNo} · ${m.branch}`,
            String(m.quantity),
            (m.quantity * m.unitPriceGhs).toLocaleString(undefined, { minimumFractionDigits: 2 }),
            formatDate(m.expiryDate),
            m.status,
          ])}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Full_Inventory_Report.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      logReport({ reportType: "full-inventory", format: "pdf", fileName: "Full_Inventory_Report.pdf" }).catch(() => {});
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
          <p className="text-lg font-bold text-brand-700">Full Inventory Report</p>
          <p className="mt-1 text-sm text-zinc-500">
            Generated as of {generatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Reports
          </Link>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print
          </button>
        </div>
      </header>

      {exportError && (
        <div role="alert" className="no-print flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {exportError}
        </div>
      )}

      <div className="no-print rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-zinc-700">Report Filters</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <label htmlFor="rf-search" className="block text-xs font-semibold text-zinc-500">
              Search Medicine
            </label>
            <input
              id="rf-search"
              value={draftFilters.search}
              onChange={(e) => setDraftFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Name or batch..."
              className={selectClass}
            />
          </div>
          <div>
            <label htmlFor="rf-branch" className="block text-xs font-semibold text-zinc-500">
              Branch
            </label>
            <select
              id="rf-branch"
              value={draftFilters.branch}
              onChange={(e) => setDraftFilters((f) => ({ ...f, branch: e.target.value }))}
              className={selectClass}
            >
              <option value="">All Branches</option>
              {facets?.branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rf-category" className="block text-xs font-semibold text-zinc-500">
              Category
            </label>
            <select
              id="rf-category"
              value={draftFilters.category}
              onChange={(e) => setDraftFilters((f) => ({ ...f, category: e.target.value }))}
              className={selectClass}
            >
              <option value="">All Categories</option>
              {facets?.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rf-supplier" className="block text-xs font-semibold text-zinc-500">
              Supplier
            </label>
            <select
              id="rf-supplier"
              value={draftFilters.supplier}
              onChange={(e) => setDraftFilters((f) => ({ ...f, supplier: e.target.value }))}
              className={selectClass}
            >
              <option value="">All Suppliers</option>
              {facets?.suppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rf-status" className="block text-xs font-semibold text-zinc-500">
              Status
            </label>
            <select
              id="rf-status"
              value={draftFilters.status}
              onChange={(e) => setDraftFilters((f) => ({ ...f, status: e.target.value as MedicineStatus | "" }))}
              className={selectClass}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Medicines" value={summary?.totalMedicines} tone="border-brand-600" hint="Matching filtered profiles" />
        <StatCard label="Total Units" value={summary?.totalUnits} tone="border-sky-500" hint="Combined physical count" />
        <StatCard
          label="Inventory Value"
          value={summary ? `GH₵${summary.inventoryValueGhs.toLocaleString()}` : undefined}
          tone="border-amber-500"
          hint="Current valuation at cost"
        />
        <StatCard label="Low Stock Alerts" value={summary?.lowStockAlerts} tone="border-red-500" hint="Requires attention" />
      </div>

      <div className="print-sheet rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 p-5">
          <p className="text-sm font-bold text-zinc-700">Detailed Inventory Ledger</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-bold uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3">Medicine Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Batch ID</th>
                <th className="px-3 py-3">Branch</th>
                <th className="px-3 py-3 text-right">Quantity</th>
                <th className="px-3 py-3 text-right">Unit Price</th>
                <th className="px-3 py-3 text-right">Value (GHC)</th>
                <th className="px-3 py-3">Expiry Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows === null
                ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className="border-b border-zinc-50">
                      {Array.from({ length: 9 }, (_, j) => (
                        <td key={j} className="px-3 py-4">
                          <div className="h-4 animate-pulse rounded bg-zinc-200/80" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((m) => (
                    <tr key={m.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                      <td className="px-5 py-3.5 font-semibold text-zinc-800">{`${m.name} ${m.strength}`.trim()}</td>
                      <td className="px-3 py-3.5 text-zinc-600">{m.category}</td>
                      <td className="px-3 py-3.5 text-zinc-600">{m.batchNo}</td>
                      <td className="px-3 py-3.5 text-zinc-600">{m.branch}</td>
                      <td className="px-3 py-3.5 text-right text-zinc-700">{m.quantity.toLocaleString()}</td>
                      <td className="px-3 py-3.5 text-right text-zinc-700">{m.unitPriceGhs.toFixed(2)}</td>
                      <td className="px-3 py-3.5 text-right font-semibold text-zinc-800">
                        {(m.quantity * m.unitPriceGhs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3.5 text-zinc-600">{formatDate(m.expiryDate)}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
              {rows !== null && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-zinc-400">
                    No medicines match these filters.
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
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string | number | undefined;
  tone: string;
  hint: string;
}) {
  return (
    <article className={`rounded-2xl border-l-4 bg-white p-5 shadow-sm ${tone}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</p>
      {value === undefined ? (
        <div className="mt-1.5 h-8 w-20 animate-pulse rounded bg-zinc-200/80" />
      ) : (
        <p className="mt-1 text-2xl font-bold text-zinc-800">{value}</p>
      )}
      <p className="mt-1.5 text-xs text-zinc-400">{hint}</p>
    </article>
  );
}

const STATUS_STYLE: Record<MedicineStatus, string> = {
  "in-stock": "bg-emerald-100 text-emerald-700",
  "low-stock": "bg-amber-100 text-amber-700",
  "critical-expiry": "bg-red-100 text-red-600",
  "out-of-stock": "bg-red-100 text-red-500",
};
const STATUS_LABEL: Record<MedicineStatus, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "critical-expiry": "Critical Exp.",
  "out-of-stock": "Out of Stock",
};

function StatusBadge({ status }: { status: MedicineStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
