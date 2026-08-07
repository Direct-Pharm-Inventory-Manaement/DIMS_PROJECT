"use client";

import { useState } from "react";
import type { VelocityPoint } from "@/lib/api/low-stock";

/** Ordinal same-hue pair validated with the dataviz checker (--ordinal, light surface). */
const ACTUAL_COLOR = "#114f75";
const PREDICTED_COLOR = "#4d94ba";

const CHART_HEIGHT = 260;
const CHART_WIDTH = 640;
const PADDING = 24;

function buildPath(points: VelocityPoint[], key: "actual" | "predicted", max: number): string {
  if (points.length === 0) return "";
  const stepX = (CHART_WIDTH - PADDING * 2) / (points.length - 1 || 1);
  return points
    .map((p, i) => {
      const x = PADDING + i * stepX;
      const y = PADDING + (1 - p[key] / max) * (CHART_HEIGHT - PADDING * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function ConsumptionVelocityChart({ data }: { data: VelocityPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        No consumption history yet for this selection.
      </div>
    );
  }

  const rawMax = Math.max(...data.map((p) => Math.max(p.actual, p.predicted)), 1);
  const max = Math.ceil(rawMax / 10) * 10 || 10;
  const stepX = (CHART_WIDTH - PADDING * 2) / (data.length - 1 || 1);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Consumption velocity: ${data
          .map((p) => `${p.weekday} actual ${p.actual}, predicted ${p.predicted}`)
          .join("; ")}`}
      >
        {[0, 0.5, 1].map((frac) => (
          <line
            key={frac}
            x1={PADDING}
            x2={CHART_WIDTH - PADDING}
            y1={PADDING + frac * (CHART_HEIGHT - PADDING * 2)}
            y2={PADDING + frac * (CHART_HEIGHT - PADDING * 2)}
            stroke="#e1e0d9"
            strokeWidth={1}
          />
        ))}

        <path d={buildPath(data, "predicted", max)} fill="none" stroke={PREDICTED_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={buildPath(data, "actual", max)} fill="none" stroke={ACTUAL_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {data.map((p, i) => {
          const x = PADDING + i * stepX;
          const yActual = PADDING + (1 - p.actual / max) * (CHART_HEIGHT - PADDING * 2);
          const yPredicted = PADDING + (1 - p.predicted / max) * (CHART_HEIGHT - PADDING * 2);
          return (
            <g key={p.date}>
              <rect
                x={x - stepX / 2}
                y={0}
                width={stepX}
                height={CHART_HEIGHT}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-default"
              />
              <circle cx={x} cy={yPredicted} r={hovered === i ? 5 : 4} fill="#fff" stroke={PREDICTED_COLOR} strokeWidth={2} pointerEvents="none" />
              <circle cx={x} cy={yActual} r={hovered === i ? 5 : 4} fill="#fff" stroke={ACTUAL_COLOR} strokeWidth={2} pointerEvents="none" />
            </g>
          );
        })}
      </svg>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-brand-800 px-3 py-2 text-xs font-semibold text-white shadow-lg"
          style={{
            left: `${((PADDING + hovered * stepX) / CHART_WIDTH) * 100}%`,
            top: `${(Math.min(
              (1 - data[hovered].actual / max) * (CHART_HEIGHT - PADDING * 2) + PADDING,
              (1 - data[hovered].predicted / max) * (CHART_HEIGHT - PADDING * 2) + PADDING,
            ) / CHART_HEIGHT) * 100}%`,
          }}
        >
          <p>{data[hovered].weekday}</p>
          <p className="mt-0.5 font-normal">Actual: {data[hovered].actual} units</p>
          <p className="font-normal">Predicted: {data[hovered].predicted} units</p>
        </div>
      )}

      <div className="mt-2 flex justify-between px-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {data.map((p) => (
          <span key={p.date}>{p.weekday}</span>
        ))}
      </div>
    </div>
  );
}
