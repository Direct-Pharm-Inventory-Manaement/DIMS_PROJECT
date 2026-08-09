"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { AlertCircle, Boxes, Download, MapPinned, TrendingDown } from "lucide-react";
import { getMedicinesFacets, listMedicines, type Medicine, type MedicinesFacets } from "@/lib/api/medicines";
import { logReport } from "@/lib/api/reports";
import { downloadCsv } from "@/lib/csv";
import { reportBranding, reportReference } from "@/lib/report-utils";
import { TabularReportDocument } from "@/components/reports/tabular-report-document";

const FETCH_SIZE = 500;
const PAGE_SIZE = 10;

const selectClass =
  "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

function reorderQty(m: Medicine): number {
  const target = m.reorderLevel ?? m.lowStockThreshold * 2;
  return Math.max(0, target - m.quantity);
}

export function LowStockReportPageClient() {
  const [generatedAt] = useState(() => new Date());
  const [facets, setFacets] = useState<MedicinesFacets | null>(null);
  const [branch, setBranch] = useState("");
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState<Medicine[] | null>(null);
  const [page, setPage] = useState(1);
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
    listMedicines(
      { status: "low-stock", branch: branch || undefined, category: category || undefined, page: 1, pageSize: FETCH_SIZE },
      controller.signal,
    )
      .then((res) => setRows(res.items))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [branch, category]);

  const stats = useMemo(() => {
    if (!rows) return null;
    return {
      count: rows.length,
      branches: new Set(rows.map((r) => r.branch)).size,
      unitsShort: rows.reduce((s, r) => s + reorderQty(r), 0),
      estCostGhs: rows.reduce((s, r) => s + reorderQty(r) * r.unitPriceGhs, 0),
    };
  }, [rows]);

  const paged = useMemo(() => {
    if (!rows) return [];
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);
  const totalPages = Math.max(1, Math.ceil((rows?.length ?? 0) / PAGE_SIZE));

  function handleExportCsv() {
    if (!rows) return;
    downloadCsv(
      "Low_Stock_Report.csv",
      ["Medicine", "Category", "Branch", "Current Stock", "Threshold", "Reorder Qty", "Est. Cost (GHS)"],
      rows.map((m) => [
        `${m.name} ${m.strength}`.trim(),
        m.category,
        m.branch,
        m.quantity,
        m.lowStockThreshold,
        reorderQty(m),
        (reorderQty(m) * m.unitPriceGhs).toFixed(2),
      ]),
    );
    logReport({ reportType: "low-stock", format: "csv", fileName: "Low_Stock_Report.csv" }).catch(() => {});
  }

  async function handleExportPdf() {
    if (!rows) return;
    setExportingPdf(true);
    setExportError(null);
    try {
      const doc = (
        <TabularReportDocument
          title="Low Stock Report"
          description="Medicines that have fallen below their minimum stock threshold — essential for procurement planning and purchase orders."
          reference={reportReference("LOW", generatedAt)}
          generatedAt={generatedAt}
          branding={reportBranding()}
          statCards={[
            { label: "LOW STOCK ITEMS", value: String(stats?.count ?? 0), bg: "#fdf6e8", color: "#92400e" },
            { label: "BRANCHES AFFECTED", value: String(stats?.branches ?? 0), bg: "#eff6ff", color: "#1d4ed8" },
            { label: "UNITS SHORT", value: (stats?.unitsShort ?? 0).toLocaleString(), bg: "#fdf2f2", color: "#b91c1c" },
            { label: "EST. REORDER COST", value: `GHS ${(stats?.estCostGhs ?? 0).toLocaleString()}`, bg: "#f0fdf4", color: "#15803d" },
          ]}
          columns={[
            { header: "MEDICINE", width: "26%" },
            { header: "CATEGORY", width: "18%" },
            { header: "BRANCH", width: "16%" },
            { header: "STOCK / THRESHOLD", width: "18%" },
            { header: "REORDER QTY", width: "12%" },
            { header: "EST. COST (GHS)", width: "10%" },
          ]}
          rows={rows.map((m) => [
            `${m.name} ${m.strength}`.trim(),
            m.category,
            m.branch,
            `${m.quantity} / ${m.lowStockThreshold}`,
            String(reorderQty(m)),
            (reorderQty(m) * m.unitPriceGhs).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          ])}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Low_Stock_Report.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      logReport({ reportType: "low-stock", format: "pdf", fileName: "Low_Stock_Report.pdf" }).catch(() => {});
    } catch {
      setExportError("Failed to generate the PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-brand-700">Low Stock Report</p>
          <p className="mt-1 text-sm text-zinc-500">Medicines that have fallen below their minimum stock threshold.</p>
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
            disabled={exportingPdf || !rows}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden />
            {exportingPdf ? "Generating…" : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!rows}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="no-print flex flex-wrap gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="ls-branch" className="block text-xs font-semibold text-zinc-500">
            Branch
          </label>
          <select
            id="ls-branch"
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setPage(1);
            }}
            className={`${selectClass} w-48`}
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
          <label htmlFor="ls-category" className="block text-xs font-semibold text-zinc-500">
            Category
          </label>
          <select
            id="ls-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className={`${selectClass} w-48`}
          >
            <option value="">All Categories</option>
            {facets?.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingDown} iconTone="bg-amber-50 text-amber-600" label="Low Stock Items" value={stats?.count} />
        <StatCard icon={MapPinned} iconTone="bg-sky-50 text-sky-600" label="Branches Affected" value={stats?.branches} />
        <StatCard icon={Boxes} iconTone="bg-red-50 text-red-600" label="Units Short" value={stats?.unitsShort} />
        <StatCard
          icon={AlertCircle}
          iconTone="bg-emerald-50 text-emerald-600"
          label="Est. Reorder Cost"
          value={stats ? `GH₵${stats.estCostGhs.toLocaleString()}` : undefined}
        />
      </div>

      <div className="print-sheet rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 p-5">
          <p className="text-sm font-bold text-zinc-700">Restock List</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-bold uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3">Medicine</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Branch</th>
                <th className="px-3 py-3 text-right">Stock / Threshold</th>
                <th className="px-3 py-3 text-right">Reorder Qty</th>
                <th className="px-5 py-3 text-right">Est. Cost (GHS)</th>
              </tr>
            </thead>
            <tbody>
              {rows === null
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b border-zinc-50">
                      {Array.from({ length: 6 }, (_, j) => (
                        <td key={j} className="px-3 py-4">
                          <div className="h-4 animate-pulse rounded bg-zinc-200/80" />
                        </td>
                      ))}
                    </tr>
                  ))
                : paged.map((m) => (
                    <tr key={m.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                      <td className="px-5 py-3.5 font-semibold text-zinc-800">{`${m.name} ${m.strength}`.trim()}</td>
                      <td className="px-3 py-3.5 text-zinc-600">{m.category}</td>
                      <td className="px-3 py-3.5 text-zinc-600">{m.branch}</td>
                      <td className="px-3 py-3.5 text-right text-amber-700">
                        {m.quantity} / {m.lowStockThreshold}
                      </td>
                      <td className="px-3 py-3.5 text-right font-semibold text-zinc-800">{reorderQty(m).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-zinc-700">
                        {(reorderQty(m) * m.unitPriceGhs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
              {rows !== null && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">
                    No medicines are currently below their minimum threshold.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {rows !== null && rows.length > PAGE_SIZE && (
          <div className="no-print flex items-center justify-between border-t border-zinc-100 px-5 py-3.5 text-sm text-zinc-500">
            <p>
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length} records
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
        )}
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
  value: number | string | undefined;
}) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</p>
        {value === undefined ? (
          <div className="mt-1.5 h-8 w-16 animate-pulse rounded bg-zinc-200/80" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-zinc-800">{typeof value === "number" ? value.toLocaleString() : value}</p>
        )}
      </div>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
        <Icon className="h-5.5 w-5.5" aria-hidden />
      </span>
    </article>
  );
}
