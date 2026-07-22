import { Bell, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex items-center justify-between gap-6 border-b border-zinc-200 bg-white px-6 py-3.5">
      <div className="relative w-full max-w-md">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search inventory, transfers, or logs..."
          aria-label="Search"
          className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
        />
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <p className="hidden text-right text-sm font-bold leading-tight text-brand-600 md:block">
          Direct Pharmacy – Adenta
          <br />
          Branch
        </p>
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        >
          <Bell className="h-5 w-5" aria-hidden />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
            aria-hidden
          />
        </button>
        <div className="flex items-center gap-3 border-l border-zinc-200 pl-5">
          <div className="text-right leading-tight">
            <p className="text-sm font-bold text-zinc-800">Admin Profile</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              System Administrator
            </p>
          </div>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white"
            aria-hidden
          >
            AP
          </span>
        </div>
      </div>
    </header>
  );
}
