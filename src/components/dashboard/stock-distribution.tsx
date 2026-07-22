"use client";

import { useState } from "react";
import type { DistributionSegment } from "@/lib/mock/dashboard-data";

interface StockDistributionProps {
  segments: DistributionSegment[];
  centerPercent: number;
  centerLabel: string;
}

const SIZE = 200;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** 2px surface gap between segments, expressed as arc length. */
const GAP = 2;

export function StockDistribution({
  segments,
  centerPercent,
  centerLabel,
}: StockDistributionProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const arcs = segments.map((segment, index) => {
    const length = (segment.percent / 100) * CIRCUMFERENCE;
    const precedingLength = segments
      .slice(0, index)
      .reduce((sum, s) => sum + (s.percent / 100) * CIRCUMFERENCE, 0);
    return {
      ...segment,
      dashArray: `${Math.max(length - GAP, 0)} ${CIRCUMFERENCE - length + GAP}`,
      dashOffset: -precedingLength,
    };
  });

  const hoveredSegment = segments.find((s) => s.label === hovered);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`Stock distribution: ${segments
            .map((s) => `${s.label} ${s.percent}%`)
            .join(", ")}`}
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {arcs.map((arc) => (
              <circle
                key={arc.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={hovered === arc.label ? STROKE + 4 : STROKE}
                strokeDasharray={arc.dashArray}
                strokeDashoffset={arc.dashOffset}
                opacity={hovered && hovered !== arc.label ? 0.4 : 1}
                onMouseEnter={() => setHovered(arc.label)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-default transition-all"
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {hoveredSegment ? (
            <>
              <p className="text-3xl font-bold text-brand-800">
                {hoveredSegment.percent}%
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {hoveredSegment.label}
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold text-brand-800">
                {centerPercent}%
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {centerLabel}
              </p>
            </>
          )}
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2.5">
        {segments.map((segment) => (
          <li
            key={segment.label}
            className="flex items-center justify-between text-sm"
            onMouseEnter={() => setHovered(segment.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="flex items-center gap-2.5 font-medium text-zinc-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden
              />
              {segment.label}
            </span>
            <span className="font-bold text-zinc-800">{segment.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
