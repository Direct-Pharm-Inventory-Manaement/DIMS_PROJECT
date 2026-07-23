import type { LoginResponse } from "@/lib/api/auth";

const STORAGE_KEY = "dims.auth";

export function setAuth(session: LoginResponse): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getAuth(): LoginResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginResponse;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
}
