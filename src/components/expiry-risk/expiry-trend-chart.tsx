"use client";

import { useState } from "react";
import type { TrendMonth } from "@/lib/api/expiry-risk";

/** Palette validated with the dataviz checker (light surface). */
const LOSS_COLOR = "#e34948";
const PROTECTED_COLOR = "#2a78d6";

const CHART_HEIGHT = 220;

function formatGhs(value: number): string {
  if (value >= 1000) return `GH₵ ${(value / 1000).toFixed(1)}k`;
  return `GH₵ ${value.toLocaleString()}`;
}

function formatTick(value: number): string {
  return value === 0 ? "0" : `${Math.round(value / 1000)}k`;
}

export function ExpiryTrendChart({ data }: { data: TrendMonth[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const rawMax = Math.max(
    1,
    ...data.map((d) => Math.max(d.lossValueGhs, d.protectedValueGhs)),
  );
  // Round the scale up to a clean 10k step.
  const scaleMax = Math.max(10_000, Math.ceil(rawMax / 10_000) * 10_000);
  const ticks = [scaleMax, scaleMax / 2, 0];

  return (
    <div>
      <div className="flex items-center justify-end gap-4 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LOSS_COLOR }} aria-hidden />
          Loss
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROTECTED_COLOR }} aria-hidden />
          Protected
        </span>
      </div>

      <div className="mt-4 flex gap-3">
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
            aria-label={`Value of stock expiring per month: ${data
              .map(
                (d) =>
                  `${d.month} loss ${formatGhs(d.lossValueGhs)}, protected ${formatGhs(d.protectedValueGhs)}`,
              )
              .join("; ")}`}
          >
            {data.map((point) => {
              const isHovered = hovered === point.month;
              return (
                <div
                  key={point.month}
                  className="relative flex h-full w-full max-w-16 cursor-default items-end justify-center gap-1"
                  onMouseEnter={() => setHovered(point.month)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {isHovered && (
                    <div className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-brand-800 px-3 py-2 text-xs font-semibold text-white shadow-lg">
                      <p>{point.month}</p>
                      <p className="mt-0.5 font-normal">
                        Loss: {formatGhs(point.lossValueGhs)}
                      </p>
                      <p className="font-normal">
                        Protected: {formatGhs(point.protectedValueGhs)}
                      </p>
                    </div>
                  )}
                  <div
                    className="w-5 rounded-t"
                    style={{
                      height: `${Math.max((point.lossValueGhs / scaleMax) * 100, point.lossValueGhs > 0 ? 2 : 0.5)}%`,
                      backgroundColor: LOSS_COLOR,
                      opacity: hovered && !isHovered ? 0.5 : 1,
                    }}
                  />
                  <div
                    className="w-5 rounded-t"
                    style={{
                      height: `${Math.max((point.protectedValueGhs / scaleMax) * 100, point.protectedValueGhs > 0 ? 2 : 0.5)}%`,
                      backgroundColor: PROTECTED_COLOR,
                      opacity: hovered && !isHovered ? 0.5 : 1,
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
                className="w-full max-w-16 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400"
              >
                {point.month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
