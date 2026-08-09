"use client";

import { useState } from "react";
import { AlertCircle, Building2, Loader2, Save, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { updateBranch, type Branch, type BranchType } from "@/lib/api/branches";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

export function BranchEditModal({
  branch,
  onClose,
  onSaved,
}: {
  branch: Branch;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<BranchType>(branch.type);
  const [address, setAddress] = useState(branch.address);
  const [phone, setPhone] = useState(branch.phone);
  const [licenseNumber, setLicenseNumber] = useState(branch.licenseNumber);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);
    setSaving(true);
    try {
      await updateBranch(branch.id, { type, address, phone, licenseNumber });
      onSaved();
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save branch.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-modal-title"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 id="branch-modal-title" className="flex items-center gap-2 text-lg font-bold text-brand-800">
            <Building2 className="h-5 w-5 text-brand-500" aria-hidden />
            {branch.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {formError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="branch-type" className="block text-sm font-semibold text-zinc-700">
              Branch Type
            </label>
            <select
              id="branch-type"
              value={type}
              onChange={(e) => setType(e.target.value as BranchType)}
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="primary">Primary Hub</option>
              <option value="satellite">Satellite</option>
            </select>
          </div>

          <div>
            <label htmlFor="branch-address" className="block text-sm font-semibold text-zinc-700">
              Address
            </label>
            <input
              id="branch-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="branch-phone" className="block text-sm font-semibold text-zinc-700">
              Phone
            </label>
            <input
              id="branch-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="branch-license" className="block text-sm font-semibold text-zinc-700">
              Pharmacy Council License No.
            </label>
            <input
              id="branch-license"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
