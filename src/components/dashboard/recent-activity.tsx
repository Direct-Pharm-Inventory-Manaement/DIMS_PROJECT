import { CircleDot } from "lucide-react";
import type { ActivityItem } from "@/lib/mock/dashboard-data";

const TONE: Record<ActivityItem["tone"], string> = {
  blue: "text-brand-500",
  amber: "text-amber-500",
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-brand-800">Recent Activity</h2>
      <ol className="mt-4 flex flex-col">
        {items.map((item, index) => (
          <li key={item.title} className="relative flex gap-3 pb-5 last:pb-0">
            {index < items.length - 1 && (
              <span
                className="absolute left-[9px] top-6 bottom-0 w-px bg-zinc-200"
                aria-hidden
              />
            )}
            <CircleDot
              className={`relative z-10 mt-0.5 h-5 w-5 shrink-0 bg-white ${TONE[item.tone]}`}
              aria-hidden
            />
            <div>
              <h3 className="text-sm font-bold text-zinc-800">{item.title}</h3>
              <p className="mt-0.5 text-xs leading-5 text-zinc-400">
                {item.detail}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-brand-500">
                {item.timeAgo}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
