import "server-only";
import { redirect } from "next/navigation";
import { getUserRoleContext } from "@/server/school-auth";
import { getDashboardHome, normalizeDashboardRole, type DashboardRole } from "@/lib/dashboard-navigation";

export async function requireDashboardRole(role: DashboardRole) {
  const context = await getUserRoleContext();
  if (normalizeDashboardRole(context.role) !== role) {
    redirect(getDashboardHome(context.role));
  }
}
