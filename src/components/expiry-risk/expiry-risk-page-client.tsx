"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Asterisk,
  BadgePercent,
  CircleCheck,
  ClipboardCheck,
  Download,
  History,
  Info,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { ExpiryTable } from "@/components/expiry-risk/expiry-table";
import { ExpiryTrendChart } from "@/components/expiry-risk/expiry-trend-chart";
import { StockDistribution } from "@/components/dashboard/stock-distribution";
import {
  getExpiryRiskSummary,
  getExpiryTrend,
  getManufacturers,
  getRecentActions,
  getRiskDistribution,
  listExpiryRisk,
  type ExpiryRiskSummary,
  type RecentAction,
  type RiskDistribution,
  type RiskTier,
  type StockCategory,
  type TrendMonth,
} from "@/lib/api/expiry-risk";

const RISK_LABELS: Record<string, RiskTier> = {
  Critical: "critical",
  Warning: "warning",
  Advisory: "advisory",
};

const STOCK_CATEGORIES: { value: StockCategory; label: string }[] = [
  { value: "essential", label: "Essential" },
  { value: "cold-chain", label: "Cold Chain" },
  { value: "restricted", label: "Restricted" },
];

const ACTION_ICON: Record<RecentAction["type"], { icon: LucideIcon; tile: string }> = {
  transfer: { icon: ArrowLeftRight, tile: "bg-emerald-100 text-emerald-600" },
  clearance: { icon: BadgePercent, tile: "bg-amber-100 text-amber-600" },
  review: { icon: ClipboardCheck, tile: "bg-brand-100 text-brand-600" },
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatCard({
  icon: Icon,
  iconTile,
  border,
  topLabel,
  value,
  valueClass,
  label,
}: {
  icon: LucideIcon;
  iconTile: string;
  border: string;
  topLabel: string;
  value: number | null;
  valueClass: string;
  label: string;
}) {
  return (
    <article className={`flex flex-col gap-3 rounded-2xl border-l-4 bg-white p-5 shadow-sm ${border}`}>
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${iconTile}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
          {topLabel}
        </p>
      </div>
      {value === null ? (
        <div className="h-9 w-14 animate-pulse rounded bg-zinc-200/80" />
      ) : (
        <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
      )}
      <p className="text-sm font-semibold text-zinc-600">{label}</p>
    </article>
  );
}

interface DashboardData {
  summary: ExpiryRiskSummary;
  trend: TrendMonth[];
  distribution: RiskDistribution;
  actions: RecentAction[];
}

export function ExpiryRiskPageClient() {
  const [refreshId, setRefreshId] = useState(0);
  const [answered, setAnswered] = useState<{
    key: number;
    data: DashboardData | null;
    error: string | null;
  } | null>(null);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  const [riskTier, setRiskTier] = useState<RiskTier | null>(null);
  const [manufacturer, setManufacturer] = useState<string | null>(null);
  const [stockCategory, setStockCategory] = useState<StockCategory | null>(null);

  const data = answered?.key === refreshId ? answered.data : null;

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getExpiryRiskSummary(controller.signal),
      getExpiryTrend(controller.signal),
      getRiskDistribution(controller.signal),
      getRecentActions(controller.signal),
    ])
      .then(([summary, trend, distribution, actions]) => {
        setAnswered({
          key: refreshId,
          data: { summary, trend, distribution, actions },
          error: null,
        });
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAnswered({
          key: refreshId,
          data: null,
          error: err instanceof Error ? err.message : "Failed to load dashboard.",
        });
      });
    return () => controller.abort();
  }, [refreshId]);

  useEffect(() => {
    const controller = new AbortController();
    getManufacturers(controller.signal)
      .then((res) => setManufacturers(res.manufacturers))
      .catch(() => {
        // Non-fatal: the manufacturer dropdown simply stays empty.
      });
    return () => controller.abort();
  }, []);

  const filters = useMemo(
    () => ({
      riskTier: riskTier ?? undefined,
      manufacturer: manufacturer ?? undefined,
      stockCategory: stockCategory ?? undefined,
    }),
    [riskTier, manufacturer, stockCategory],
  );
  const filterKey = JSON.stringify(filters);
  const hasFilters = Boolean(riskTier || manufacturer || stockCategory);

  async function handleGenerateReport() {
    const result = await listExpiryRisk({ ...filters, page: 1, pageSize: 500 });
    const header = [
      "Medicine",
      "Batch No.",
      "Branch",
      "Manufacturer",
      "Stock Category",
      "Quantity",
      "Expiry Date",
      "Risk Level",
      "Suggested Action",
      "Actioned",
    ];
    const lines = result.items.map((r) =>
      [
        `${r.name} ${r.strength}`.trim(),
        r.batchNo,
        r.branch,
        r.manufacturer,
        r.stockCategory,
        r.quantity,
        new Date(r.expiryDate).toLocaleDateString("en-GB"),
        r.riskTier,
        r.suggestedAction,
        r.actioned ? "yes" : "no",
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
    anchor.download = "expiry-risk-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-800">
            Expiry Risk Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Monitor medicines approaching expiration and manage inventory waste.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerateReport}
          className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          <Download className="h-4 w-4" aria-hidden />
          Generate Risk Report
        </button>
      </header>

      {answered?.key === refreshId && answered.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {answered.error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Asterisk}
          iconTile="bg-red-50 text-red-600"
          border="border-red-500"
          topLabel="Within 30 Days"
          value={data?.summary.critical ?? null}
          valueClass="text-red-600"
          label="Critical Expiry"
        />
        <StatCard
          icon={TriangleAlert}
          iconTile="bg-amber-50 text-amber-600"
          border="border-amber-400"
          topLabel="30 – 90 Days"
          value={data?.summary.warning ?? null}
          valueClass="text-amber-600"
          label="Warning Status"
        />
        <StatCard
          icon={Info}
          iconTile="bg-brand-50 text-brand-600"
          border="border-brand-600"
          topLabel="90 – 180 Days"
          value={data?.summary.advisory ?? null}
          valueClass="text-brand-700"
          label="Advisory Level"
        />
        <StatCard
          icon={CircleCheck}
          iconTile="bg-emerald-50 text-emerald-600"
          border="border-emerald-500"
          topLabel="Recently Actioned"
          value={data?.summary.reviewedBatches ?? null}
          valueClass="text-emerald-600"
          label="Reviewed Batches"
        />
      </div>

      <section className="flex flex-wrap items-end gap-6 rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Filter by Risk Level
          </p>
          <Dropdown
            label="All Risk Levels"
            value={
              riskTier
                ? Object.keys(RISK_LABELS).find((k) => RISK_LABELS[k] === riskTier) ?? null
                : null
            }
            options={Object.keys(RISK_LABELS)}
            onChange={(v) => setRiskTier(v ? RISK_LABELS[v] : null)}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Manufacturer
          </p>
          <Dropdown
            label="All Manufacturers"
            value={manufacturer}
            options={manufacturers}
            onChange={setManufacturer}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Stock Category
          </p>
          <div className="flex items-center gap-2" role="group" aria-label="Stock category">
            {STOCK_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                aria-pressed={stockCategory === cat.value}
                onClick={() =>
                  setStockCategory(stockCategory === cat.value ? null : cat.value)
                }
                className={`rounded-full border px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                  stockCategory === cat.value
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setRiskTier(null);
              setManufacturer(null);
              setStockCategory(null);
            }}
            className="ml-auto pb-2 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Clear All Filters
          </button>
        )}
      </section>

      <ExpiryTable
        key={filterKey}
        filters={filters}
        onMutated={() => setRefreshId((id) => id + 1)}
      />

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-brand-800">
            Expiry Trend (Next 6 Months)
          </h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            Stock value expiring per month — actioned batches count as protected
          </p>
          <div className="mt-5">
            {data ? (
              <ExpiryTrendChart data={data.trend} />
            ) : (
              <div className="h-64 animate-pulse rounded-xl bg-zinc-100" />
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-brand-800">
            Stock Risk Distribution
          </h2>
          <div className="mt-5">
            {data ? (
              <StockDistribution
                segments={[
                  {
                    label: "Critical Loss",
                    percent: data.distribution.criticalLossPct,
                    color: "#e34948",
                  },
                  {
                    label: "Under Watch",
                    percent: data.distribution.underWatchPct,
                    color: "#eda100",
                  },
                  {
                    label: "Healthy Supply",
                    percent: data.distribution.healthySupplyPct,
                    color: "#2a78d6",
                  },
                ]}
                centerPercent={data.distribution.safeStockPct}
                centerLabel="Safe Stock"
              />
            ) : (
              <div className="h-64 animate-pulse rounded-xl bg-zinc-100" />
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-brand-800">
            <History className="h-5 w-5 text-brand-500" aria-hidden />
            Recent Expiry Mitigation Actions
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {data && data.actions.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-400">
                No mitigation actions recorded yet — action an at-risk batch
                above to see it here.
              </p>
            )}
            {(data?.actions ?? []).map((action) => {
              const meta = ACTION_ICON[action.type];
              const Icon = meta.icon;
              return (
                <article
                  key={action.id}
                  className="flex items-start gap-3 rounded-xl bg-zinc-100/70 p-4"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tile}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-zinc-800">
                      {action.title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                      {action.note}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-zinc-400">
                    {timeAgo(action.createdAt)}
                  </span>
                </article>
              );
            })}
            {!data && (
              <div className="h-32 animate-pulse rounded-xl bg-zinc-100" />
            )}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl bg-brand-800 p-6 shadow-sm">
          <Sparkles
            className="absolute -bottom-4 -right-4 h-28 w-28 text-white/10"
            aria-hidden
          />
          <h2 className="text-lg font-bold text-white">Automated Optimization</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-brand-100">
            The system can automatically suggest transfer routes for medicines
            expiring within 60 days.
          </p>
          <Link
            href="/dashboard/transfers"
            className="mt-5 inline-block rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
          >
            Configure Auto-Move
          </Link>
        </section>
      </div>
    </div>
  );
}
