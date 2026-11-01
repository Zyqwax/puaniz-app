import "@/components/student/student.css";
import type { ReactNode } from "react";
import { requireDashboardRole } from "@/server/dashboard-access";

export default async function RoleLayout({ children }: { children: ReactNode }) {
  await requireDashboardRole("student");
  return <div className="student-workspace">{children}</div>;
}
