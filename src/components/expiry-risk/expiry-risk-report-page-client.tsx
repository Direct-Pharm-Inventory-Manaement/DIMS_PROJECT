"use client";

import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import Link from "next/link";
import { getAuth } from "@/lib/auth-storage";
import { getExpiryRiskSummary, listExpiryRisk, type ExpiryRiskRow, type ExpiryRiskSummary } from "@/lib/api/expiry-risk";
import { ROLE_BADGE } from "@/components/users/badges";
import { ExpiryRiskReportDocument, type ReportBranding } from "@/components/expiry-risk/expiry-risk-report-document";
import { TIER_LABEL, daysUntil, recommendedAction, reportReference, sortByUrgency } from "@/lib/expiry-report";

const APP_VERSION = "0.1.0";

const TIER_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-800",
  advisory: "bg-zinc-200 text-zinc-700",
};
const TIER_DAYS_TEXT: Record<string, string> = {
  critical: "text-red-600",
  warning: "text-amber-700",
  advisory: "text-zinc-500",
};

function branding(): ReportBranding {
  const session = getAuth();
  const role = session?.user.role;
  return {
    logoUrl: `${window.location.origin}/logo-dark.png`,
    appVersion: APP_VERSION,
    generatedByName: session?.user.name ?? "System User",
    generatedByRole: role ? ROLE_BADGE[role].label : "Staff",
  };
}

