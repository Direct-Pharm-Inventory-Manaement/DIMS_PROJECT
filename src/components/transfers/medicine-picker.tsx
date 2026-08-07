"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Snowflake } from "lucide-react";
import { listMedicines, type Medicine } from "@/lib/api/medicines";

export function MedicinePicker({
  branch,
  excludeIds,
  onSelect,
  disabled,
}: {
  branch: string | null;
  /** Already-picked medicine ids in other line rows, hidden from results. */
  excludeIds: string[];
  onSelect: (medicine: Medicine) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keyed by the query that was actually searched, so "loading" and
  // "results" are derived instead of reset with a synchronous setState at
  // the top of the effect (which the React Compiler forbids).
  const [answered, setAnswered] = useState<{ key: string; results: Medicine[] } | null>(null);
  const trimmed = query.trim();
  const searchKey = `${branch ?? ""}::${trimmed}`;
  const searchable = Boolean(branch) && trimmed.length >= 2;
  const results = searchable && answered?.key === searchKey ? answered.results : [];
  const loading = searchable && answered?.key !== searchKey;

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      listMedicines({ branch: branch!, search: trimmed, pageSize: 8 }, controller.signal)
        .then((data) => {
          setAnswered({ key: searchKey, results: data.items.filter((m) => !excludeIds.includes(m.id)) });
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setAnswered({ key: searchKey, results: [] });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // excludeIds intentionally omitted: re-filtering shouldn't re-trigger the network request
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, trimmed, searchable, searchKey]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <input
          value={query}
          disabled={disabled || !branch}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={branch ? "Start typing name or batch no…" : "Select a source branch first"}
          className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:bg-zinc-50"
        />
      </div>

      {open && searchable && (
        <ul className="absolute z-20 mt-1.5 max-h-72 w-full min-w-[320px] overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg">
          {loading && (
            <li className="px-4 py-3 text-sm text-zinc-400">Searching…</li>
          )}
          {!loading && results.length === 0 && (
            <li className="px-4 py-3 text-sm text-zinc-400">
              No medicines matching &ldquo;{query}&rdquo; at {branch}.
            </li>
          )}
          {!loading &&
            results.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(m);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-zinc-50"
                >
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                      {`${m.name} ${m.strength}`.trim()}
                      {m.stockCategory === "cold-chain" && (
                        <span className="flex items-center gap-0.5 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700">
                          <Snowflake className="h-2.5 w-2.5" aria-hidden />
                          Cold Chain
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-zinc-400">{m.batchNo}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-zinc-500">
                    {m.quantity.toLocaleString()} avail.
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
