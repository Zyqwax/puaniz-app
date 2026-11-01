import { LayoutGrid, CirclePlus, FileText, PieChart, Users, Bot, BookOpen, Sparkles, ShieldCheck, Building2, GraduationCap, School, Settings, Inbox, Bell, CreditCard, type LucideIcon } from "lucide-react";

export type DashboardRole = "student" | "teacher" | "principal" | "admin";
export type DashboardNavItem = { path: string; label: string; icon: LucideIcon; exact?: boolean };
export type DashboardNavGroup = { label: string; items: DashboardNavItem[] };

export function normalizeDashboardRole(role?: string | null): DashboardRole {
  if (role === "superadmin" || role === "admin") return "admin";
  return role === "teacher" || role === "principal" ? role : "student";
}

export function getDashboardHome(role?: string | null) {
  return `/dashboard/${normalizeDashboardRole(role)}`;
}

export function getDashboardNavGroups(role?: string | null): DashboardNavGroup[] {
  const currentRole = normalizeDashboardRole(role);
  const groups: Record<DashboardRole, DashboardNavGroup> = {
    student: { label: "Öğrenci", items: [
      { path: "/dashboard/student", label: "Genel Bakış", icon: LayoutGrid, exact: true },
      { path: "/dashboard/student/reports", label: "Dönem Raporları", icon: FileText },
      { path: "/dashboard/student/plan", label: "Haftalık Çalışma Planım", icon: FileText },
      { path: "/dashboard/student/progress", label: "Gelişim & Çalışma Planı", icon: PieChart },
      { path: "/dashboard/student/school-exams", label: "Okulum & Sınıfım", icon: School },
      { path: "/dashboard/student/add-exam", label: "Deneme Ekle", icon: CirclePlus },
      { path: "/dashboard/student/subjects", label: "Konu Takip", icon: FileText },
      { path: "/dashboard/student/analysis", label: "Detaylı Analiz", icon: PieChart },
      { path: "/dashboard/student/history", label: "Deneme Geçmişi", icon: BookOpen },
      { path: "/dashboard/subscription", label: "Aboneliğim", icon: CreditCard },
    ] },
    teacher: { label: "Öğretmen", items: [{ path: "/dashboard/teacher/students", label: "Sınıflarım & Öğrenciler", icon: GraduationCap }, { path: "/dashboard/teacher/progress", label: "Analiz & Öğrenci Takibi", icon: PieChart }, { path: "/dashboard/teacher/reports", label: "Dönem Raporları", icon: FileText }] },
    principal: { label: "Okul Müdürü", items: [{ path: "/dashboard/principal", label: "Okul Yönetimi", icon: Building2, exact: true }, { path: "/dashboard/principal/students", label: "Öğrenci Dizini", icon: GraduationCap }, { path: "/dashboard/principal/data", label: "Okul Verisi & Düzeltme", icon: FileText }, { path: "/dashboard/principal/progress", label: "Okul Analizi & Takip", icon: PieChart }, { path: "/dashboard/principal/reports", label: "Dönem Raporları", icon: FileText }, { path: "/dashboard/principal/subscription", label: "Okul Aboneliği", icon: CreditCard } ] },
    admin: { label: "Yönetici", items: [
      { path: "/dashboard/admin", label: "Sistem & Okullar", icon: ShieldCheck, exact: true },
      { path: "/dashboard/admin/messages", label: "İletişim Mesajları", icon: Inbox },
      { path: "/dashboard/admin/community", label: "Forum Yönetimi", icon: Users },
      { path: "/dashboard/admin/school-subscriptions", label: "Kurum Lisansları", icon: CreditCard },
    ] },
  };
  return [groups[currentRole], { label: "Herkes için", items: [
    { path: "/dashboard/notifications", label: "Gelişim Bildirimleri", icon: Bell },
    { path: "/dashboard/assistant", label: "YKS Asistan", icon: Bot },
    { path: "/dashboard/community", label: "Topluluk", icon: Users },
    { path: "/dashboard/changelog", label: "Yenilikler", icon: Sparkles },
    { path: "/dashboard/settings", label: "Profil & Ayarlar", icon: Settings },
  ] }];
}
