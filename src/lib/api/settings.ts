import { apiRequest } from "./client";

export interface SystemSettings {
  id: string;
  systemName: string;
  organizationName: string;
  defaultBranch: string;
  timezone: string;
  dateFormat: string;
  criticalAlertDays: number;
  highRiskDays: number;
  monitoringDays: number;
  minimumStockTrigger: number;
  predictionWindowDays: number;
  twoFactorRequired: boolean;
  autoLogoutMinutes: number;
  updatedAt: string;
}

export type UpdateSettingsInput = Partial<
  Omit<SystemSettings, "id" | "updatedAt">
>;

export interface SystemInfo {
  appVersion: string;
  dbEngine: string;
  dbSizeBytes: number;
  uptimeSeconds: number;
  lastBackupAt: string | null;
}

export function getSettings(signal?: AbortSignal): Promise<SystemSettings> {
  return apiRequest<SystemSettings>("/settings", { signal });
}

export function updateSettings(input: UpdateSettingsInput): Promise<SystemSettings> {
  return apiRequest<SystemSettings>("/settings", { method: "PATCH", body: input });
}

export function getSystemInfo(signal?: AbortSignal): Promise<SystemInfo> {
  return apiRequest<SystemInfo>("/settings/system-info", { signal });
}
