import type { Metadata } from "next";
import Image from "next/image";
import { Archive, Info } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In — Direct Inventory Manager",
  description:
    "Sign in to the Direct Inventory Manager to manage pharmacy inventory, expiry risk, and stock transfers.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1">
      {/* Left panel — brand imagery */}
      <section className="relative hidden lg:flex lg:w-1/2">
        <Image
          src="/login-hero.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 0vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brand-900/75" aria-hidden />
        <div className="relative z-10 flex flex-col justify-center gap-6 px-12 py-16 xl:px-16">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Archive className="h-7 w-7 text-white" aria-hidden />
            </span>
            <div>
              <p className="text-3xl font-bold text-white">
                Direct Inventory Manager
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
                Pharmacy Excellence Simplified
              </p>
            </div>
          </div>
          <h1 className="max-w-md text-3xl font-bold leading-tight text-white">
            Secure recovery for critical pharmaceutical data.
          </h1>
          <p className="max-w-lg text-base leading-7 text-brand-100">
            Regain access to your pharmacy&apos;s management dashboard. Our
            systematic approach ensures data security while maintaining
            operational continuity for your staff.
          </p>
        </div>
      </section>

      {/* Right panel — sign-in card */}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-100 px-4 py-12 sm:px-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm sm:p-10">
          <div className="flex justify-center">
            <Image
              src="/login-logo.png"
              alt="Direct Inventory Manager — Pharmacy inventory, in order"
              width={280}
              height={72}
              priority
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-brand-600">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm leading-6 text-zinc-500">
            Enter your credentials to access the Direct Inventory Manager.
          </p>
          <LoginForm />
        </div>

        <div className="flex w-full max-w-md items-start gap-3 rounded-xl bg-zinc-200/60 p-4">
          <Info
            className="mt-0.5 h-5 w-5 shrink-0 text-accent-500"
            aria-hidden
          />
          <p className="text-sm font-medium leading-6 text-zinc-600">
            If you no longer have access to your email or are having trouble,
            please contact your System Administrator for a manual password
            reset.
          </p>
        </div>
      </section>
    </div>
  );
}
