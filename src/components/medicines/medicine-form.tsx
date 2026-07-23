"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Asterisk,
  CalendarClock,
  ChevronDown,
  CircleCheck,
  ClipboardList,
  FileText,
  Info,
  Loader2,
  Pill,
  Save,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  createMedicine,
  getMedicine,
  getMedicinesFacets,
  getMedicinesSummary,
  updateMedicine,
  type Medicine,
  type MedicineInput,
} from "@/lib/api/medicines";

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Liquid",
  "Injectable",
  "Topical",
  "Inhaler",
  "Powder",
  "Effervescent",
  "Cream",
  "Drops",
];

const UNITS_OF_MEASUREMENT = [
  "Units",
  "Boxes",
  "Bottles",
  "Blister",
  "Vial",
  "Tube",
  "Sachet",
  "Pack",
];

const MIN_EXPIRY_MONTHS_AHEAD = 6;

interface FormState {
  name: string;
  genericName: string;
  category: string;
  form: string;
  strength: string;
  manufacturer: string;
  supplier: string;
  batchNo: string;
  quantity: string;
  unitOfMeasurement: string;
  unitPriceGhs: string;
  sellingPriceGhs: string;
  branch: string;
  storageLocation: string;
  manufacturingDate: string;
  expiryDate: string;
  lowStockThreshold: string;
  reorderLevel: string;
  internalNotes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  genericName: "",
  category: "",
  form: "",
  strength: "",
  manufacturer: "",
  supplier: "",
  batchNo: "",
  quantity: "",
  unitOfMeasurement: "Units",
  unitPriceGhs: "",
  sellingPriceGhs: "",
  branch: "",
  storageLocation: "",
  manufacturingDate: "",
  expiryDate: "",
  lowStockThreshold: "",
  reorderLevel: "",
  internalNotes: "",
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function medicineToForm(m: Medicine): FormState {
  return {
    name: m.name,
    genericName: m.genericName,
    category: m.category,
    form: m.form,
    strength: m.strength,
    manufacturer: m.manufacturer === "Unspecified" ? "" : m.manufacturer,
    supplier: m.supplier,
    batchNo: m.batchNo,
    quantity: String(m.quantity),
    unitOfMeasurement: m.unitOfMeasurement,
    unitPriceGhs: String(m.unitPriceGhs),
    sellingPriceGhs: m.sellingPriceGhs === null ? "" : String(m.sellingPriceGhs),
    branch: m.branch,
    storageLocation: m.storageLocation,
    manufacturingDate: toDateInputValue(m.manufacturingDate),
    expiryDate: toDateInputValue(m.expiryDate),
    lowStockThreshold: String(m.lowStockThreshold),
    reorderLevel: m.reorderLevel === null ? "" : String(m.reorderLevel),
    internalNotes: m.internalNotes,
  };
}

function minExpiryDateValue(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + MIN_EXPIRY_MONTHS_AHEAD);
  return d.toISOString().slice(0, 10);
}

const DRAFT_KEY = "dims.medicine-draft";

