import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  Pill,
  TrendingDown,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

interface ReportEntry {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  cta: string;
}

const REPORTS: ReportEntry[] = [
  {
    title: "Medicine Expiry Risk Report",
    description: "Printable, exportable audit of stock approaching expiration with recommended mitigation actions.",
    href: "/reports/expiry-risk",
    icon: CalendarClock,
    cta: "Open PDF Report",
  },
  {
    title: "Medicines Inventory Export",
    description: "Full medicines list — stock levels, batches, and expiry dates — exportable as CSV.",
    href: "/dashboard/medicines",
    icon: Pill,
    cta: "Go to Medicines List",
  },
  {
    title: "Restocking Recommendations",
    description: "Predicted stock-outs and recommended reorder quantities by branch, exportable as CSV.",
    href: "/dashboard/low-stock",
    icon: TrendingDown,
    cta: "Go to Low-Stock Predictions",
  },
  {
    title: "System Users Export",
    description: "Roles, branch assignments, and account status across the network, exportable as CSV.",
    href: "/dashboard/users",
    icon: UsersRound,
    cta: "Go to User Management",
  },
];

export function ReportsPageClient() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-brand-800">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Every report the system can generate, in one place.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300"
            >
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5.5 w-5.5" aria-hidden />
                </span>
                <div>
                  <p className="font-bold text-zinc-800">{report.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{report.description}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-transform group-hover:translate-x-1">
                {report.cta}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>

      <p className="flex items-center gap-2 text-xs text-zinc-400">
        <FileText className="h-3.5 w-3.5" aria-hidden />
        CSV exports run from each report&apos;s own page, scoped to whatever filters you have applied there.
      </p>
    </div>
  );
}
