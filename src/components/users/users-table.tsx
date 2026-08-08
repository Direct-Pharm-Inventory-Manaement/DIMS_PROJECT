"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Pencil,
  ShieldOff,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  listUsers,
  setUserStatus,
  type ListUsersParams,
  type ListUsersResult,
  type SystemUser,
} from "@/lib/api/users";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Dropdown } from "@/components/ui/dropdown";
import { ROLE_BADGE, StatusDot } from "@/components/users/badges";

const PAGE_SIZE = 4;
const EXPORT_PAGE_SIZE = 500;

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function exportCsv(rows: SystemUser[]) {
  const header = ["Name", "Username", "Email", "Role", "Branch", "Status", "Last Login"];
  const lines = rows.map((u) =>
    [
      u.name,
      u.username,
      u.email,
      ROLE_BADGE[u.role].label,
      u.branch,
      u.status,
      u.lastLoginAt ?? "Never",
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
  anchor.download = "system-users.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function UsersTable({
  filters,
  refreshId,
  branches,
  onEdit,
  onMutated,
  tabs,
}: {
  filters: Omit<ListUsersParams, "page" | "pageSize">;
  refreshId: number;
  branches: string[];
  onEdit: (user: SystemUser) => void;
  onMutated: () => void;
  /** Rendered beside the "User Directory" title — role tabs from the page client. */
  tabs: ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportRequestId, setExportRequestId] = useState(0);
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const effectiveFilters = { ...filters, branch: branchFilter ?? undefined };

  const [answered, setAnswered] = useState<{
    key: string;
    data: ListUsersResult | null;
    error: string | null;
  } | null>(null);

  const queryKey = JSON.stringify({ ...effectiveFilters, page, refreshId });
  const isCurrent = answered?.key === queryKey;
  const result = isCurrent ? answered.data : null;
  const error = isCurrent ? answered.error : null;
  const loading = !isCurrent;

  useEffect(() => {
    const controller = new AbortController();
    listUsers({ ...effectiveFilters, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((data) => setAnswered({ key: queryKey, data, error: null }))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAnswered({
          key: queryKey,
          data: null,
          error: err instanceof ApiError ? err.message : "Something went wrong loading users.",
        });
      });
    return () => controller.abort();
    // queryKey (derived from effectiveFilters/page/refreshId) is the real
    // dependency — effectiveFilters is a fresh object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => {
    if (!filterOpen) return;
    function onClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [filterOpen]);

  const lastExportHandled = useRef(0);
  useEffect(() => {
    if (exportRequestId <= lastExportHandled.current) return;
    lastExportHandled.current = exportRequestId;
    listUsers({ ...effectiveFilters, page: 1, pageSize: EXPORT_PAGE_SIZE })
      .then((data) => exportCsv(data.items))
      .catch(() => {});
    // effectiveFilters intentionally omitted from deps below via inline recompute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportRequestId]);

  async function toggleStatus(user: SystemUser) {
    setStatusChangingId(user.id);
    try {
      await setUserStatus(user.id, user.status === "active" ? "suspended" : "active");
      onMutated();
    } catch {
      // Table refetch on next interaction will reflect true state; a full
      // error surface here would need per-row error UI not worth the size.
    } finally {
      setStatusChangingId(null);
    }
  }

  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = result?.items ?? [];

  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-brand-800">User Directory</h2>
          {tabs}
        </div>
        <div className="flex items-center gap-1">
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              aria-label="Filter by branch"
              aria-pressed={filterOpen}
              onClick={() => setFilterOpen((v) => !v)}
              className={`rounded-lg p-2 transition-colors ${
                filterOpen || branchFilter
                  ? "bg-brand-50 text-brand-600"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              }`}
            >
              <SlidersHorizontal className="h-4.5 w-4.5" aria-hidden />
            </button>
            {filterOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Branch
                </p>
                <Dropdown
                  label="All Branches"
                  value={branchFilter}
                  options={branches}
                  onChange={(v) => {
                    setBranchFilter(v);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Export as CSV"
            onClick={() => setExportRequestId((id) => id + 1)}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <Download className="h-4.5 w-4.5" aria-hidden />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 overflow-x-auto px-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              <th scope="col" className="py-3 pr-4">Name</th>
              <th scope="col" className="py-3 pr-4">Username</th>
              <th scope="col" className="py-3 pr-4">Role</th>
              <th scope="col" className="py-3 pr-4">Branch</th>
              <th scope="col" className="py-3 pr-4">Status</th>
              <th scope="col" className="py-3 pr-4">Last Login</th>
              <th scope="col" className="py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: PAGE_SIZE }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }, (_, col) => (
                    <td key={col} className="py-4 pr-4">
                      <div className="h-4 animate-pulse rounded bg-zinc-200/80" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              rows.map((u) => {
                const badge = ROLE_BADGE[u.role];
                return (
                  <tr key={u.id}>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={u.name} />
                        <div>
                          <p className="font-bold text-zinc-800">{u.name}</p>
                          <p className="text-xs text-zinc-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-mono text-xs text-zinc-500">{u.username}</td>
                    <td className="py-4 pr-4">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-zinc-600">{u.branch}</td>
                    <td className="py-4 pr-4">
                      <StatusDot status={u.status} online={u.online} />
                    </td>
                    <td className="py-4 pr-4 text-zinc-500">{formatLastLogin(u.lastLoginAt)}</td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(u)}
                          aria-label={`Edit ${u.name}`}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(u)}
                          disabled={statusChangingId === u.id}
                          aria-label={u.status === "active" ? `Suspend ${u.name}` : `Reactivate ${u.name}`}
                          className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed ${
                            u.status === "active"
                              ? "text-zinc-400 hover:bg-red-50 hover:text-red-600"
                              : "text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600"
                          }`}
                        >
                          {statusChangingId === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : u.status === "active" ? (
                            <ShieldOff className="h-4 w-4" aria-hidden />
                          ) : (
                            <ShieldCheck className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-zinc-400">
                  No users match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {loading
            ? "Loading…"
            : total === 0
              ? "Showing 0 of 0 users"
              : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, total)} of ${total} users`}
        </p>
        <nav className="flex items-center gap-1.5" aria-label="Pagination">
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage === 1 || loading}
            onClick={() => setPage(currentPage - 1)}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .slice(0, 3)
            .map((p) => (
              <button
                key={p}
                type="button"
                aria-current={p === currentPage ? "page" : undefined}
                disabled={loading}
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                  p === currentPage ? "bg-brand-700 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {p}
              </button>
            ))}
          {pageCount > 3 && <span className="px-1 text-zinc-400">…</span>}
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage === pageCount || loading}
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
