import type { ReactNode } from "react";
import { requireDashboardRole } from "@/server/dashboard-access";

export default async function RoleLayout({ children }: { children: ReactNode }) {
  await requireDashboardRole("teacher");
  return children;
}
