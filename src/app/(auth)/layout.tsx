import Link from "next/link";
import { version } from "../../../package.json";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="bg-brand-800 text-brand-100">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-6 py-4 text-xs font-medium tracking-wide sm:flex-row">
          <p className="uppercase">
            {`© ${new Date().getFullYear()} Direct Pharmacy – Inventory Management System v${version}`}
          </p>
          <nav className="flex items-center gap-6 uppercase">
            <Link href="#" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Security Compliance
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Support Center
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
