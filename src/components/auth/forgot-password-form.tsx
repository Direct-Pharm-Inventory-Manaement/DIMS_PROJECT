"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Mail,
  MailCheck,
  Send,
  ShieldCheck,
} from "lucide-react";
import { requestPasswordOtp, verifyPasswordOtp } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setAuth } from "@/lib/auth-storage";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** a•••@domain.com — enough to confirm the address without echoing it. */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.charAt(0)}•••@${domain}`;
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  async function sendOtp(): Promise<boolean> {
    try {
      await requestPasswordOtp(email.trim());
      setResendIn(RESEND_COOLDOWN_SECONDS);
      return true;
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.",
      );
      return false;
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Enter your email address.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(null);
    setPending(true);
    const sent = await sendOtp();
    setPending(false);
    if (sent) {
      setStep("otp");
      setDigits(Array(OTP_LENGTH).fill(""));
    }
  }

  async function handleResend() {
    if (resendIn > 0 || pending) return;
    setFormError(null);
    setPending(true);
    await sendOtp();
    setPending(false);
  }

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleDigitKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setFormError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }
    setPending(true);
    try {
      const session = await verifyPasswordOtp(email.trim(), otp);
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

  const errorAlert = formError && (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {formError}
    </div>
  );

  if (step === "email") {
    return (
      <form className="mt-8 space-y-5" onSubmit={handleEmailSubmit} noValidate>
        {errorAlert}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-zinc-700"
          >
            Email Address
          </label>
          <div className="relative mt-2">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="e.g. admin@pharmacy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
              className="w-full rounded-lg border border-zinc-300 bg-white py-3 pl-10 pr-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 aria-[invalid=true]:border-red-400"
            />
          </div>
          {emailError && (
            <p id="email-error" className="mt-1.5 text-sm text-red-600">
              {emailError}
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
              Sending Code…
            </>
          ) : (
            <>
              <Send className="h-4.5 w-4.5" aria-hidden />
              Send Reset Code
            </>
          )}
        </button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Sign In
        </Link>
      </form>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleOtpSubmit} noValidate>
      <div className="flex items-start gap-2.5 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm leading-5 text-brand-700">
        <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{`We sent a ${OTP_LENGTH}-digit code to ${maskEmail(email.trim())}. It expires shortly.`}</span>
      </div>

      {errorAlert}

      <fieldset>
        <legend className="block text-sm font-semibold text-zinc-700">
          Verification Code
        </legend>
        <div className="mt-2 flex justify-between gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleDigitKeyDown(index, e)}
              onPaste={handlePaste}
              className="h-13 w-11 rounded-lg border border-zinc-300 bg-white text-center text-xl font-bold text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden />
            Verifying…
          </>
        ) : (
          <>
            <ShieldCheck className="h-4.5 w-4.5" aria-hidden />
            Verify &amp; Sign In
          </>
        )}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setFormError(null);
          }}
          className="flex items-center gap-1.5 font-semibold text-zinc-500 hover:text-zinc-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Change email
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendIn > 0 || pending}
          className="font-semibold text-brand-600 hover:text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline"
        >
          {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
