"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CircleCheck,
  Lightbulb,
  Loader2,
  MapPin,
  Plus,
  Save,
  Send,
  Snowflake,
  TriangleAlert,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getMedicine, type Medicine } from "@/lib/api/medicines";
import { createTransfer, getTransfersFacets, type TransferPriority } from "@/lib/api/transfers";
import { Dropdown } from "@/components/ui/dropdown";
import { MedicinePicker } from "@/components/transfers/medicine-picker";
import { SourceBranchSnapshot } from "@/components/transfers/source-branch-snapshot";

const DESTINATION_BRANCH = "Adenta Main";
const DRAFT_KEY = "dims.transfer-draft";

interface FormLine {
  key: string;
  medicine: Medicine;
  quantity: string;
  error?: string;
}

function newKey(): string {
  return Math.random().toString(36).slice(2);
}

const PRIORITY_OPTIONS: { value: TransferPriority; label: string; icon: LucideIcon }[] = [
  { value: "standard", label: "Standard", icon: MapPin },
  { value: "express", label: "Express", icon: Zap },
  { value: "critical", label: "Critical", icon: TriangleAlert },
];

export function CreateTransferForm() {
  const router = useRouter();
  const [branches, setBranches] = useState<string[]>([]);
  const [sourceBranch, setSourceBranch] = useState<string | null>(null);
  const [lines, setLines] = useState<FormLine[]>([]);
  const [priority, setPriority] = useState<TransferPriority>("standard");
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getTransfersFacets(controller.signal)
      .then((facets) => setBranches(facets.branches.filter((b) => b !== DESTINATION_BRANCH)))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Restore a saved draft on mount — re-fetches each medicine so quantities
  // shown reflect current stock rather than a stale snapshot.
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    let draft: {
      sourceBranch: string | null;
      lines: { medicineId: string; quantity: string }[];
      priority: TransferPriority;
      requestedDeliveryDate: string;
      notes: string;
      savedAt: number;
    };
    try {
      draft = JSON.parse(raw);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    const controller = new AbortController();
    Promise.all(
      draft.lines.map((l) =>
        getMedicine(l.medicineId, controller.signal)
          .then((medicine): FormLine => ({ key: newKey(), medicine, quantity: l.quantity }))
          .catch(() => null),
      ),
    ).then((restoredLines) => {
      const valid = restoredLines.filter((l): l is FormLine => l !== null);
      if (valid.length === 0) return;
      setSourceBranch(draft.sourceBranch);
      setLines(valid);
      setPriority(draft.priority);
      setRequestedDeliveryDate(draft.requestedDeliveryDate);
      setNotes(draft.notes);
      setDraftSavedAt(draft.savedAt);
      setDraftRestored(true);
    });
    return () => controller.abort();
  }, []);

  function addLine(medicine: Medicine) {
    setLines((prev) => [...prev, { key: newKey(), medicine, quantity: "" }]);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function setLineQuantity(key: string, quantity: string) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity, error: undefined } : l)));
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setSourceBranch(null);
    setLines([]);
    setPriority("standard");
    setRequestedDeliveryDate("");
    setNotes("");
    setDraftRestored(false);
    setDraftSavedAt(null);
  }

  function handleSaveDraft() {
    setSavingDraft(true);
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        sourceBranch,
        lines: lines.map((l) => ({ medicineId: l.medicine.id, quantity: l.quantity })),
        priority,
        requestedDeliveryDate,
        notes,
        savedAt: Date.now(),
      }),
    );
    window.setTimeout(() => setSavingDraft(false), 1200);
  }

  function validateLines(): { valid: FormLine[]; hasErrors: boolean } {
    let hasErrors = false;
    const withErrors = lines.map((l) => {
      const qty = Number(l.quantity);
      let error: string | undefined;
      if (!l.quantity) error = "Enter a quantity.";
      else if (qty <= 0) error = "Must be greater than zero.";
      else if (qty > l.medicine.quantity) error = `Only ${l.medicine.quantity.toLocaleString()} available.`;
      if (error) hasErrors = true;
      return { ...l, error };
    });
    setLines(withErrors);
    return { valid: withErrors.filter((l) => !l.error), hasErrors };
  }

  async function handleSubmit() {
    setFormError(null);
    if (!sourceBranch) {
      setFormError("Select a source branch.");
      return;
    }
    if (lines.length === 0) {
      setFormError("Add at least one medicine to request.");
      return;
    }
    const { hasErrors } = validateLines();
    if (hasErrors) return;

    setSubmitting(true);
    let succeeded = 0;
    for (const line of lines) {
      try {
        await createTransfer({
          medicineId: line.medicine.id,
          destinationBranch: DESTINATION_BRANCH,
          quantity: Number(line.quantity),
          priority,
          requestedDeliveryDate: requestedDeliveryDate || undefined,
          notes: notes.trim() || undefined,
        });
        succeeded++;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to submit this request.";
        setFormError(
          succeeded > 0
            ? `Created ${succeeded} of ${lines.length} requests. "${line.medicine.name}" failed: ${message}. The successful ones are already saved — check Transfer Requests.`
            : `"${line.medicine.name}" failed: ${message}`,
        );
        setSubmitting(false);
        return;
      }
    }

    localStorage.removeItem(DRAFT_KEY);
    router.push("/dashboard/transfers");
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-brand-800">Create Transfer Request</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Request movement of medicines between branches to maintain optimal stock levels.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-lg font-bold text-brand-800">Transfer Information</h2>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
              New Draft
            </span>
          </div>

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {formError}
            </div>
          )}

          {draftRestored && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700">
              <span>
                {`Restored your saved draft${
                  draftSavedAt
                    ? ` from ${new Date(draftSavedAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""
                }.`}
              </span>
              <button
                type="button"
                onClick={discardDraft}
                className="flex items-center gap-1 font-semibold text-brand-700 hover:underline"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Discard
              </button>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="source-branch" className="block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Source Branch
              </label>
              <div id="source-branch" className="mt-2">
                <Dropdown
                  label="Select Source Branch"
                  value={sourceBranch}
                  options={branches}
                  onChange={(v) => {
                    setSourceBranch(v);
                    setLines([]);
                  }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Destination Branch
              </p>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-semibold text-zinc-500">
                <MapPin className="h-4 w-4 text-zinc-400" aria-hidden />
                {DESTINATION_BRANCH} (Current)
              </div>
            </div>
          </div>

          <section className="flex flex-col gap-4">
            <h3 className="border-l-2 border-brand-600 pl-2.5 text-base font-bold text-brand-800">
              Medicine Details
            </h3>

            {lines.length === 0 && (
              <p className="text-sm text-zinc-400">
                {sourceBranch
                  ? "Search for a medicine below to add it to this request."
                  : "Choose a source branch to start adding medicines."}
              </p>
            )}

            {lines.map((line) => (
              <div key={line.key} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 font-bold text-zinc-800">
                      {`${line.medicine.name} ${line.medicine.strength}`.trim()}
                      {line.medicine.stockCategory === "cold-chain" && (
                        <span className="flex items-center gap-0.5 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700">
                          <Snowflake className="h-2.5 w-2.5" aria-hidden />
                          Cold Chain
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {line.medicine.batchNo} · {line.medicine.quantity.toLocaleString()} available
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    aria-label={`Remove ${line.medicine.name}`}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <input
                      type="number"
                      min={1}
                      max={line.medicine.quantity}
                      value={line.quantity}
                      onChange={(e) => setLineQuantity(line.key, e.target.value)}
                      placeholder="Quantity"
                      aria-invalid={Boolean(line.error)}
                      className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 aria-[invalid=true]:border-red-400"
                    />
                    {line.error && <p className="mt-1 text-xs text-red-600">{line.error}</p>}
                  </div>
                  <span className="flex items-center rounded-lg bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-500">
                    {line.medicine.unitOfMeasurement}
                  </span>
                </div>
              </div>
            ))}

            <MedicinePicker
              branch={sourceBranch}
              excludeIds={lines.map((l) => l.medicine.id)}
              onSelect={addLine}
            />

            {lines.length > 0 && (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                <Plus className="h-4 w-4" aria-hidden />
                Search above to add another medicine
              </p>
            )}
          </section>

          <section className="flex flex-col gap-5">
            <h3 className="border-l-2 border-brand-600 pl-2.5 text-base font-bold text-brand-800">
              Transfer Logistics
            </h3>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                Priority Level
              </p>
              <div className="grid grid-cols-3 gap-3" role="group" aria-label="Priority level">
                {PRIORITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = priority === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPriority(opt.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border-2 py-3 text-sm font-semibold transition-colors ${
                        active
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="delivery-date" className="block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Requested Delivery Date
              </label>
              <input
                id="delivery-date"
                type="date"
                value={requestedDeliveryDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setRequestedDeliveryDate(e.target.value)}
                className="mt-2 w-full max-w-xs rounded-lg border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wide text-zinc-500">
                Internal Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention reasons for transfer or special handling instructions…"
                rows={3}
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white p-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-6">
            <Link
              href="/dashboard/transfers"
              className="flex items-center gap-2 rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <X className="h-4 w-4" aria-hidden />
              Cancel
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg border border-brand-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="h-4 w-4" aria-hidden />
                {savingDraft ? "Draft Saved" : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <aside className="rounded-2xl bg-brand-50 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-brand-800">
              <CircleCheck className="h-5 w-5 text-brand-600" aria-hidden />
              Transfer Guidelines
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm leading-6 text-brand-800">
              <li className="flex items-start gap-2.5">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                Verify medicine availability in the source branch before submission — quantities above
                what&apos;s in stock will be rejected.
              </li>
              <li className="flex items-start gap-2.5">
                <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
                Temperature-sensitive items are flagged &ldquo;Cold Chain&rdquo; automatically when you
                search for them.
              </li>
              <li className="flex items-start gap-2.5">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                Requests made after 4:00 PM are typically processed the next business day.
              </li>
            </ul>

            <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-white/60 p-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              <p className="text-xs leading-5 text-brand-800">
                <span className="font-bold">Pro tip:</span> Add multiple medicines to one draft to
                cut down on repeat submissions — each still gets tracked and approved individually.
              </p>
            </div>
          </aside>

          {sourceBranch && <SourceBranchSnapshot branch={sourceBranch} />}
        </div>
      </div>
    </div>
  );
}