export function ExpiryRiskReportPageClient() {
  const [rows, setRows] = useState<ExpiryRiskRow[] | null>(null);
  const [summary, setSummary] = useState<ExpiryRiskSummary | null>(null);
  const [generatedAt] = useState(() => new Date());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getExpiryRiskSummary(controller.signal),
      listExpiryRisk({ page: 1, pageSize: 500 }, controller.signal),
    ]).then(([summaryData, riskData]) => {
      setSummary(summaryData);
      setRows(riskData.items);
    });
    return () => controller.abort();
  }, []);

  async function handleExportPdf() {
    if (!rows || !summary) return;
    setExporting(true);
    setExportError(null);
    try {
      const doc = (
        <ExpiryRiskReportDocument
          rows={rows}
          summary={summary}
          generatedAt={generatedAt}
          branding={branding()}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${reportReference(generatedAt)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Failed to generate the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const loading = rows === null || summary === null;
  const sortedRows = rows ? sortByUrgency(rows) : [];
  const totalRisks = summary ? summary.critical + summary.warning + summary.advisory : 0;

  return (
    <div className="min-h-screen bg-zinc-200">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between bg-brand-800 px-6 py-3.5 text-white shadow">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/expiry-risk"
            aria-label="Back to Expiry Risk Dashboard"
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4.5 w-4.5" aria-hidden />
          </Link>
          <Printer className="h-5 w-5" aria-hidden />
          <span className="font-bold">Print Preview</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={loading || exporting}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4" aria-hidden />
            )}
            {exporting ? "Generating…" : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print Report
          </button>
        </div>
      </div>

      {exportError && (
        <div className="no-print mx-auto mt-4 max-w-3xl rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
          {exportError}
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="print-sheet rounded-lg bg-white p-10 shadow-lg">
          {loading ? (
            <div className="flex h-96 items-center justify-center text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- logo must render identically for on-screen preview and window.print() */}
                  <img src="/logo-dark.png" alt="" className="h-11 w-11 rounded-lg" />
                  <div>
                    <p className="text-2xl font-bold text-brand-700">Direct Pharmacy</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                      Direct Pharmacy Manager
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-700">Direct Inventory Manager</p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Generated:{" "}
                    {generatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} |{" "}
                    {generatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-zinc-400">Ref: {reportReference(generatedAt)}</p>
                </div>
              </div>
              <div className="mt-3 border-b-2 border-brand-700" />

              <h1 className="mt-5 text-xl font-bold text-zinc-900">Medicine Expiry Risk Report</h1>
              <div className="mt-2 flex gap-2.5 border-l-[3px] border-amber-500 pl-3 text-sm leading-6 text-zinc-600">
                <p>
                  Comprehensive audit of stock approaching expiration dates across all
                  registered branches, including recommended mitigation actions.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-3">
                <div className="rounded-lg bg-red-50 py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">Critical</p>
                  <p className="mt-1 text-2xl font-bold text-red-700">
                    {String(summary!.critical).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] font-semibold text-red-700">&lt; 30 Days</p>
                </div>
                <div className="rounded-lg bg-amber-50 py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">Warning</p>
                  <p className="mt-1 text-2xl font-bold text-amber-800">
                    {String(summary!.warning).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] font-semibold text-amber-800">30-90 Days</p>
                </div>
                <div className="rounded-lg bg-zinc-100 py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">Advisory</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-600">
                    {String(summary!.advisory).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] font-semibold text-zinc-600">90-180 Days</p>
                </div>
                <div className="rounded-lg bg-brand-700 py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brand-100">Total Risks</p>
                  <p className="mt-1 text-2xl font-bold text-white">{totalRisks}</p>
                  <p className="text-[10px] font-semibold text-brand-100">Active Batches</p>
                </div>
              </div>

              <table className="mt-6 w-full border-t border-zinc-200 text-left text-xs">
                <thead>
                  <tr className="bg-zinc-100 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    <th className="py-2 pl-2 pr-2">Medicine / Category</th>
                    <th className="py-2 pr-2">Batch / Branch</th>
                    <th className="py-2 pr-2">Qty</th>
                    <th className="py-2 pr-2">Expiry Date</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => {
                    const days = daysUntil(row.expiryDate);
                    return (
                      <tr key={row.id} className="border-b border-zinc-100 align-top">
                        <td className="py-2.5 pl-2 pr-2">
                          <p className="font-bold text-brand-700">
                            {`${row.name} ${row.strength}`.trim()}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {row.stockCategory === "cold-chain" ? "Cold Chain" : row.form}
                          </p>
                        </td>
                        <td className="py-2.5 pr-2">
                          <p className="text-zinc-700">{row.batchNo}</p>
                          <p className="text-[10px] text-zinc-400">{row.branch}</p>
                        </td>
                        <td className="py-2.5 pr-2 font-bold text-zinc-800">
                          {row.quantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-2">
                          <p className="text-zinc-700">
                            {new Date(row.expiryDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className={`text-[10px] font-bold ${TIER_DAYS_TEXT[row.riskTier]}`}>
                            {days} {days === 1 ? "Day" : "Days"} Left
                          </p>
                        </td>
                        <td className="py-2.5 pr-2">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${TIER_BADGE[row.riskTier]}`}
                          >
                            {TIER_LABEL[row.riskTier]}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 leading-5 text-zinc-600">
                          {recommendedAction(row)}
                        </td>
                      </tr>
                    );
                  })}
                  {sortedRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400">
                        No medicines currently fall within the expiry risk window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-8 flex items-start justify-between gap-6 border-t border-dashed border-zinc-200 pt-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    Generated By
                  </p>
                  <div className="mt-4 w-40 border-t border-zinc-400" />
                  <p className="mt-1 text-sm font-bold text-zinc-800">
                    {getAuth()?.user.name ?? "System User"}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {(() => {
                      const role = getAuth()?.user.role;
                      return role ? ROLE_BADGE[role].label : "Staff";
                    })()}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-300">
                    Confidential — Prepared for Direct Pharmacy Management
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    Authorized Approval
                  </p>
                  <div className="mt-4 w-40 border-t border-zinc-400" />
                  <p className="mt-1 text-sm font-bold text-zinc-300">&nbsp;</p>
                  <p className="text-xs text-zinc-400">Authorized Signatory</p>
                  <p className="mt-1 text-[10px] text-zinc-300">
                    Direct Inventory Manager v{APP_VERSION} · Page 1 of 1
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
