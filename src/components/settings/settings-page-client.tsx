"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Cpu,
  HardDrive,
  Info,
  KeyRound,
  Pencil,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
  Sliders,
  Loader2,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { listBranches, type Branch } from "@/lib/api/branches";
import {
  getSettings,
  getSystemInfo,
  updateSettings,
  type SystemInfo,
  type SystemSettings,
  type UpdateSettingsInput,
} from "@/lib/api/settings";
import { useToast } from "@/components/ui/toast";
import { BranchEditModal } from "@/components/settings/branch-edit-modal";

const SECTIONS = [
  { id: "general", label: "General" },
  { id: "thresholds", label: "Inventory Thresholds" },
  { id: "branches", label: "Branch Details" },
  { id: "security", label: "Security" },
  { id: "system-info", label: "System Information" },
] as const;

function pick(settings: SystemSettings): UpdateSettingsInput {
  return {
    systemName: settings.systemName,
    organizationName: settings.organizationName,
    defaultBranch: settings.defaultBranch,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    criticalAlertDays: settings.criticalAlertDays,
    highRiskDays: settings.highRiskDays,
    monitoringDays: settings.monitoringDays,
    minimumStockTrigger: settings.minimumStockTrigger,
    predictionWindowDays: settings.predictionWindowDays,
    twoFactorRequired: settings.twoFactorRequired,
    autoLogoutMinutes: settings.autoLogoutMinutes,
  };
}

