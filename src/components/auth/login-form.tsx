"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  User,
} from "lucide-react";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setAuth } from "@/lib/auth-storage";

interface FieldErrors {
  identifier?: string;
  password?: string;
}

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!identifier.trim()) {
      errors.identifier = "Enter your username or email address.";
    }
    if (!password) {
      errors.password = "Enter your password.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validate() || pending) return;

    setPending(true);
    try {
      const session = await login({ identifier: identifier.trim(), password });
      setAuth(session);
      router.push("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setPending(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {formError}
        </div>
      )}

      <div>
        <label
          htmlFor="identifier"
          className="block text-sm font-semibold text-zinc-700"
        >
          Username or Email Address
        </label>
        <div className="relative mt-2">
          <User
            className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="e.g. admin@pharmacy.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            aria-invalid={Boolean(fieldErrors.identifier)}
            aria-describedby={
              fieldErrors.identifier ? "identifier-error" : undefined
            }
            className="w-full rounded-lg border border-zinc-300 bg-white py-3 pl-10 pr-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 aria-[invalid=true]:border-red-400"
          />
        </div>
        {fieldErrors.identifier && (
          <p id="identifier-error" className="mt-1.5 text-sm text-red-600">
            {fieldErrors.identifier}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-zinc-700"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="relative mt-2">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            className="w-full rounded-lg border border-zinc-300 bg-white py-3 pl-10 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 aria-[invalid=true]:border-red-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          >
            {showPassword ? (
              <EyeOff className="h-4.5 w-4.5" aria-hidden />
            ) : (
              <Eye className="h-4.5 w-4.5" aria-hidden />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p id="password-error" className="mt-1.5 text-sm text-red-600">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden />
            Signing In…
          </>
        ) : (
          <>
            <LogIn className="h-4.5 w-4.5" aria-hidden />
            Sign In
          </>
        )}
      </button>
    </form>
  );
}
