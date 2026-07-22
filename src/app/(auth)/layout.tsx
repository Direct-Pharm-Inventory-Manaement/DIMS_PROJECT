import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <footer className="bg-accent-500 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-6 py-4 text-xs font-medium tracking-wide sm:flex-row">
          <p className="uppercase">
            {`© ${new Date().getFullYear()} Direct Inventory Manager`}
          </p>
          <nav className="flex items-center gap-6 uppercase text-white/85">
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
