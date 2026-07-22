import { Construction } from "lucide-react";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-brand-800">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Monitor the health of Direct Pharmacy operations.
        </p>
      </header>
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-24 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Construction className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="text-lg font-bold text-zinc-800">
          This module is under construction
        </h2>
        <p className="max-w-sm text-sm leading-6 text-zinc-500">
          {title} is being built next. It will appear here as soon as it&apos;s
          ready.
        </p>
      </div>
    </div>
  );
}
