"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Save,
  UserPlus,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getTransfersFacets } from "@/lib/api/transfers";
import {
  createUser,
  resetUserPassword,
  updateUser,
  type SystemUser,
  type UserInput,
  type UserRole,
} from "@/lib/api/users";
import { ROLE_OPTIONS } from "@/components/users/badges";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 aria-[invalid=true]:border-red-400";

function TempPasswordPanel({ password }: { password: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-800">
        Share this one-time password with the user — it won&apos;t be shown again.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-white px-3 py-2 font-mono text-sm text-zinc-800">
          {password}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(password);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  /** Undefined = create mode. */
  user?: SystemUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(user);
  const [branches, setBranches] = useState<string[]>([]);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "pharmacist");
  const [branch, setBranch] = useState(user?.branch ?? "");

  const [errors, setErrors] = useState<Partial<Record<keyof UserInput, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getTransfersFacets(controller.signal)
      .then((facets) => {
        setBranches(facets.branches);
        setBranch((prev) => prev || facets.branches[0] || "");
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!email.trim()) next.email = "Email is required.";
    if (!username.trim() || username.trim().length < 3) {
      next.username = "Username must be at least 3 characters.";
    }
    if (!branch) next.branch = "Select a branch.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setFormError(null);
    if (!validate()) return;
    setSaving(true);
    const input: UserInput = { name: name.trim(), email: email.trim(), username: username.trim(), role, branch };
    try {
      if (isEdit && user) {
        await updateUser(user.id, input);
        onSaved();
        onClose();
      } else {
        const result = await createUser(input);
        setTemporaryPassword(result.temporaryPassword);
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!user) return;
    setResettingPassword(true);
    setFormError(null);
    try {
      const result = await resetUserPassword(user.id);
      setTemporaryPassword(result.temporaryPassword);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to reset password.");
    } finally {
      setResettingPassword(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 id="user-modal-title" className="flex items-center gap-2 text-lg font-bold text-brand-800">
            <UserPlus className="h-5 w-5 text-brand-500" aria-hidden />
            {isEdit ? "Edit User" : "Add User"}
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

        {temporaryPassword ? (
          <div className="mt-5 flex flex-col gap-4">
            <TempPasswordPanel password={temporaryPassword} />
            <button
              type="button"
              onClick={() => {
                onSaved();
                onClose();
              }}
              className="rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {formError}
              </div>
            )}

            <div>
              <label htmlFor="user-name" className="block text-sm font-semibold text-zinc-700">
                Name
              </label>
              <input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(errors.name)}
                className={`mt-1.5 ${inputClass}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="user-email" className="block text-sm font-semibold text-zinc-700">
                Email
              </label>
              <input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                className={`mt-1.5 ${inputClass}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="user-username" className="block text-sm font-semibold text-zinc-700">
                Username
              </label>
              <input
                id="user-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={Boolean(errors.username)}
                className={`mt-1.5 ${inputClass}`}
              />
              {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="user-role" className="block text-sm font-semibold text-zinc-700">
                  Role
                </label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className={`mt-1.5 ${inputClass}`}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="user-branch" className="block text-sm font-semibold text-zinc-700">
                  Branch
                </label>
                <select
                  id="user-branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  aria-invalid={Boolean(errors.branch)}
                  className={`mt-1.5 ${inputClass}`}
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isEdit && (
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resettingPassword}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resettingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <KeyRound className="h-4 w-4" aria-hidden />
                )}
                Reset Password
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              {isEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
