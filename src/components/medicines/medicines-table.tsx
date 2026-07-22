"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  BRANCHES,
  CATEGORIES,
  MEDICINES,
  type Medicine,
  type MedicineStatus,
} from "@/lib/mock/medicines-data";

const PAGE_SIZE = 5;

type StatusFilter = "all" | MedicineStatus;

const FILTER_CHIPS: { value: StatusFilter; label: string; dot?: string }[] = [
  { value: "all", label: "All Items" },
  { value: "in-stock", label: "Available" },
  { value: "low-stock", label: "Low Stock", dot: "bg-amber-400" },
  { value: "critical-expiry", label: "Expiring Soon", dot: "bg-red-500" },
  { value: "out-of-stock", label: "Out of Stock" },
];

const STATUS_BADGE: Record<MedicineStatus, { label: string; classes: string }> = {
  "in-stock": { label: "In Stock", classes: "bg-emerald-100 text-emerald-700" },
  "low-stock": { label: "Low Stock", classes: "bg-amber-100 text-amber-700" },
  "critical-expiry": { label: "Critical Exp.", classes: "bg-red-100 text-red-600" },
  "out-of-stock": { label: "Out of Stock", classes: "bg-red-100 text-red-500" },
};

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly string[];
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
          value
            ? "border-brand-500 bg-brand-50 text-brand-700"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
        }`}
      >
        {value ?? label}
        <ChevronDown className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg"
        >
          <li>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm font-medium text-zinc-500 hover:bg-zinc-50"
            >
              {label}
            </button>
          </li>
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-zinc-50 ${
                  value === option ? "text-brand-700" : "text-zinc-700"
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function exportCsv(rows: Medicine[]) {
  const header = [
    "Medicine",
    "Category",
    "Batch No.",
    "Branch",
    "Quantity",
    "Unit Price (GHS)",
    "Expiry Date",
    "Status",
  ];
  const lines = rows.map((m) =>
    [
      `${m.name} ${m.strength}`.trim(),
      m.category,
      m.batchNo,
      m.branch,
      m.quantity,
      m.unitPriceGhs.toFixed(2),
      m.expiryDate,
      STATUS_BADGE[m.status].label,
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "medicines-list.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function MedicinesTable({
  exportRequestId,
}: {
  /** Increment to trigger a CSV export of the currently filtered rows. */
  exportRequestId: number;
}) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      MEDICINES.filter(
        (m) =>
          (status === "all" || m.status === status) &&
          (!category || m.category === category) &&
          (!branch || m.branch === branch),
      ),
    [status, category, branch],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const lastExportHandled = useRef(0);
  useEffect(() => {
    if (exportRequestId > lastExportHandled.current) {
      lastExportHandled.current = exportRequestId;
      exportCsv(filtered);
    }
  }, [exportRequestId, filtered]);

  function applyFilter(setter: () => void) {
    setter();
    setPage(1);
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              aria-pressed={status === chip.value}
              onClick={() => applyFilter(() => setStatus(chip.value))}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                status === chip.value
                  ? "bg-brand-700 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {chip.label}
              {chip.dot && (
                <span className={`h-2 w-2 rounded-full ${chip.dot}`} aria-hidden />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Dropdown
            label="All Categories"
            value={category}
            options={CATEGORIES}
            onChange={(v) => applyFilter(() => setCategory(v))}
          />
          <Dropdown
            label="All Branches"
            value={branch}
            options={BRANCHES}
            onChange={(v) => applyFilter(() => setBranch(v))}
          />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-brand-50/60 text-xs font-bold uppercase tracking-wide text-brand-700">
              <th scope="col" className="rounded-l-lg py-3.5 pl-4 pr-4">Medicine</th>
              <th scope="col" className="py-3.5 pr-4">Category</th>
              <th scope="col" className="py-3.5 pr-4">Batch No.</th>
              <th scope="col" className="py-3.5 pr-4">Branch</th>
              <th scope="col" className="py-3.5 pr-4">Quantity</th>
              <th scope="col" className="py-3.5 pr-4">Unit Price</th>
              <th scope="col" className="py-3.5 pr-4">Expiry Date</th>
              <th scope="col" className="py-3.5 pr-4">Status</th>
              <th scope="col" className="rounded-r-lg py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((m, index) => (
              <tr
                key={m.id}
                className={index % 2 === 1 ? "bg-brand-50/40" : undefined}
              >
                <td className="py-4 pl-4 pr-4">
                  <p className="font-bold text-zinc-800">
                    {m.name} {m.strength}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {m.form} • {m.packaging}
                  </p>
                </td>
                <td className="py-4 pr-4 text-zinc-600">{m.category}</td>
                <td className="py-4 pr-4 text-zinc-500">{m.batchNo}</td>
                <td className="py-4 pr-4 text-zinc-600">{m.branch}</td>
                <td
                  className={`py-4 pr-4 font-bold tabular-nums ${
                    m.quantity === 0
                      ? "text-red-600"
                      : m.status === "low-stock"
                        ? "text-amber-600"
                        : "text-zinc-800"
                  }`}
                >
                  {m.quantity.toLocaleString()}
                </td>
                <td className="py-4 pr-4 tabular-nums text-zinc-600">
                  GH₵ {m.unitPriceGhs.toFixed(2)}
                </td>
                <td
                  className={`py-4 pr-4 ${
                    m.status === "critical-expiry"
                      ? "font-bold text-red-600"
                      : "text-zinc-600"
                  }`}
                >
                  {m.expiryDate}
                </td>
                <td className="py-4 pr-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_BADGE[m.status].classes}`}
                  >
                    {STATUS_BADGE[m.status].label}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-1">
                    <Link
                      href="/dashboard/medicines/manage"
                      aria-label={`Edit ${m.name}`}
                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Link>
                    <button
                      type="button"
                      aria-label={`Delete ${m.name}`}
                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-zinc-400">
                  No medicines match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
        <p className="text-sm text-zinc-500">
          {filtered.length === 0
            ? "Showing 0 entries"
            : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                currentPage * PAGE_SIZE,
                filtered.length,
              )} of ${filtered.length} entries`}
        </p>
        <nav className="flex items-center gap-1.5" aria-label="Pagination">
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              aria-current={p === currentPage ? "page" : undefined}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                p === currentPage
                  ? "bg-brand-700 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      </div>
    </section>
  );
}
