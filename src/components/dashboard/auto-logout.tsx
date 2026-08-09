"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSettings } from "@/lib/api/settings";
import { clearAuth } from "@/lib/auth-storage";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

/** Silently signs the user out after N idle minutes (Settings → Security → Auto-Logout). Renders nothing. */
export function AutoLogout() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let minutes = 30;
    let cancelled = false;

    function signOut() {
      clearAuth();
      router.push("/login");
    }

    function resetTimer() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(signOut, minutes * 60 * 1000);
    }

    getSettings()
      .then((settings) => {
        if (cancelled) return;
        minutes = settings.autoLogoutMinutes;
        resetTimer();
      })
      .catch(() => {
        resetTimer();
      });

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [router]);

  return null;
}
