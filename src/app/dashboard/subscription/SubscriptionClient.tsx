"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { activatePremiumPilot, cancelMyPilot, getMySubscription } from "@/server/actions/subscription";
import { getMyInstitutionLicenses } from "@/server/actions/school-subscription";

type Subscription = Awaited<ReturnType<typeof getMySubscription>>["subscription"];
type InstitutionAccess = Awaited<ReturnType<typeof getMyInstitutionLicenses>>;
const fmt = (date: Date | string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "Europe/Istanbul" }).format(new Date(date));
const roleLabel: Record<string, string> = { principal: "Okul müdürü", teacher: "Öğretmen", student: "Öğrenci" };
const accessStatusLabel: Record<string, string> = { active: "Etkin", scheduled: "Başlangıç bekliyor", expired: "Süresi dolmuş", cancelled: "İptal edilmiş", suspended: "Askıya alınmış", not_configured: "Lisans bilgisi bekleniyor" };

export default function SubscriptionClient() {
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [available, setAvailable] = useState(true);
  const [eligibleForGift, setEligibleForGift] = useState(false);
  const [institutions, setInstitutions] = useState<InstitutionAccess>([]);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [result, institutionRows] = await Promise.all([getMySubscription(), getMyInstitutionLicenses()]);
      setAvailable(result.available);
      setSubscription(result.subscription);
      setEligibleForGift(result.eligibleForGift);
      setInstitutions(institutionRows);
      if (!result.available) setError("Abonelik sistemi henüz hazırlanıyor. Lütfen daha sonra yeniden dene.");
      else setError("");
    }
    catch { setAvailable(false); setError("Abonelik bilgisi yüklenemedi. Lütfen daha sonra yeniden dene."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function activate() {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await activatePremiumPilot(accepted);
      setMessage(`İlk ay Premium hediyen etkinleştirildi. ${fmt(result.endsAt)} tarihinde sona erer; otomatik yenilenmez.`);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Premium hediyesi etkinleştirilemedi."); }
    finally { setBusy(false); }
  }

  async function cancel() {
    setBusy(true); setError(""); setMessage("");
    try {
      await cancelMyPilot();
      setMessage("Premium erişimin iptal edildi ve hemen sona erdi.");
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "İptal işlemi tamamlanamadı."); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-3xl space-y-7 px-4 py-8 md:px-8">
    <header><p className="text-xs font-bold uppercase tracking-widest text-[var(--link)]">Hesap</p><h1 className="mt-2 text-3xl font-black text-[var(--text)]">Aboneliğim</h1><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Bireysel öğrenci planını buradan yönetebilirsin. Okul erişimleri kurum üyeliğinden ayrı yürür.</p></header>
    {message && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}
    {error && <p role="alert" className="rounded-xl border border-[var(--err)]/20 bg-[var(--err-bg)] p-4 text-sm text-[var(--err)]">{error}</p>}
    {loading ? <p role="status" className="rounded-2xl border border-[var(--border)] p-6 text-sm text-[var(--text-muted)]">Abonelik bilgisi yükleniyor…</p> : <>
    {institutions.length > 0 && <section className="space-y-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--link)]">Kurum erişimleri</p><h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">Okul planın</h2></div>{institutions.map((institution) => <article key={institution.membershipId} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold text-[var(--text)]">{institution.schoolName}</h3><p className="mt-1 text-sm text-[var(--text-muted)]">{roleLabel[institution.role] ?? "Kurum üyesi"}{institution.className ? ` · ${institution.className}` : ""}{institution.studentNumber ? ` · Okul no: ${institution.studentNumber}` : ""}</p></div><span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-bold text-[var(--text-muted)]">{accessStatusLabel[institution.status] ?? institution.status}</span></div>
      {institution.plan ? <><div className="border-y border-[var(--border)] py-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold text-[var(--text)]">{institution.plan.name}</p>{institution.role === "principal" && institution.studentCount !== null && <p className="text-sm font-semibold text-[var(--text-muted)]">{institution.studentCount}{institution.studentLimit ? ` / ${institution.studentLimit}` : ""} öğrenci kontenjanı</p>}</div><ul className="mt-3 grid gap-2 text-sm text-[var(--text-muted)] sm:grid-cols-2">{institution.plan.features.map((feature) => <li key={feature}>• {feature}</li>)}</ul></div><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[var(--text-muted)]">Erişim başlangıcı</dt><dd className="mt-1 font-semibold text-[var(--text)]">{institution.startsAt ? fmt(institution.startsAt) : "—"}</dd></div><div><dt className="text-xs text-[var(--text-muted)]">Erişim bitişi</dt><dd className="mt-1 font-semibold text-[var(--text)]">{institution.endsAt ? fmt(institution.endsAt) : "—"}</dd></div>{institution.role === "principal" && institution.agreementReference && <div><dt className="text-xs text-[var(--text-muted)]">Sözleşme/teklif referansı</dt><dd className="mt-1 font-semibold text-[var(--text)]">{institution.agreementReference}</dd></div>}</dl></> : <p className="rounded-xl bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--text-muted)]">Kurum üyeliğin mevcut, ancak kurum lisans bilgisi henüz sisteme tanımlanmamış. Okul yöneticinle iletişime geçebilirsin.</p>}
    </article>)}</section>}
    {available && subscription ? <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--link)]">Bireysel Premium üyeliği</p><h2 className="mt-2 text-xl font-extrabold text-[var(--text)]">{subscription.status === "active" && new Date(subscription.endsAt) > new Date() ? "Etkin" : subscription.status === "cancelled" ? "İptal edildi" : "Süresi doldu"}</h2></div><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">{subscription.source === "pilot" ? "0 TL · Hediye erişim" : "Premium erişim"}</span></div>
      <dl className="grid gap-4 border-y border-[var(--border)] py-4 sm:grid-cols-2"><div><dt className="text-xs text-[var(--text-muted)]">Başlangıç</dt><dd className="mt-1 font-semibold text-[var(--text)]">{fmt(subscription.startsAt)}</dd></div><div><dt className="text-xs text-[var(--text-muted)]">Bitiş</dt><dd className="mt-1 font-semibold text-[var(--text)]">{fmt(subscription.endsAt)}</dd></div><div><dt className="text-xs text-[var(--text-muted)]">Yenileme</dt><dd className="mt-1 font-semibold text-[var(--text)]">Yok</dd></div><div><dt className="text-xs text-[var(--text-muted)]">Koşullar</dt><dd className="mt-1"><Link className="font-semibold text-[var(--link)] underline" href="/terms">Kullanım koşullarını görüntüle</Link></dd></div></dl>
      {subscription.status === "active" && new Date(subscription.endsAt) > new Date() && <button disabled={busy} onClick={() => void cancel()} className="rounded-xl border border-[var(--err)]/30 px-4 py-2.5 text-sm font-bold text-[var(--err)] disabled:opacity-50">{busy ? "İşleniyor…" : "Premium erişimini iptal et"}</button>}
    </section> : available && institutions.length > 0 ? null : available && !eligibleForGift ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm leading-6 text-[var(--text-muted)]">İlk ay Premium kampanyası yalnızca daha önce Premium kullanmamış bireysel hesaplara sunulur. Hesabında önceki bir Premium üyeliği bulunduğu için bu teklif gösterilmiyor.</section> : available ? <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--link)]">🎁 Sana özel kampanya</p><h2 className="mt-2 text-2xl font-black text-[var(--text)]">İlk ay Premium bizden</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">İlk 30 gün Premium erişimi hediye. Toplam tutar 0 TL’dir, kart bilgisi istenmez ve 30 gün sonunda otomatik yenileme ya da ücret alınmaz; ücretsiz planın devam eder.</p></div>
      <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-muted)]"><li>Detaylı öğrenci analizi ve PDF raporları</li><li>Hedef ve gelişim takibi</li><li>AI asistanında Premium kullanım</li></ul>
      <label className="flex items-start gap-3 border-t border-[var(--border)] pt-5 text-sm leading-6 text-[var(--text-muted)]"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1 size-4 accent-blue-600"/><span><Link href="/terms" className="font-semibold text-[var(--link)] underline">Kullanım koşullarını</Link> okudum ve ilk 30 gün Premium üyelik hediyesini kabul ediyorum. İstediğim zaman buradan iptal edebilirim.</span></label>
      <button disabled={busy || !accepted} onClick={() => void activate()} className="w-full rounded-xl bg-[#2F6BFF] px-5 py-3.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Etkinleştiriliyor…" : "Hediyeni etkinleştir · 0 TL"}</button>
    </section> : <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm leading-6 text-[var(--text-muted)]">Abonelik sistemi hazır olduğunda hediyeni bu sayfadan etkinleştirebilirsin.</section>}
    </>}
  </main>;
}
