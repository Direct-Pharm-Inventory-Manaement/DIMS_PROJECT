"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import type { SystemAlert } from "@/lib/mock/dashboard-data";

const SEVERITY_BORDER: Record<SystemAlert["severity"], string> = {
  warning: "border-l-amber-400",
  critical: "border-l-red-500",
};

export function SystemAlerts({ alerts }: { alerts: SystemAlert[] }) {
  const [resolved, setResolved] = useState(false);

  return (
    <section className="rounded-2xl bg-brand-800 p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-white">
        <CircleAlert className="h-5 w-5 text-amber-400" aria-hidden />
        System Alerts
      </h2>
      {resolved || alerts.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-lg bg-white/5 py-8 text-center">
          <CircleCheck className="h-6 w-6 text-emerald-400" aria-hidden />
          <p className="text-sm font-semibold text-white">All alerts resolved</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3">
            {alerts.map((alert) => (
              <article
                key={alert.title}
                className={`rounded-lg border-l-4 bg-white/10 p-4 ${SEVERITY_BORDER[alert.severity]}`}
              >
                <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                <p className="mt-1 text-xs leading-5 text-brand-100">
                  {alert.detail}
                </p>
              </article>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setResolved(true)}
            className="mt-5 w-full rounded-lg bg-amber-100 py-2.5 text-sm font-bold text-brand-900 transition-colors hover:bg-amber-200"
          >
            Resolve All Alerts
          </button>
        </>
      )}
    </section>
  );
}