function readDraft(): { form: FormState; savedAt: number } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { form: FormState; savedAt: number };
  } catch {
    localStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

type Errors = Partial<Record<keyof FormState, string>>;

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-zinc-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 aria-[invalid=true]:border-red-400";

function SelectField({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className={`${inputClass} appearance-none pr-9`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
    </div>
  );
}

function SectionHeading({ icon: Icon, children }: { icon: typeof Pill; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-lg font-bold text-brand-800">
      <Icon className="h-5 w-5 text-brand-500" aria-hidden />
      {children}
    </h2>
  );
}

export function MedicineForm({ medicineId }: { medicineId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(medicineId);

  // Lazy initializers run exactly once at mount — the right place to seed
  // from a saved draft (create mode only) without an effect.
  const [form, setForm] = useState<FormState>(() =>
    isEdit ? EMPTY_FORM : (readDraft()?.form ?? EMPTY_FORM),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"medicine" | "draft" | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(() =>
    isEdit ? null : (readDraft()?.savedAt ?? null),
  );
  const [draftRestored, setDraftRestored] = useState(() => !isEdit && readDraft() !== null);

  const [categories, setCategories] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [lastBatchNo, setLastBatchNo] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<Medicine["status"] | null>(null);
  const [systemTime] = useState(() => new Date());

  const [loadState, setLoadState] = useState<{ key: string; error: string | null } | null>(null);
  const loading = isEdit && loadState?.key !== medicineId;

  useEffect(() => {
    const controller = new AbortController();
    getMedicinesFacets(controller.signal)
      .then((facets) => {
        setCategories(facets.categories);
        setBranches(facets.branches);
      })
      .catch(() => {
        // Non-fatal: dropdowns simply stay limited to typed-in values.
      });
    getMedicinesSummary(controller.signal)
      .then((summary) => setLastBatchNo(summary.lastBatchNo))
      .catch(() => {
        // Non-fatal: Quick Summary just omits the last batch id.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!medicineId) return;
    const controller = new AbortController();
    getMedicine(medicineId, controller.signal)
      .then((medicine) => {
        setForm(medicineToForm(medicine));
        setCurrentStatus(medicine.status);
        setLoadState({ key: medicineId, error: null });
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoadState({
          key: medicineId,
          error: err instanceof ApiError ? err.message : "Failed to load medicine.",
        });
      });
    return () => controller.abort();
  }, [medicineId]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "Medicine name is required.";
    if (!form.category) next.category = "Select a category.";
    if (!form.form) next.form = "Select a dosage form.";
    if (!form.batchNo.trim()) next.batchNo = "Batch number is required.";
    if (!form.branch) next.branch = "Select a branch.";

    if (form.quantity === "") next.quantity = "Quantity is required.";
    else if (Number(form.quantity) < 0) next.quantity = "Quantity cannot be negative.";

    if (form.unitPriceGhs === "") next.unitPriceGhs = "Unit price is required.";
    else if (Number(form.unitPriceGhs) < 0) next.unitPriceGhs = "Unit price cannot be negative.";

    if (form.sellingPriceGhs !== "" && Number(form.sellingPriceGhs) < 0) {
      next.sellingPriceGhs = "Selling price cannot be negative.";
    }

    if (form.lowStockThreshold === "") next.lowStockThreshold = "Minimum stock level is required.";
    else if (Number(form.lowStockThreshold) < 0) next.lowStockThreshold = "Cannot be negative.";

    if (form.reorderLevel !== "" && Number(form.reorderLevel) < 0) {
      next.reorderLevel = "Cannot be negative.";
    }

    if (!form.expiryDate) {
      next.expiryDate = "Expiry date is required.";
    } else if (!isEdit && form.expiryDate < minExpiryDateValue()) {
      next.expiryDate = `Expiry date must be at least ${MIN_EXPIRY_MONTHS_AHEAD} months from today.`;
    }

    return next;
  }

  function buildPayload(): MedicineInput {
    return {
      name: form.name.trim(),
      genericName: form.genericName.trim(),
      strength: form.strength.trim(),
      form: form.form,
      category: form.category,
      batchNo: form.batchNo.trim(),
      branch: form.branch,
      manufacturer: form.manufacturer.trim(),
      supplier: form.supplier.trim(),
      quantity: Number(form.quantity),
      unitOfMeasurement: form.unitOfMeasurement,
      unitPriceGhs: Number(form.unitPriceGhs),
      sellingPriceGhs: form.sellingPriceGhs === "" ? null : Number(form.sellingPriceGhs),
      storageLocation: form.storageLocation.trim(),
      lowStockThreshold: Number(form.lowStockThreshold),
      reorderLevel: form.reorderLevel === "" ? null : Number(form.reorderLevel),
      manufacturingDate: form.manufacturingDate
        ? new Date(form.manufacturingDate).toISOString()
        : null,
      internalNotes: form.internalNotes.trim(),
      expiryDate: new Date(form.expiryDate).toISOString(),
    };
  }

  async function handleSubmit() {
    setFormError(null);
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving("medicine");
    try {
      const payload = buildPayload();
      if (isEdit && medicineId) {
        await updateMedicine(medicineId, payload);
      } else {
        await createMedicine(payload);
        localStorage.removeItem(DRAFT_KEY);
      }
      router.push("/dashboard/medicines");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save medicine.");
      setSaving(null);
    }
  }

  function handleSaveDraft() {
    setSaving("draft");
    const savedAt = Date.now();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, savedAt }));
    setDraftSavedAt(savedAt);
    window.setTimeout(() => setSaving(null), 1200);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="h-10 w-64 animate-pulse rounded bg-zinc-200/80" />
        <div className="h-[600px] animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  if (isEdit && loadState?.error) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadState.error}
        </div>
        <Link href="/dashboard/medicines" className="text-sm font-semibold text-brand-600 hover:underline">
          Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-800">
            {isEdit ? "Edit Medicine" : "Add New Medicine"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isEdit
              ? "Update this medicine's inventory record."
              : "Register a new medicine into the pharmacy inventory system."}
          </p>
        </div>
        <Link
          href="/dashboard/medicines"
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Back to Inventory
        </Link>
      </header>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
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
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  setForm(EMPTY_FORM);
                  setDraftRestored(false);
                  setDraftSavedAt(null);
                }}
                className="flex items-center gap-1 font-semibold text-brand-700 hover:underline"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Discard
              </button>
            </div>
          )}

          <section className="flex flex-col gap-5">
            <SectionHeading icon={Pill}>Medicine Information</SectionHeading>

            <Field id="name" label="Medicine Name" required error={errors.name}>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Paracetamol Extra"
                aria-invalid={Boolean(errors.name)}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="genericName" label="Generic Name">
                <input
                  id="genericName"
                  value={form.genericName}
                  onChange={(e) => setField("genericName", e.target.value)}
                  placeholder="e.g. Acetaminophen"
                  className={inputClass}
                />
              </Field>
              <Field id="category" label="Category" required error={errors.category}>
                <SelectField
                  id="category"
                  value={form.category}
                  onChange={(v) => setField("category", v)}
                  options={categories}
                  placeholder="Select Category"
                  invalid={Boolean(errors.category)}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="form" label="Dosage Form" required error={errors.form}>
                <SelectField
                  id="form"
                  value={form.form}
                  onChange={(v) => setField("form", v)}
                  options={DOSAGE_FORMS}
                  placeholder="Select Form"
                  invalid={Boolean(errors.form)}
                />
              </Field>
              <Field id="strength" label="Strength">
                <input
                  id="strength"
                  value={form.strength}
                  onChange={(e) => setField("strength", e.target.value)}
                  placeholder="e.g. 500mg"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="manufacturer" label="Manufacturer">
                <input
                  id="manufacturer"
                  value={form.manufacturer}
                  onChange={(e) => setField("manufacturer", e.target.value)}
                  placeholder="e.g. GSK Pharma"
                  className={inputClass}
                />
              </Field>
              <Field id="supplier" label="Supplier">
                <input
                  id="supplier"
                  value={form.supplier}
                  onChange={(e) => setField("supplier", e.target.value)}
                  placeholder="e.g. Regional Med Dist."
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <SectionHeading icon={ClipboardList}>Inventory Details</SectionHeading>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="batchNo" label="Batch Number" required error={errors.batchNo}>
                <input
                  id="batchNo"
                  value={form.batchNo}
                  onChange={(e) => setField("batchNo", e.target.value)}
                  placeholder="BCH-2024-001"
                  aria-invalid={Boolean(errors.batchNo)}
                  className={inputClass}
                />
              </Field>
              <Field id="quantity" label="Quantity" required error={errors.quantity}>
                <input
                  id="quantity"
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setField("quantity", e.target.value)}
                  placeholder="0"
                  aria-invalid={Boolean(errors.quantity)}
                  className={inputClass}
                />
              </Field>
              <Field id="unitOfMeasurement" label="Unit of Measurement">
                <SelectField
                  id="unitOfMeasurement"
                  value={form.unitOfMeasurement}
                  onChange={(v) => setField("unitOfMeasurement", v)}
                  options={UNITS_OF_MEASUREMENT}
                  placeholder="Select Unit"
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="unitPriceGhs" label="Unit Price (Purchase)" required error={errors.unitPriceGhs}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                    GH₵
                  </span>
                  <input
                    id="unitPriceGhs"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.unitPriceGhs}
                    onChange={(e) => setField("unitPriceGhs", e.target.value)}
                    placeholder="0.00"
                    aria-invalid={Boolean(errors.unitPriceGhs)}
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </Field>
              <Field id="sellingPriceGhs" label="Selling Price" error={errors.sellingPriceGhs}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                    GH₵
                  </span>
                  <input
                    id="sellingPriceGhs"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.sellingPriceGhs}
                    onChange={(e) => setField("sellingPriceGhs", e.target.value)}
                    placeholder="0.00"
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </Field>
              <Field id="branch" label="Branch" required error={errors.branch}>
                <SelectField
                  id="branch"
                  value={form.branch}
                  onChange={(v) => setField("branch", v)}
                  options={branches}
                  placeholder="Select Branch"
                  invalid={Boolean(errors.branch)}
                />
              </Field>
            </div>

            <Field id="storageLocation" label="Storage Location">
              <input
                id="storageLocation"
                value={form.storageLocation}
                onChange={(e) => setField("storageLocation", e.target.value)}
                placeholder="e.g. Shelf A-4, Cold Room"
                className={inputClass}
              />
            </Field>
          </section>

          <section className="flex flex-col gap-5">
            <SectionHeading icon={CalendarClock}>Expiry Information</SectionHeading>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="manufacturingDate" label="Manufacturing Date">
                <input
                  id="manufacturingDate"
                  type="date"
                  value={form.manufacturingDate}
                  onChange={(e) => setField("manufacturingDate", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="expiryDate" label="Expiry Date" required error={errors.expiryDate}>
                <input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setField("expiryDate", e.target.value)}
                  min={!isEdit ? minExpiryDateValue() : undefined}
                  aria-invalid={Boolean(errors.expiryDate)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="lowStockThreshold"
                label="Minimum Stock Level"
                required
                error={errors.lowStockThreshold}
              >
                <input
                  id="lowStockThreshold"
                  type="number"
                  min={0}
                  value={form.lowStockThreshold}
                  onChange={(e) => setField("lowStockThreshold", e.target.value)}
                  placeholder="Threshold for alerts"
                  aria-invalid={Boolean(errors.lowStockThreshold)}
                  className={inputClass}
                />
              </Field>
              <Field id="reorderLevel" label="Reorder Level" error={errors.reorderLevel}>
                <input
                  id="reorderLevel"
                  type="number"
                  min={0}
                  value={form.reorderLevel}
                  onChange={(e) => setField("reorderLevel", e.target.value)}
                  placeholder="Auto-restock trigger"
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <SectionHeading icon={FileText}>Additional Information</SectionHeading>
            <Field id="internalNotes" label="Internal Notes">
              <textarea
                id="internalNotes"
                value={form.internalNotes}
                onChange={(e) => setField("internalNotes", e.target.value)}
                placeholder="Enter any special handling instructions or specific medicine details…"
                rows={4}
                className={`${inputClass} resize-y`}
              />
            </Field>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-6">
            <Link
              href="/dashboard/medicines"
              className="rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-200"
            >
              Cancel
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving !== null}
                className="rounded-lg border border-brand-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving === "draft" ? "Draft Saved" : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving !== null}
                className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving === "medicine" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden />
                    Save Medicine
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <aside className="rounded-2xl bg-brand-50 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-brand-800">
              <Info className="h-5 w-5 text-brand-600" aria-hidden />
              Inventory Guidelines
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm leading-6 text-brand-800">
              <li className="flex items-start gap-2.5">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                Batch Number must be unique across the system.
              </li>
              <li className="flex items-start gap-2.5">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                Expiry Date must be at least 6 months from today for new entries.
              </li>
              <li className="flex items-start gap-2.5">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                Quantity cannot be negative.
              </li>
              <li className="flex items-start gap-2.5">
                <Asterisk className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                Required fields marked with * must be filled.
              </li>
            </ul>
          </aside>

          <aside className="rounded-2xl border border-zinc-200 p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Quick Summary
            </h2>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Status</dt>
                <dd
                  className={`font-bold ${
                    isEdit
                      ? currentStatus === "in-stock"
                        ? "text-emerald-600"
                        : currentStatus === "low-stock"
                          ? "text-amber-600"
                          : "text-red-600"
                      : "text-amber-600"
                  }`}
                >
                  {isEdit
                    ? currentStatus
                        ?.split("-")
                        .map((w) => w[0].toUpperCase() + w.slice(1))
                        .join(" ")
                    : "New Entry"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Last Batch ID</dt>
                <dd className="font-bold text-zinc-800">{lastBatchNo ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">System Time</dt>
                <dd className="font-bold text-zinc-800">
                  {systemTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
