"use client";

import { useState } from "react";
import { VIZ, type TrendPoint } from "@/lib/mock/dashboard-data";

interface InventoryTrendChartProps {
  data: TrendPoint[];
  highlightedMonth: string;
}

const CHART_HEIGHT = 240;

function formatValue(value: number): string {
  return `GH₵ ${value.toLocaleString()}`;
}

function formatTick(value: number): string {
  return value === 0 ? "0" : `${Math.round(value / 1000)}k`;
}

export function InventoryTrendChart({
  data,
  highlightedMonth,
}: InventoryTrendChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Round the scale top up to a clean 50k step so gridline ticks are tidy.
  const scaleMax = Math.ceil(Math.max(...data.map((d) => d.value)) / 50_000) * 50_000;
  const ticks = [scaleMax, scaleMax / 2, 0];

  return (
    <div className="flex gap-3">
      <div
        className="flex shrink-0 flex-col justify-between text-right text-[11px] font-medium text-zinc-400"
        style={{ height: CHART_HEIGHT }}
        aria-hidden
      >
        {ticks.map((tick) => (
          <span key={tick}>{formatTick(tick)}</span>
        ))}
      </div>

      <div className="relative flex-1">
        {/* hairline gridlines at each tick */}
        <div
          className="pointer-events-none absolute inset-x-0 flex flex-col justify-between"
          style={{ height: CHART_HEIGHT }}
          aria-hidden
        >
          {ticks.map((tick) => (
            <div key={tick} className="border-t border-zinc-100" />
          ))}
        </div>

        <div
          className="relative flex items-end justify-around gap-2"
          style={{ height: CHART_HEIGHT }}
          role="img"
          aria-label={`Inventory value by month: ${data
            .map((d) => `${d.month} ${formatValue(d.value)}`)
            .join(", ")}`}
        >
          {data.map((point) => {
            const isAccent = point.month === highlightedMonth;
            const isHovered = hovered === point.month;
            return (
              <div
                key={point.month}
                className="relative flex h-full w-full max-w-14 cursor-default flex-col items-center justify-end"
                onMouseEnter={() => setHovered(point.month)}
                onMouseLeave={() => setHovered(null)}
              >
                {isHovered && (
                  <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                    {point.month} · {formatValue(point.value)}
                  </div>
                )}
                <div
                  className="w-6 rounded-t transition-opacity"
                  style={{
                    height: `${(point.value / scaleMax) * 100}%`,
                    backgroundColor: isAccent ? VIZ.barAccent : VIZ.barDeEmphasis,
                    opacity: hovered && !isHovered ? 0.55 : 1,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-around gap-2 pt-2">
          {data.map((point) => (
            <span
              key={point.month}
              className={`w-full max-w-14 text-center text-[11px] font-semibold uppercase tracking-wide ${
                point.month === highlightedMonth
                  ? "text-brand-700"
                  : "text-zinc-400"
              }`}
            >
              {point.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
