import Link from "next/link";
import { Plus } from "lucide-react";
import { AutoLogout } from "@/components/dashboard/auto-logout";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { ToastProvider } from "@/components/ui/toast";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToastProvider>
      <AutoLogout />
      <div className="flex h-screen overflow-hidden bg-zinc-100">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        <Link
          href="/dashboard/transfers/new"
          aria-label="Create transfer request"
          className="fixed bottom-8 right-8 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg transition-colors hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </Link>
      </div>
    </ToastProvider>
  );
}
