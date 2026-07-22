import { apiRequest } from "./client";

export type UserRole = "administrator" | "staff";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch: "adenta" | "haatso";
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export interface RequestOtpResponse {
  message: string;
}

/** Sends a one-time passcode to the given email for password recovery. */
export function requestPasswordOtp(email: string): Promise<RequestOtpResponse> {
  return apiRequest<RequestOtpResponse>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

/**
 * Verifies the emailed OTP. On success the user receives a temporary
 * session (same shape as login) and can change their password afterwards.
 */
export function verifyPasswordOtp(
  email: string,
  otp: string,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/verify-otp", {
    method: "POST",
    body: { email, otp },
  });
}
