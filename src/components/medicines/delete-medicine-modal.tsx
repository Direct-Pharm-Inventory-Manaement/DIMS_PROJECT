"use client";

import { useState } from "react";
import { AlertTriangle, Info, Loader2, Trash2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { deleteMedicine, type Medicine } from "@/lib/api/medicines";

export function DeleteMedicineModal({
  medicine,
  onClose,
  onDeleted,
}: {
  medicine: Medicine;
  onClose: () => void;
  onDeleted: (medicine: Medicine) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteMedicine(medicine.id);
      onDeleted(medicine);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete medicine.");
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-medicine-title"
      onClick={() => !deleting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </span>
        <h2 id="delete-medicine-title" className="mt-4 text-xl font-bold text-zinc-900">
          Delete Medicine?
        </h2>
        <p className="mt-1.5 text-sm text-zinc-500">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-zinc-700">
            {`${medicine.name} ${medicine.strength}`.trim()}
          </span>
          ?
        </p>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-zinc-50 p-4 text-left text-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Medicine
            </p>
            <p className="mt-0.5 font-semibold text-zinc-800">
              {`${medicine.name} ${medicine.strength}`.trim()}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Batch
            </p>
            <p className="mt-0.5 font-semibold text-zinc-800">{medicine.batchNo}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Branch
            </p>
            <p className="mt-0.5 font-semibold text-zinc-800">{medicine.branch}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              Quantity
            </p>
            <p className="mt-0.5 font-semibold text-zinc-800">
              {medicine.quantity.toLocaleString()} units
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-left text-sm font-medium text-red-700">
          <Info className="h-4 w-4 shrink-0" aria-hidden />
          This action cannot be undone.
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
                Delete Medicine
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
