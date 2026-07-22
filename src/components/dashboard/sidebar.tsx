"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CalendarClock,
  ClipboardPlus,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Pill,
  Settings,
  TrendingDown,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Medicines List", href: "/dashboard/medicines", icon: Pill },
  { label: "Add/Edit Medicine", href: "/dashboard/medicines/manage", icon: ClipboardPlus },
  { label: "Expiry Risk Dashboard", href: "/dashboard/expiry-risk", icon: CalendarClock },
  { label: "Low-Stock Predictions", href: "/dashboard/low-stock", icon: TrendingDown },
  { label: "Transfer Requests", href: "/dashboard/transfers", icon: ArrowLeftRight },
  { label: "Create Transfer Request", href: "/dashboard/transfers/new", icon: PackagePlus },
  { label: "User Management", href: "/dashboard/users", icon: UsersRound },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-700 text-white before:absolute before:inset-y-1 before:-left-3 before:w-1 before:rounded-full before:bg-amber-400"
          : "text-brand-200 hover:bg-brand-700/60 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    // Longest-prefix match so /dashboard/medicines/manage doesn't also
    // highlight /dashboard/medicines.
    const deeper = NAV_ITEMS.some(
      (other) =>
        other.href.length > item.href.length &&
        other.href.startsWith(item.href) &&
        (pathname === other.href || pathname.startsWith(`${other.href}/`)),
    );
    return (
      !deeper &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`))
    );
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-brand-800">
      <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <Image src="/logo-dark.png" alt="" width={56} height={56} className="rounded-lg" />
        </div>
        <p className="text-center text-xs font-bold uppercase tracking-[0.15em] text-white">
          Direct Pharmacy Manager
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item)} />
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 px-3 py-4">
        <NavLink
          item={{ label: "Settings", href: "/dashboard/settings", icon: Settings }}
          active={pathname.startsWith("/dashboard/settings")}
        />
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-200 transition-colors hover:bg-brand-700/60 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          Logout
        </Link>
      </div>
    </aside>
  );
}