function isDirty(a: SystemSettings, b: SystemSettings): boolean {
  return JSON.stringify(pick(a)) !== JSON.stringify(pick(b));
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds % 60}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-zinc-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-brand-700" : "bg-zinc-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SectionCard({
  id,
  sectionRef,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  sectionRef: React.RefObject<HTMLElement | null>;
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      ref={sectionRef}
      className="scroll-mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-bold text-zinc-800">{title}</h2>
          <p className="text-xs text-zinc-400">{description}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

export function SettingsPageClient() {
  const { showToast } = useToast();
  const [loaded, setLoaded] = useState<SystemSettings | null>(null);
  const [draft, setDraft] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [branchRefreshId, setBranchRefreshId] = useState(0);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  const [activeSection, setActiveSection] = useState<string>("general");
  const generalRef = useRef<HTMLElement>(null);
  const thresholdsRef = useRef<HTMLElement>(null);
  const branchesRef = useRef<HTMLElement>(null);
  const securityRef = useRef<HTMLElement>(null);
  const systemInfoRef = useRef<HTMLElement>(null);
  const sectionRefsById: Record<string, React.RefObject<HTMLElement | null>> = {
    general: generalRef,
    thresholds: thresholdsRef,
    branches: branchesRef,
    security: securityRef,
    "system-info": systemInfoRef,
  };

  useEffect(() => {
    const controller = new AbortController();
    getSettings(controller.signal)
      .then((s) => {
        setLoaded(s);
        setDraft(s);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    listBranches(controller.signal).then(setBranches).catch(() => {});
    return () => controller.abort();
  }, [branchRefreshId]);

  useEffect(() => {
    const controller = new AbortController();
    getSystemInfo(controller.signal).then(setSystemInfo).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    const elements = Object.values(sectionRefsById)
      .map((ref) => ref.current)
      .filter((el): el is HTMLElement => el !== null);
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
    // sectionRefsById is rebuilt each render from stable useRef objects —
    // its identity changing isn't a real dependency change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function scrollToSection(id: string) {
    sectionRefsById[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateDraft<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const dirty = Boolean(loaded && draft && isDirty(loaded, draft));

  async function handleSave() {
    if (!draft) return;
    setSaveError(null);
    if (!(draft.criticalAlertDays < draft.highRiskDays && draft.highRiskDays < draft.monitoringDays)) {
      setSaveError("Critical Alert days must be less than High Risk days, which must be less than Monitoring days.");
      scrollToSection("thresholds");
      return;
    }
    setSaving(true);
    try {
      const result = await updateSettings(pick(draft));
      setLoaded(result);
      setDraft(result);
      showToast("success", "Settings saved.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save settings.";
      setSaveError(message);
      showToast("error", message);
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    if (!loaded) return;
    setDraft(loaded);
    setSaveError(null);
    showToast("info", "Reverted to last saved settings.");
  }

  const branchOptions = branches?.map((b) => b.name) ?? (draft ? [draft.defaultBranch] : []);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-800">System Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure system-wide preferences, alert thresholds, and branch information.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={!dirty || saving}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            Save Changes
          </button>
        </div>
      </header>

      {saveError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="h-fit lg:sticky lg:top-6">
          <ul className="flex flex-row gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-2 lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                    activeSection === s.id
                      ? "bg-brand-700 text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {!draft ? (
          <div className="flex flex-col gap-6">
            {SECTIONS.map((s) => (
              <div key={s.id} className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <SectionCard
              id="general"
              sectionRef={generalRef}
              icon={Sliders}
              title="General Configuration"
              description="Core identity and locale settings for this deployment."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="system-name" label="System Name">
                  <input
                    id="system-name"
                    value={draft.systemName}
                    onChange={(e) => updateDraft("systemName", e.target.value)}
                    className={`mt-1.5 ${inputClass}`}
                  />
                </Field>
                <Field id="org-name" label="Organization Name">
                  <input
                    id="org-name"
                    value={draft.organizationName}
                    onChange={(e) => updateDraft("organizationName", e.target.value)}
                    className={`mt-1.5 ${inputClass}`}
                  />
                </Field>
                <Field id="default-branch" label="Default Branch" hint="Pre-selected when registering new medicine stock.">
                  <select
                    id="default-branch"
                    value={draft.defaultBranch}
                    onChange={(e) => updateDraft("defaultBranch", e.target.value)}
                    className={`mt-1.5 ${inputClass}`}
                  >
                    {branchOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="timezone" label="Timezone">
                  <select
                    id="timezone"
                    value={draft.timezone}
                    onChange={(e) => updateDraft("timezone", e.target.value)}
                    className={`mt-1.5 ${inputClass}`}
                  >
                    <option value="Africa/Accra">Africa/Accra (GMT)</option>
                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                    <option value="Africa/Abidjan">Africa/Abidjan (GMT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </Field>
                <Field id="date-format" label="Date Format">
                  <select
                    id="date-format"
                    value={draft.dateFormat}
                    onChange={(e) => updateDraft("dateFormat", e.target.value)}
                    className={`mt-1.5 ${inputClass}`}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              id="thresholds"
              sectionRef={thresholdsRef}
              icon={AlertCircle}
              title="Inventory & Alert Thresholds"
              description="Drives the Expiry Risk and Low-Stock prediction engines directly."
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Expiry Risk Brackets</p>
                <div className="mt-3 grid gap-5 sm:grid-cols-3">
                  <Field id="critical-days" label="Critical Alert (days)">
                    <input
                      id="critical-days"
                      type="number"
                      min={1}
                      value={draft.criticalAlertDays}
                      onChange={(e) => updateDraft("criticalAlertDays", Number(e.target.value))}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </Field>
                  <Field id="high-risk-days" label="High Risk (days)">
                    <input
                      id="high-risk-days"
                      type="number"
                      min={1}
                      value={draft.highRiskDays}
                      onChange={(e) => updateDraft("highRiskDays", Number(e.target.value))}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </Field>
                  <Field id="monitoring-days" label="Monitoring (days)">
                    <input
                      id="monitoring-days"
                      type="number"
                      min={1}
                      value={draft.monitoringDays}
                      onChange={(e) => updateDraft("monitoringDays", Number(e.target.value))}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </Field>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Critical must be less than High Risk, which must be less than Monitoring.
                </p>
              </div>

              <div className="border-t border-zinc-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Stock Level Controls</p>
                <div className="mt-3 max-w-xs">
                  <Field id="min-stock" label="Minimum Stock Trigger (units)" hint="Default for all new medicine entries.">
                    <input
                      id="min-stock"
                      type="number"
                      min={0}
                      value={draft.minimumStockTrigger}
                      onChange={(e) => updateDraft("minimumStockTrigger", Number(e.target.value))}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </Field>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Analytics & Prediction</p>
                <div className="mt-3 max-w-xs">
                  <Field
                    id="prediction-window"
                    label="Prediction Window (days)"
                    hint="Rolling period for out-of-stock forecasts."
                  >
                    <input
                      id="prediction-window"
                      type="number"
                      min={1}
                      max={90}
                      value={draft.predictionWindowDays}
                      onChange={(e) => updateDraft("predictionWindowDays", Number(e.target.value))}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="branches"
              sectionRef={branchesRef}
              icon={Building2}
              title="Manage Branches"
              description="Contact and licensing details for each pharmacy location."
            >
              {!branches ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-100" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {branches.map((b) => (
                    <div key={b.id} className="rounded-xl border border-zinc-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-zinc-800">{b.name} Branch</p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              b.type === "primary" ? "bg-brand-100 text-brand-700" : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {b.type === "primary" ? "Primary Hub" : "Satellite"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingBranch(b)}
                          aria-label={`Edit ${b.name} branch`}
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-brand-600"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <p className="mt-2.5 text-xs text-zinc-500">{b.address}</p>
                      <p className="mt-1 text-xs text-zinc-500">{b.phone}</p>
                      <p className="mt-1 text-xs text-zinc-400">License: {b.licenseNumber || "—"}</p>
                      <p className="mt-2 text-xs font-semibold text-zinc-500">
                        {b.medicineCount} medicines · {b.staffCount} staff
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              id="security"
              sectionRef={securityRef}
              icon={Shield}
              title="Security"
              description="Session and authentication controls."
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-700">Two-Factor Authentication</p>
                  <p className="text-xs text-zinc-400">
                    Require mobile OTP for admin logins. Saved here; login enforcement ships in a later update.
                  </p>
                </div>
                <Switch
                  checked={draft.twoFactorRequired}
                  onChange={(v) => updateDraft("twoFactorRequired", v)}
                  label="Two-Factor Authentication"
                />
              </div>

              <div className="border-t border-zinc-100 pt-5">
                <Field
                  id="auto-logout"
                  label="Auto-Logout"
                  hint="Signs out inactive sessions automatically across the app."
                >
                  <select
                    id="auto-logout"
                    value={draft.autoLogoutMinutes}
                    onChange={(e) => updateDraft("autoLogoutMinutes", Number(e.target.value))}
                    className={`mt-1.5 max-w-xs ${inputClass}`}
                  >
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                </Field>
              </div>

              <div className="border-t border-zinc-100 pt-5">
                <Link
                  href="/forgot-password"
                  className="flex w-fit items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                  <KeyRound className="h-4 w-4" aria-hidden />
                  Change Admin Password
                </Link>
              </div>
            </SectionCard>

            <SectionCard
              id="system-info"
              sectionRef={systemInfoRef}
              icon={Info}
              title="System Info"
              description="Live diagnostics — read-only."
            >
              {!systemInfo ? (
                <div className="h-24 animate-pulse rounded-xl bg-zinc-100" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow icon={Cpu} label="Application Version" value={`v${systemInfo.appVersion}`} />
                  <InfoRow icon={HardDrive} label="Database Engine" value={systemInfo.dbEngine} />
                  <InfoRow icon={ShieldCheck} label="Last Backup" value={systemInfo.lastBackupAt ?? "Not configured"} />
                  <InfoRow icon={Info} label="Server Uptime" value={formatUptime(systemInfo.uptimeSeconds)} />
                  <InfoRow icon={HardDrive} label="Data Usage" value={formatBytes(systemInfo.dbSizeBytes)} />
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </div>

      {editingBranch && (
        <BranchEditModal
          branch={editingBranch}
          onClose={() => setEditingBranch(null)}
          onSaved={() => setBranchRefreshId((id) => id + 1)}
        />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
        <Icon className="h-4.5 w-4.5" aria-hidden />
      </span>
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="text-sm font-bold text-zinc-800">{value}</p>
      </div>
    </div>
  );
}
