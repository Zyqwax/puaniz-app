"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";
import { getMySubscription } from "@/server/actions/subscription";

export default function PremiumGiftBanner() {
  const [eligible, setEligible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    getMySubscription().then((result) => {
      if (active) setEligible(result.available && result.eligibleForGift);
    }).catch(() => {
      if (active) setEligible(false);
    });
    return () => { active = false; };
  }, []);

  if (!eligible || dismissed) return null;
  return <aside className="relative flex flex-col gap-4 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-400/15 via-orange-300/10 to-[var(--surface)] p-5 sm:flex-row sm:items-center sm:p-6">
    <button type="button" aria-label="Kampanya duyurusunu kapat" onClick={() => setDismissed(true)} className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)]"><X size={16}/></button>
    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-700 dark:text-amber-200"><Gift size={23}/></span>
    <div className="min-w-0 flex-1 pr-6"><p className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-200">Sana özel · ilk ay Premium hediye</p><h2 className="mt-1 text-lg font-black text-[var(--text)]">Premium özellikleri 30 gün ücretsiz kullan</h2><p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">Ödeme bilgisi yok, otomatik yenileme yok. Daha önce Premium kullanmamış hesaplara özel.</p></div>
    <Link href="/dashboard/subscription?cart=premium" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#2F6BFF] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-blue-700">Hediyeni al</Link>
  </aside>;
}
