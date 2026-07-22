import type { LucideIcon } from "lucide-react";

type Tone = "blue" | "red" | "amber" | "navy" | "green";

const ICON_TILE: Record<Tone, string> = {
  blue: "bg-brand-50 text-brand-600",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-600",
  navy: "bg-brand-50 text-brand-700",
  green: "bg-emerald-50 text-emerald-600",
};

const BADGE: Record<Tone, string> = {
  blue: "bg-brand-50 text-brand-600",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-700",
  navy: "bg-brand-700 text-white",
  green: "bg-emerald-50 text-emerald-700",
};

const FOOTNOTE: Record<Tone, string> = {
  blue: "text-brand-600",
  red: "text-red-600",
  amber: "text-amber-700",
  navy: "text-brand-600",
  green: "text-emerald-600",
};

export interface StatCardProps {
  label: string;
  value: string;
  valueTone?: "default" | "red";
  icon: LucideIcon;
  iconTone: Tone;
  badge: string;
  badgeTone: Tone;
  footnote: string;
  footnoteIcon: LucideIcon;
  footnoteTone: Tone;
}

export function StatCard({
  label,
  value,
  valueTone = "default",
  icon: Icon,
  iconTone,
  badge,
  badgeTone,
  footnote,
  footnoteIcon: FootnoteIcon,
  footnoteTone,
}: StatCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${ICON_TILE[iconTone]}`}
        >
          <Icon className="h-5.5 w-5.5" aria-hidden />
        </span>
        <span
          className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${BADGE[badgeTone]}`}
        >
          {badge}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        <p
          className={`mt-1 text-3xl font-bold ${
            valueTone === "red" ? "text-red-600" : "text-brand-800"
          }`}
        >
          {value}
        </p>
      </div>
      <p
        className={`flex items-center gap-1.5 text-xs font-semibold ${FOOTNOTE[footnoteTone]}`}
      >
        <FootnoteIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {footnote}
      </p>
    </article>
  );
}
