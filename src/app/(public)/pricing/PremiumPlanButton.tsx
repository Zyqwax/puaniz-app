"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function PremiumPlanButton() {
  const { user, loading } = useAuth();
  const next = "/dashboard/subscription";
  const href = user?.emailVerified ? next : `/auth?next=${encodeURIComponent(next)}`;
  return <Link aria-disabled={loading} href={loading ? "/auth" : href} className="block rounded-xl bg-[#2F6BFF] px-5 py-3.5 text-center text-sm font-extrabold text-white transition hover:bg-blue-700">
    {loading ? "Yükleniyor…" : user?.emailVerified ? "Premium planını görüntüle" : "Giriş yap"}
  </Link>;
}
