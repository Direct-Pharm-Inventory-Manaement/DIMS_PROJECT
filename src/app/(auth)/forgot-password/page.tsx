import type { Metadata } from "next";
import Image from "next/image";
import { Info } from "lucide-react";
import { AuthHero } from "@/components/auth/auth-hero";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password — Direct Inventory Manager",
  description:
    "Recover access to the Direct Inventory Manager with a one-time code sent to your email.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1">
      <AuthHero
        headline="Secure recovery for critical pharmaceutical data."
        description="Regain access to your pharmacy's management dashboard. Our systematic approach ensures data security while maintaining operational continuity for your staff."
      />

      <section className="flex flex-1 flex-col items-center overflow-y-auto bg-zinc-100 px-4 py-8 sm:px-8">
        <div className="my-auto flex w-full max-w-md flex-col gap-6">
          <div className="w-full rounded-2xl bg-white p-8 shadow-sm sm:p-10">
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
              Forgot Password?
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-zinc-500">
              Enter your email address and we&apos;ll send you a one-time code
              to sign back in.
            </p>
            <ForgotPasswordForm />
          </div>

          <div className="flex w-full items-start gap-3 rounded-xl bg-zinc-200/60 p-4">
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
        </div>
      </section>
    </div>
  );
}
