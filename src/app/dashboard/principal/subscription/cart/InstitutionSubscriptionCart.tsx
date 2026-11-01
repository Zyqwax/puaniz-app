"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { getMyInstitutionLicenses, requestInstitutionPayment } from "@/server/actions/school-subscription";

type InstitutionAccess = Awaited<ReturnType<typeof getMyInstitutionLicenses>>;
type Offer = InstitutionAccess[number];
const fmt = (date: Date | string | null) => date
  ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "Europe/Istanbul" }).format(new Date(date))
  : "—";
const moneyLabel = (amountKurus: number | null) => amountKurus === null ? "Fiyat bilgisi yok" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amountKurus / 100);

export default function InstitutionSubscriptionCart() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busySchool, setBusySchool] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getMyInstitutionLicenses();
      setOffers(rows.filter((row) => row.role === "principal" && (row.status === "pending" || row.status === "awaiting_payment")));
      setError("");
    } catch {
      setError("Lisans teklifleri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function start(school: Offer) {
    setBusySchool(school.schoolId); setError("");
    try {
      await requestInstitutionPayment(school.schoolId, accepted[school.schoolId] === true);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Okul aboneliği başlatılamadı.");
    } finally { setBusySchool(null); }
  }

  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-8">
    <Link href="/dashboard/principal/subscription" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--link)]"><ArrowLeft size={16}/>Okul aboneliğine dön</Link>
    <header><p className="text-xs font-bold uppercase tracking-widest text-[var(--link)]">Sepet</p><h1 className="mt-2 text-3xl font-black text-[var(--text)]">Okul lisansı için ödeme</h1><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Yönetici tarafından hazırlanan lisans teklifini ve vergiler dahil toplam tutarı inceleyin.</p></header>
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-[var(--text)]">Online ödeme altyapısı henüz bağlı değil. Bu sayfada ödeme talebi oluşturabilirsiniz; gerçek ödeme dışarıda tamamlanıp yönetici tarafından doğrulanana kadar lisans açılmaz. Otomatik yenileme yapılmaz.</div>
    {error && <p role="alert" className="rounded-xl border border-[var(--err)]/20 bg-[var(--err-bg)] p-4 text-sm text-[var(--err)]">{error}</p>}
    {loading ? <p role="status" className="rounded-2xl border border-[var(--border)] p-6 text-sm text-[var(--text-muted)]">Sepet yükleniyor…</p> : offers.length === 0 ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center"><ShoppingCart className="mx-auto text-[var(--text-muted)]"/><h2 className="mt-3 font-bold text-[var(--text)]">Bekleyen lisans teklifi yok</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Okul yöneticiniz lisans teklifi hazırladığında burada görünecek.</p></section> : <div className="space-y-5">{offers.map((offer) => <article key={offer.membershipId} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--link)]">Kurum lisans teklifi</p><h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">{offer.schoolName}</h2></div>
      <div className="rounded-xl bg-[var(--surface-2)] p-4"><p className="text-xs text-[var(--text-muted)]">Plan</p><p className="mt-1 font-bold text-[var(--text)]">{offer.plan?.name ?? "Kurum planı"}</p>{offer.plan && <ul className="mt-3 grid gap-1 text-sm text-[var(--text-muted)] sm:grid-cols-2">{offer.plan.features.map((feature) => <li key={feature}>• {feature}</li>)}</ul>}</div>
      <dl className="grid gap-4 border-y border-[var(--border)] py-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[var(--text-muted)]">Başlangıç</dt><dd className="mt-1 font-semibold text-[var(--text)]">{fmt(offer.startsAt)}</dd></div><div><dt className="text-xs text-[var(--text-muted)]">Bitiş</dt><dd className="mt-1 font-semibold text-[var(--text)]">{fmt(offer.endsAt)}</dd></div><div><dt className="text-xs text-[var(--text-muted)]">Kontenjan</dt><dd className="mt-1 font-semibold text-[var(--text)]">{offer.studentLimit ?? "—"} öğrenci</dd></div>{offer.agreementReference && <div><dt className="text-xs text-[var(--text-muted)]">Teklif/sözleşme referansı</dt><dd className="mt-1 font-semibold text-[var(--text)]">{offer.agreementReference}</dd></div>}</dl>
      <p className="text-lg font-extrabold text-[var(--text)]">Tahsil edilecek toplam: {moneyLabel(offer.amountKurus)}</p>
      {offer.status === "awaiting_payment" ? <div className="rounded-xl bg-amber-500/10 p-4 text-sm leading-6 text-[var(--text)]">Ödeme talebi alındı. Ödeme bilgisi ve doğrulama için okul yöneticinizle iletişime geçin. Ödeme doğrulanınca lisans etkinleştirilecek.</div> : <>
        <label className="flex items-start gap-3 border-t border-[var(--border)] pt-4 text-sm leading-6 text-[var(--text-muted)]"><input type="checkbox" checked={accepted[offer.schoolId] === true} onChange={(event) => setAccepted((current) => ({ ...current, [offer.schoolId]: event.target.checked }))} className="mt-1 size-4 accent-blue-600"/><span>Bu lisansın toplam tutarını, dönemini ve kontenjanını gördüm. Ödeme talebi oluşturmamın tek başına lisansı başlatmayacağını anladım.</span></label>
        <button disabled={busySchool !== null || accepted[offer.schoolId] !== true || offer.amountKurus === null || offer.amountKurus < 1} onClick={() => void start(offer)} className="w-full rounded-xl bg-[#2F6BFF] px-5 py-3.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{busySchool === offer.schoolId ? "Talep kaydediliyor…" : `Ödeme talebi oluştur · ${moneyLabel(offer.amountKurus)}`}</button>
      </>}
    </article>)}</div>}
  </main>;
}
