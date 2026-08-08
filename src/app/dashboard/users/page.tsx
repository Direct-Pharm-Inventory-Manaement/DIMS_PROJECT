import type { Metadata } from "next";
import { UsersPageClient } from "@/components/users/users-page-client";

export const metadata: Metadata = {
  title: "System Users — Direct Inventory Manager",
  description: "Manage system users, roles, and branch access across the network.",
};

export default function UsersPage() {
  return <UsersPageClient />;
}
