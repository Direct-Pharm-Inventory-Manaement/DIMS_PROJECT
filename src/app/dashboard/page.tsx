import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard — Direct Inventory Manager",
  description: "Direct Inventory Manager reporting dashboard.",
};

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-100 px-4 text-center">
      <Image src="/logo-dark.png" alt="" width={64} height={64} className="rounded-xl" />
      <div className="flex items-center gap-2 text-brand-600">
        <LayoutDashboard className="h-6 w-6" aria-hidden />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <p className="max-w-md text-sm leading-6 text-zinc-500">
        You&apos;re signed in. The reporting dashboard — stock levels, expiry
        risk, transfers, and low-stock predictions — is being built next.
      </p>
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Back to Sign In
      </Link>
    </div>
  );
}
