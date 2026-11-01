"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, CalendarDays, Users } from "lucide-react";
import Link from "next/link";
import { getMyInstitutionLicenses } from "@/server/actions/school-subscription";

type InstitutionAccess = Awaited<ReturnType<typeof getMyInstitutionLicenses>>;
type PrincipalAccess = InstitutionAccess[number];
const fmt = (date: Date | string | null) => date
  ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "Europe/Istanbul" }).format(new Date(date))
  : "—";
const statusLabel: Record<string, string> = {
  pending: "Lisans teklifi hazır",
  awaiting_payment: "Ödeme bekleniyor",
  active: "Etkin",
  scheduled: "Başlangıç bekliyor",
  expired: "Süresi dolmuş",
  cancelled: "İptal edilmiş",
  suspended: "Askıya alınmış",
  not_configured: "Lisans tanımlanmamış",
};
const moneyLabel = (amountKurus: number | null) => amountKurus === null ? "Belirtilmemiş" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amountKurus / 100);

export default function InstitutionSubscriptionClient() {
  const [schools, setSchools] = useState<PrincipalAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getMyInstitutionLicenses();
      setSchools(rows.filter((row) => row.role === "principal"));
      setError("");
    } catch {
      setError("Okul abonelik bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8">
    <header>
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--link)]">Okul yönetimi</p>
      <h1 className="mt-2 text-3xl font-black text-[var(--text)]">Okul aboneliği</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Yöneticisi olduğunuz okulun plan, erişim dönemi ve öğrenci kontenjanı bilgileri.</p>
    </header>
    {error && <p role="alert" className="rounded-xl border border-[var(--err)]/20 bg-[var(--err-bg)] p-4 text-sm text-[var(--err)]">{error}</p>}
    {loading ? <p role="status" className="rounded-2xl border border-[var(--border)] p-6 text-sm text-[var(--text-muted)]">Okul aboneliği yükleniyor…</p> : schools.length === 0 ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm leading-6 text-[var(--text-muted)]">Yöneticisi olduğunuz bir okul aboneliği bilgisi bulunamadı.</section> : <div className="space-y-5">{schools.map((school) => <article key={school.membershipId} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="rounded-xl bg-[var(--brand-soft)] p-3 text-[var(--link)]"><Building2 size={20}/></span><div><h2 className="text-xl font-extrabold text-[var(--text)]">{school.schoolName}</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Okul müdürü{school.source === "demo" ? " · Demo erişimi" : ""}</p></div></div><span className="rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--text-muted)]">{statusLabel[school.status] ?? school.status}</span></div>
      {school.plan ? <>
        <div className="rounded-xl bg-[var(--surface-2)] p-4"><p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Mevcut plan</p><h3 className="mt-1 text-lg font-extrabold text-[var(--text)]">{school.plan.name}</h3><p className="mt-1 text-sm text-[var(--text-muted)]">{school.plan.features.join(" · ")}</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4"><CalendarDays size={18} className="text-[var(--link)]"/><div><p className="text-xs text-[var(--text-muted)]">Erişim başlangıcı</p><p className="mt-1 text-sm font-semibold text-[var(--text)]">{fmt(school.startsAt)}</p></div></div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4"><CalendarDays size={18} className="text-[var(--link)]"/><div><p className="text-xs text-[var(--text-muted)]">Erişim bitişi</p><p className="mt-1 text-sm font-semibold text-[var(--text)]">{fmt(school.endsAt)}</p></div></div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4"><Users size={18} className="text-[var(--link)]"/><div><p className="text-xs text-[var(--text-muted)]">Öğrenci kontenjanı</p><p className="mt-1 text-sm font-semibold text-[var(--text)]">{school.studentCount ?? 0}{school.studentLimit ? ` / ${school.studentLimit}` : ""} öğrenci</p></div></div>
          {school.source !== "demo" && <div className="rounded-xl border border-[var(--border)] p-4"><p className="text-xs text-[var(--text-muted)]">Vergiler dahil toplam lisans bedeli</p><p className="mt-1 text-sm font-semibold text-[var(--text)]">{moneyLabel(school.amountKurus)}</p></div>}
          {school.paidAt && <div className="rounded-xl border border-[var(--border)] p-4"><p className="text-xs text-[var(--text-muted)]">Ödeme doğrulama tarihi</p><p className="mt-1 text-sm font-semibold text-[var(--text)]">{fmt(school.paidAt)}</p></div>}
          {school.agreementReference && <div className="rounded-xl border border-[var(--border)] p-4"><p className="text-xs text-[var(--text-muted)]">Sözleşme/teklif referansı</p><p className="mt-1 text-sm font-semibold text-[var(--text)]">{school.agreementReference}</p></div>}
        </div>
      </> : <p className="rounded-xl bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--text-muted)]">Okul kaydınız mevcut, ancak lisans ve plan bilgileri henüz sisteme tanımlanmamış. Güncel bilgi için Puaniz yöneticisiyle iletişime geçin.</p>}
      {school.status === "pending" && <div className="space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="text-sm leading-6 text-[var(--text)]">Okulunuz için bir lisans teklifi hazırlandı. Planı başlatmak için sepet ve onay adımına geçin.</p><Link href="/dashboard/principal/subscription/cart" className="inline-flex rounded-xl bg-[#2F6BFF] px-4 py-2.5 text-sm font-extrabold text-white">Sepete git</Link></div>}
      {school.status === "awaiting_payment" && <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="text-sm leading-6 text-[var(--text)]">Ödeme talebiniz kaydedildi. Ödeme dışarıda doğrulanıp yönetici tarafından onaylanana kadar lisans etkinleşmez.</p><Link href="/dashboard/principal/subscription/cart" className="inline-flex rounded-xl bg-[var(--surface-2)] px-4 py-2.5 text-sm font-bold text-[var(--text)]">Ödeme durumunu görüntüle</Link></div>}
      <p className="border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--text-muted)]">Bu ekran bilgilendirme amaçlıdır. Plan değişikliği ve lisans iptali yetkili yönetici tarafından yürütülür.</p>
    </article>)}</div>}
  </main>;
}
