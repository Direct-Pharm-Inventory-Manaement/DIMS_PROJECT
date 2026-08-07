"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BellRing,
  ChartColumnIncreasing,
  CircleCheck,
  Download,
  SlidersHorizontal,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { Dropdown } from "@/components/ui/dropdown";
import { AttentionTable } from "@/components/low-stock/attention-table";
import { BranchRiskPanel } from "@/components/low-stock/branch-risk-panel";
import { ConsumptionVelocityChart } from "@/components/low-stock/consumption-velocity-chart";
import { RestockingTable } from "@/components/low-stock/restocking-table";
import {
  getBranchRisk,
  getConsumptionVelocity,
  getLowStockSummary,
  getRestockingRecommendations,
  listPredictions,
  type BranchRisk,
  type LowStockSummary,
  type Prediction,
  type RestockingRecommendation,
  type VelocityPoint,
} from "@/lib/api/low-stock";

const CURRENT_BRANCH = "Adenta Main";
const HORIZON_OPTIONS = [
  { label: "Next 7 Days", value: 7 },
  { label: "Next 14 Days", value: 14 },
  { label: "Next 30 Days", value: 30 },
];

function StatCard({
  icon: Icon,
  iconTone,
  border,
  label,
  value,
  footnote,
  footnoteTone,
}: {
  icon: LucideIcon;
  iconTone: string;
  border: string;
  label: string;
  value: number | null;
  footnote: string;
  footnoteTone: string;
}) {
  return (
    <article className={`flex flex-col gap-3 rounded-2xl border-l-4 bg-white p-5 shadow-sm ${border}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${iconTone}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      {value === null ? (
        <div className="h-9 w-14 animate-pulse rounded bg-zinc-200/80" />
      ) : (
        <p className="text-3xl font-bold text-zinc-800">{value.toLocaleString()}</p>
      )}
      <p className={`text-xs font-semibold ${footnoteTone}`}>{footnote}</p>
    </article>
  );
}

function exportPredictionsCsv(rows: Prediction[]) {
  const header = ["Medicine", "SKU", "Branch", "Current Stock", "Avg Daily Usage", "Depletion Date", "Risk Level"];
  const lines = rows.map((p) =>
    [
      `${p.name} ${p.strength}`.trim(),
      p.sku,
      p.branch,
      p.currentStock,
      p.avgDailyUsage,
      p.depletionDate ? new Date(p.depletionDate).toLocaleDateString("en-GB") : "—",
      p.riskTier,
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
  anchor.download = "low-stock-prediction-report.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function LowStockPageClient() {
  const [currentBranchOnly, setCurrentBranchOnly] = useState(true);
  const [windowDays, setWindowDays] = useState(7);
  const [orderedIds, setOrderedIds] = useState<Set<string>>(new Set());
  const [exportError, setExportError] = useState<string | null>(null);
  // Tracks which filter context orderedIds was last auto-seeded for, so
  // switching branch/horizon re-selects the new recommendation set instead
  // of leaving a stale selection that matches none of the new ids.
  const [autoSelectedKey, setAutoSelectedKey] = useState<string | null>(null);

  const branch = currentBranchOnly ? CURRENT_BRANCH : undefined;
  const filters = useMemo(() => ({ branch, windowDays }), [branch, windowDays]);

  const [summary, setSummary] = useState<LowStockSummary | null>(null);
  const [branchRisk, setBranchRisk] = useState<BranchRisk[] | null>(null);
  const [velocity, setVelocity] = useState<VelocityPoint[] | null>(null);
  const [recommendations, setRecommendations] = useState<RestockingRecommendation[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getLowStockSummary(filters, controller.signal).then(setSummary).catch(() => {});
    getConsumptionVelocity(filters, controller.signal).then(setVelocity).catch(() => {});
    getBranchRisk({ windowDays }, controller.signal).then(setBranchRisk).catch(() => {});
    return () => controller.abort();
  }, [filters, windowDays]);

  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    const controller = new AbortController();
    getRestockingRecommendations(filters, controller.signal)
      .then((data) => {
        setRecommendations(data);
        if (autoSelectedKey !== filterKey) {
          setOrderedIds(new Set(data.map((r) => r.medicineId)));
          setAutoSelectedKey(filterKey);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [filters, filterKey, autoSelectedKey]);

  function handleOrder(prediction: Prediction) {
    setOrderedIds((prev) => new Set(prev).add(prediction.id));
  }

  function toggleSelection(medicineId: string) {
    setOrderedIds((prev) => {
      const next = new Set(prev);
      if (next.has(medicineId)) next.delete(medicineId);
      else next.add(medicineId);
      return next;
    });
  }

  async function handleExportReport() {
    setExportError(null);
    try {
      const result = await listPredictions({ ...filters, page: 1, pageSize: 500 });
      exportPredictionsCsv(result.items);
    } catch (err) {
      setExportError(
        err instanceof ApiError ? err.message : "Failed to export the prediction report.",
      );
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-800">Low-Stock Predictions</h1>
          <p className="mt-1 max-w-md text-sm text-zinc-500">
            Identify medicines likely to run out based on historical sales and lead times.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2">
            <SlidersHorizontal className="h-4 w-4 text-zinc-400" aria-hidden />
            <Dropdown
              label="Current Branch Only"
              value={currentBranchOnly ? "Current Branch Only" : "All Branches"}
              options={["Current Branch Only", "All Branches"]}
              onChange={(v) => setCurrentBranchOnly(v !== "All Branches")}
            />
          </div>
          <Dropdown
            label="Next 7 Days"
            value={HORIZON_OPTIONS.find((h) => h.value === windowDays)?.label ?? null}
            options={HORIZON_OPTIONS.map((h) => h.label)}
            onChange={(label) => {
              const match = HORIZON_OPTIONS.find((h) => h.label === label);
              if (match) setWindowDays(match.value);
            }}
          />
          <button
            type="button"
            onClick={handleExportReport}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export Prediction Report
          </button>
        </div>
      </header>

      {exportError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {exportError}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TriangleAlert}
          iconTone="bg-red-500 text-white"
          border="border-red-500"
          label="Critical Low Stock"
          value={summary?.criticalLowStock ?? null}
          footnote="Requires immediate order"
          footnoteTone="text-red-600"
        />
        <StatCard
          icon={BellRing}
          iconTone="bg-amber-400 text-white"
          border="border-amber-400"
          label="Reorder Soon"
          value={summary?.reorderSoon ?? null}
          footnote="Within next 3-10 days"
          footnoteTone="text-amber-600"
        />
        <StatCard
          icon={CircleCheck}
          iconTone="bg-emerald-500 text-white"
          border="border-emerald-500"
          label="Adequate Stock"
          value={summary?.adequateStock ?? null}
          footnote={summary ? `${summary.adequatePct}% of total` : "…"}
          footnoteTone="text-emerald-600"
        />
        <StatCard
          icon={ChartColumnIncreasing}
          iconTone="bg-brand-700 text-white"
          border="border-brand-700"
          label="Predicted Stock-Outs"
          value={summary?.predictedStockOuts ?? null}
          footnote="Based on 30-day usage trend"
          footnoteTone="text-brand-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-brand-800">Consumption Velocity</h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                Average units sold vs predicted stock depletion
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4 pt-1 text-xs font-semibold text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-400" aria-hidden />
                Predicted
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-600" aria-hidden />
                Actual
              </span>
            </div>
          </div>
          <div className="mt-6">
            {velocity ? (
              <ConsumptionVelocityChart data={velocity} />
            ) : (
              <div className="h-64 animate-pulse rounded-xl bg-zinc-100" />
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-brand-800">Stock Risk by Branch</h2>
          <div className="mt-5">
            {branchRisk ? (
              <BranchRiskPanel risks={branchRisk} />
            ) : (
              <div className="h-40 animate-pulse rounded-xl bg-zinc-100" />
            )}
          </div>
        </section>
      </div>

      <AttentionTable filters={filters} onOrder={handleOrder} orderedIds={orderedIds} />

      <RestockingTable
        recommendations={recommendations ?? []}
        loading={recommendations === null}
        selected={orderedIds}
        onToggle={toggleSelection}
      />
    </div>
  );
}
