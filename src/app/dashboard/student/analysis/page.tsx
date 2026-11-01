import React from "react";
import type { Metadata } from "next";
import AnalysisClient from "./AnalysisClient";
import { requireUser } from "@/server/session";
import { hasPremiumAccess } from "@/server/subscription";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Detaylı Analiz",
  description: "Ders bazlı net grafikleri ve gelişim raporları ile eksiklerinizi tespit edin.",
  keywords: ["ders analizi", "net grafikleri", "gelişim raporu", "yks istatistik", "deneme analizi"],
};

export default async function AnalysisPage() {
  const user = await requireUser();
  if (!(await hasPremiumAccess(user.id))) return <main className="mx-auto max-w-3xl p-6 md:p-10"><section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7"><p className="text-xs font-bold uppercase tracking-widest text-[var(--link)]">Premium özelliği</p><h1 className="mt-2 text-2xl font-black text-[var(--text)]">Detaylı analiz</h1><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Ders bazlı analiz ve PDF raporları Premium üyelik kapsamında sunulur. Aboneliğim sayfasında hesabına uygun seçenekleri görebilirsin.</p><Link href="/dashboard/subscription?cart=premium" className="mt-5 inline-flex rounded-xl bg-[#2F6BFF] px-5 py-3 text-sm font-bold text-white">Aboneliğimi görüntüle</Link></section></main>;
  return <AnalysisClient />;
}
