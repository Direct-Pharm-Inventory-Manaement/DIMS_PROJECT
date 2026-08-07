"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CircleCheck,
  CircleX,
  Loader2,
  PackageCheck,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  approveTransfer,
  completeTransfer,
  rejectTransfer,
  type Transfer,
} from "@/lib/api/transfers";
import { RequesterAvatar } from "@/components/transfers/requester-avatar";
import { STATUS_BADGE } from "@/components/transfers/status-badge";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TransferDetailModal({
  transfer,
  onClose,
  onUpdated,
}: {
  transfer: Transfer;
  onClose: () => void;
  onUpdated: (updated: Transfer) => void;
}) {
  const [pending, setPending] = useState<"approve" | "reject" | "complete" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setError(null);
    setPending("approve");
    try {
      onUpdated(await approveTransfer(transfer.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to approve request.");
    } finally {
      setPending(null);
    }
  }

  async function handleReject() {
    setError(null);
    setPending("reject");
    try {
      onUpdated(await rejectTransfer(transfer.id, reviewNote));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reject request.");
    } finally {
      setPending(null);
    }
  }

  async function handleComplete() {
    setError(null);
    setPending("complete");
    try {
      onUpdated(await completeTransfer(transfer.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to complete transfer.");
    } finally {
      setPending(null);
    }
  }

  const badge = STATUS_BADGE[transfer.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              {transfer.code}
            </p>
            <h2 id="transfer-modal-title" className="mt-1 text-xl font-bold text-brand-800">
              {transfer.medicineName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <span
          className={`mt-3 inline-block rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.classes}`}
        >
          {badge.label}
        </span>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Batch No.
            </p>
            <p className="mt-0.5 font-medium text-zinc-700">{transfer.batchNo}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Quantity
            </p>
            <p className="mt-0.5 font-bold text-zinc-800">{transfer.quantity.toLocaleString()}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Route</p>
            <p className="mt-0.5 flex items-center gap-2 font-medium text-zinc-700">
              {transfer.sourceBranch}
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
              {transfer.destinationBranch}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Requested By
            </p>
            <p className="mt-1 flex items-center gap-2 font-medium text-zinc-700">
              <RequesterAvatar name={transfer.requestedBy.name} />
              {transfer.requestedBy.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Date</p>
            <p className="mt-0.5 font-medium text-zinc-700">{formatDate(transfer.createdAt)}</p>
          </div>
          {transfer.reviewNote && (
            <div className="col-span-2 rounded-lg bg-zinc-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Review Note
              </p>
              <p className="mt-0.5 text-zinc-600">{transfer.reviewNote}</p>
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {transfer.status === "pending" && (
          <div className="mt-5 flex flex-col gap-3 border-t border-zinc-100 pt-5">
            {rejecting && (
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Reason for rejecting (optional)…"
                rows={2}
                className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            )}
            <div className="flex items-center justify-end gap-3">
              {!rejecting ? (
                <>
                  <button
                    type="button"
                    onClick={() => setRejecting(true)}
                    disabled={pending !== null}
                    className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CircleX className="h-4 w-4" aria-hidden />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={pending !== null}
                    className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {pending === "approve" ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <CircleCheck className="h-4 w-4" aria-hidden />
                    )}
                    Approve
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setRejecting(false)}
                    disabled={pending !== null}
                    className="rounded-lg px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={pending !== null}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {pending === "reject" ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <CircleX className="h-4 w-4" aria-hidden />
                    )}
                    Confirm Rejection
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {transfer.status === "approved" && (
          <div className="mt-5 flex items-center justify-end border-t border-zinc-100 pt-5">
            <button
              type="button"
              onClick={handleComplete}
              disabled={pending !== null}
              className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending === "complete" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <PackageCheck className="h-4 w-4" aria-hidden />
              )}
              Mark Completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
