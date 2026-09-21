"use client";

import { useState } from "react";
import { AlertTriangle, Info, Loader2, Trash2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { deleteUser, type SystemUser } from "@/lib/api/users";
import { ROLE_BADGE } from "@/components/users/badges";

export function DeleteUserModal({
  user,
  onClose,
  onDeleted,
}: {
  user: SystemUser;
  onClose: () => void;
  onDeleted: (user: SystemUser) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteUser(user.id);
      onDeleted(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete user.");
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-user-title"
      onClick={() => !deleting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </span>
        <h2 id="delete-user-title" className="mt-4 text-xl font-bold text-zinc-900">
          Delete User?
        </h2>
        <p className="mt-1.5 text-sm text-zinc-500">
          Are you sure you want to delete <span className="font-semibold text-zinc-700">{user.name}</span>?
        </p>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-zinc-50 p-4 text-left text-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Username</p>
            <p className="mt-0.5 font-semibold text-zinc-800">{user.username}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Role</p>
            <p className="mt-0.5 font-semibold text-zinc-800">{ROLE_BADGE[user.role].label}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Branch</p>
            <p className="mt-0.5 font-semibold text-zinc-800">{user.branch}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Email</p>
            <p className="mt-0.5 truncate font-semibold text-zinc-800">{user.email}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-left text-sm font-medium text-red-700">
          <Info className="h-4 w-4 shrink-0" aria-hidden />
          This action cannot be undone. Users with real transfer or report history can&apos;t be deleted — suspend them instead.
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-left text-sm text-red-700"
          >
            <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
