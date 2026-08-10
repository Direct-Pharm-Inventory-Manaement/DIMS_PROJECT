"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Bell, CalendarClock, TrendingDown, type LucideIcon } from "lucide-react";
import { getExpiryRiskSummary } from "@/lib/api/expiry-risk";
import { getLowStockSummary } from "@/lib/api/low-stock";
import { getTransfersSummary } from "@/lib/api/transfers";

interface AlertItem {
  key: string;
  icon: LucideIcon;
  iconTone: string;
  title: string;
  detail: string;
  href: string;
}

/** Derived from live data every time it's shown — never a stored/dismissable feed, so nothing to go stale. */
async function loadAlerts(signal: AbortSignal): Promise<AlertItem[]> {
  const [expiry, lowStock, transfers] = await Promise.all([
    getExpiryRiskSummary(signal),
    getLowStockSummary({}, signal),
    getTransfersSummary(signal),
  ]);

  const items: AlertItem[] = [];
  if (expiry.critical > 0) {
    items.push({
      key: "expiry-critical",
      icon: CalendarClock,
      iconTone: "bg-red-50 text-red-600",
      title: `${expiry.critical} ${expiry.critical === 1 ? "batch" : "batches"} in critical expiry risk`,
      detail: "Expiring within the critical window — review for clearance or transfer.",
      href: "/dashboard/expiry-risk",
    });
  }
  if (lowStock.criticalLowStock > 0) {
    items.push({
      key: "low-stock-critical",
      icon: TrendingDown,
      iconTone: "bg-amber-50 text-amber-600",
      title: `${lowStock.criticalLowStock} ${lowStock.criticalLowStock === 1 ? "medicine" : "medicines"} critically low on stock`,
      detail: "Predicted to run out within days — restocking recommended.",
      href: "/dashboard/low-stock",
    });
  }
  if (transfers.pendingApproval > 0) {
    items.push({
      key: "transfers-pending",
      icon: ArrowLeftRight,
      iconTone: "bg-sky-50 text-sky-600",
      title: `${transfers.pendingApproval} transfer ${transfers.pendingApproval === 1 ? "request" : "requests"} awaiting approval`,
      detail: "Review and approve or reject pending inter-branch transfers.",
      href: "/dashboard/transfers",
    });
  }
  return items;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadAlerts(controller.signal)
      .then(setAlerts)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAlerts([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    loadAlerts(controller.signal)
      .then(setAlerts)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const count = alerts?.length ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${count > 0 ? `, ${count} active` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
            aria-hidden
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
        >
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-bold text-zinc-800">Notifications</p>
            <p className="text-xs text-zinc-400">Active issues that need attention</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alerts === null ? (
              <div className="flex flex-col gap-2 p-4">
                {[0, 1].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-100" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-400">No active alerts. Everything looks good.</p>
            ) : (
              alerts.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.key}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 border-b border-zinc-50 px-4 py-3 transition-colors last:border-0 hover:bg-zinc-50"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a.iconTone}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">{a.title}</p>
                      <p className="mt-0.5 text-xs leading-4 text-zinc-400">{a.detail}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
