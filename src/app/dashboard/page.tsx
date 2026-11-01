import { redirect } from "next/navigation";
import { getDashboardHome } from "@/lib/dashboard-navigation";
import { getUserRoleContext } from "@/server/school-auth";

export default async function DashboardPage() {
  const context = await getUserRoleContext();
  redirect(getDashboardHome(context.role));
}
