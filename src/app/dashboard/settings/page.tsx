import type { Metadata } from "next";
import { SettingsPageClient } from "@/components/settings/settings-page-client";

export const metadata: Metadata = {
  title: "System Settings — Direct Inventory Manager",
  description: "Configure system-wide preferences, alert thresholds, and branch information.",
};

export default function Page() {
  return <SettingsPageClient />;
}
