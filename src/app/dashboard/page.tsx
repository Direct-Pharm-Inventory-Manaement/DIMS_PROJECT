import type { Metadata } from "next";
import {
  Archive,
  ArrowLeftRight,
  BellRing,
  CalendarX2,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { ExpiryWatchlist } from "@/components/dashboard/expiry-watchlist";
import { InventoryTrendChart } from "@/components/dashboard/inventory-trend-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCard } from "@/components/dashboard/stat-card";
import { StockDistribution } from "@/components/dashboard/stock-distribution";
import { SystemAlerts } from "@/components/dashboard/system-alerts";
import {
  essentialSharePercent,
  expiryWatchlist,
  highlightedMonth,
  inventoryTrend,
  recentActivity,
  stockDistribution,
  systemAlerts,
} from "@/lib/mock/dashboard-data";

export const metadata: Metadata = {
  title: "Dashboard — Direct Inventory Manager",
  description:
    "Monitor stock levels, expiry risk, and transfers across Direct Pharmacy branches.",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-brand-800">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Monitor the health of Direct Pharmacy operations.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Medicines"
          value="1,284"
          icon={Archive}
          iconTone="blue"
          badge="Update: Just now"
          badgeTone="blue"
          footnote="2.4% vs last month"
          footnoteIcon={TrendingUp}
          footnoteTone="green"
        />
        <StatCard
          label="Expiring Soon"
          value="17"
          valueTone="red"
          icon={CalendarX2}
          iconTone="red"
          badge="Priority"
          badgeTone="red"
          footnote="Action required < 30 days"
          footnoteIcon={TriangleAlert}
          footnoteTone="red"
        />
        <StatCard
          label="Low Stock Items"
          value="8"
          icon={ShoppingCart}
          iconTone="amber"
          badge="Alert"
          badgeTone="amber"
          footnote="Orders recommended"
          footnoteIcon={BellRing}
          footnoteTone="amber"
        />
        <StatCard
          label="Pending Transfers"
          value="4"
          icon={ArrowLeftRight}
          iconTone="navy"
          badge="In Review"
          badgeTone="navy"
          footnote="Awaiting approval"
          footnoteIcon={RefreshCw}
          footnoteTone="navy"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-brand-800">
                Inventory Value Trend
              </h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                Projected stock value over the next 6 months
              </p>
            </div>
            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-brand-700">
              Last 6 Months
            </span>
          </div>
          <div className="mt-8">
            <InventoryTrendChart
              data={inventoryTrend}
              highlightedMonth={highlightedMonth}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-brand-800">
            Stock Distribution
          </h2>
          <div className="mt-6">
            <StockDistribution
              segments={stockDistribution}
              centerPercent={essentialSharePercent}
              centerLabel="Essential"
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <ExpiryWatchlist rows={expiryWatchlist} />
        <div className="flex flex-col gap-6">
          <SystemAlerts alerts={systemAlerts} />
          <RecentActivity items={recentActivity} />
        </div>
      </div>
    </div>
  );
}
