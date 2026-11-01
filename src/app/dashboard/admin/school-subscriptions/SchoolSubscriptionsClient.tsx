"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Building2, Loader2, Plus, X } from "lucide-react";
import { cancelManualInstitutionLicense, confirmInstitutionPayment, getInstitutionLicenseOverview, grantInstitutionDemo, setManualInstitutionLicense } from "@/server/actions/school-subscription";
import { SCHOOL_PLANS, type SchoolPlanKey } from "@/lib/school-plans";

type Overview = Awaited<ReturnType<typeof getInstitutionLicenseOverview>>;
type SchoolRow = Overview[number];
const dateValue = (value: Date | string | null) => value ? new Date(value).toISOString().slice(0, 10) : "";
const dateLabel = (value: Date | string | null) => value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "Europe/Istanbul" }).format(new Date(value)) : "—";
const statusLabel: Record<SchoolRow["status"], string> = { pending: "Müdür onayı bekliyor", awaiting_payment: "Ödeme bekleniyor", active: "Etkin", scheduled: "Başlangıç bekliyor", expired: "Süresi dolmuş", cancelled: "İptal edilmiş", suspended: "Askıya alınmış", not_configured: "Lisans tanımlanmamış" };
const moneyLabel = (amountKurus: number | null) => amountKurus === null ? "Fiyat belirtilmemiş" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amountKurus / 100);

export default function SchoolSubscriptionsClient() {
  const [schools, setSchools] = useState<Overview>([]);
  const [selected, setSelected] = useState<SchoolRow | null>(null);
  const [planKey, setPlanKey] = useState<SchoolPlanKey>("institution-basic");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [studentLimit, setStudentLimit] = useState("50");
  const [priceTry, setPriceTry] = useState("");
  const [agreementReference, setAgreementReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getInstitutionLicenseOverview();
      setSchools(rows);
      setSelected((current) => current ? rows.find((row) => row.id === current.id) ?? null : null);
      setError("");
    } catch {
      setError("Kurum lisansları yüklenemedi.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  function openForm(school: SchoolRow) {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    setSelected(school);
    setPlanKey(school.plan?.key as SchoolPlanKey ?? "institution-basic");
    setStartsAt(school.startsAt ? dateValue(school.startsAt) : today.toISOString().slice(0, 10));
    setEndsAt(school.endsAt ? dateValue(school.endsAt) : nextYear.toISOString().slice(0, 10));
    setStudentLimit(String(Math.max(school.studentLimit ?? 50, school.studentCount)));
    setPriceTry(school.amountKurus === null || school.amountKurus < 1 ? "" : (school.amountKurus / 100).toFixed(2));
    setAgreementReference(school.agreementReference ?? "");
    setError("");
    setNotice("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await setManualInstitutionLicense({ schoolId: selected.id, planKey, startsAt, endsAt, studentLimit: Number(studentLimit), amountKurus: Math.round(Number(priceTry) * 100), agreementReference });
      setNotice(`${selected.name} için lisans teklifi hazırlandı; okul müdürünün sepetten ödeme talebi oluşturması bekleniyor.`);
      setSelected(null);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Kurum erişimi tanımlanamadı."); }
    finally { setSaving(false); }
  }

  async function cancel(school: SchoolRow) {
    if (!window.confirm(`${school.name} için kurum erişimi iptal edilsin mi?`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await cancelManualInstitutionLicense(school.id);
      setNotice(`${school.name} kurum erişimi iptal edildi.`);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Kurum erişimi iptal edilemedi."); }
    finally { setSaving(false); }
  }

  async function grantDemo(school: SchoolRow) {
    if (!window.confirm(`${school.name} okuluna 14 günlük demo erişimi verilsin mi? Mevcut lisans veya bekleyen teklif bununla değiştirilecektir.`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await grantInstitutionDemo(school.id, school.plan?.key ?? "institution-basic", 14);
      setNotice(`${school.name} için 14 günlük demo erişimi verildi.`);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Demo erişimi verilemedi."); }
    finally { setSaving(false); }
  }

  async function confirmPayment(school: SchoolRow) {
    const reference = window.prompt(`${school.name} için ${moneyLabel(school.amountKurus)} ödemenin dışarıda tahsil edildiğini doğrulayın ve ödeme/banka referansını girin.`);
    if (!reference) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await confirmInstitutionPayment(school.id, reference);
      setNotice(`${school.name} için ödeme kaydedildi ve lisans etkinleştirildi.`);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Ödeme doğrulanamadı."); }
    finally { setSaving(false); }
  }

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
    <header><p className="text-xs font-bold uppercase tracking-widest text-[var(--link)]">Yönetim</p><h1 className="mt-2 text-3xl font-black text-[var(--text)]">Kurum lisansları</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">Kurum planını, dönemini ve öğrenci kontenjanını elle tanımla. Bu ekran ödeme almaz ve fatura oluşturmaz.</p></header>
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-[var(--text)]">Lisans teklifi erişim açmaz. Demo yalnızca önce lisans kaydı oluşturulmuş okula verilebilir. Demo dışındaki lisans, gerçek ödeme dışarıda doğrulanıp referansı kaydedilene kadar aktif olmaz; online ödeme altyapısı bağlı değildir. Kontenjan, öğrenci katılımı sırasında sunucu tarafında kontrol edilir.</div>
    {notice && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
    {error && <p role="alert" className="rounded-xl border border-[var(--err)]/20 bg-[var(--err-bg)] p-4 text-sm text-[var(--err)]">{error}</p>}
    {selected && <form onSubmit={save} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[var(--link)]">Manuel erişim tanımla</p><h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">{selected.name}</h2></div><button type="button" aria-label="Formu kapat" onClick={() => setSelected(null)} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><X size={18}/></button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1.5 text-sm font-semibold text-[var(--text)]">Kurum planı<select value={planKey} onChange={e => setPlanKey(e.target.value as SchoolPlanKey)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">{Object.entries(SCHOOL_PLANS).map(([key, plan]) => <option key={key} value={key}>{plan.name}</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-semibold text-[var(--text)]">Başlangıç tarihi<input required type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5"/></label>
        <label className="space-y-1.5 text-sm font-semibold text-[var(--text)]">Bitiş tarihi<input required type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5"/></label>
        <label className="space-y-1.5 text-sm font-semibold text-[var(--text)]">Öğrenci kontenjanı<input required min="1" max="10000" type="number" value={studentLimit} onChange={e => setStudentLimit(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5"/><span className="block text-xs font-normal text-[var(--text-muted)]">Mevcut öğrenci: {selected.studentCount}</span></label>
        <label className="space-y-1.5 text-sm font-semibold text-[var(--text)]">Tahsil edilecek toplam tutar (TL)<input required min="0.01" step="0.01" type="number" value={priceTry} onChange={e => setPriceTry(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5"/><span className="block text-xs font-normal text-[var(--text-muted)]">Vergiler dahil son toplam tutarı girin; müdür sepette bunu görür.</span></label>
        <label className="space-y-1.5 text-sm font-semibold text-[var(--text)] sm:col-span-2">Sözleşme/teklif referansı <span className="font-normal text-[var(--text-muted)]">(isteğe bağlı)</span><input maxLength={120} value={agreementReference} onChange={e => setAgreementReference(e.target.value)} placeholder="Örn. PZ-2026-001" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5"/></label>
      </div>
      <p className="rounded-xl bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--text-muted)]">Bu adım lisans teklifini kaydeder; lisansı etkinleştirmez. Müdür ödeme talebi oluşturur. Ödeme entegrasyonu olmadığı için tahsilatı dışarıda doğrulayıp yönetici ekranından ödeme referansıyla kaydetmelisiniz. Demo gerekiyorsa önce bu lisans teklifini oluşturun, sonra okul kartındaki demo işlemini kullanın.</p>
      <div className="rounded-xl bg-[var(--surface-2)] p-4"><p className="font-semibold text-[var(--text)]">{SCHOOL_PLANS[planKey].name}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{SCHOOL_PLANS[planKey].description}</p><ul className="mt-3 grid gap-1 text-xs text-[var(--text-muted)] sm:grid-cols-2">{SCHOOL_PLANS[planKey].features.map(feature => <li key={feature}>• {feature}</li>)}</ul></div>
      <div className="flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#2F6BFF] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin"/>}{saving ? "Kaydediliyor…" : "Lisans teklifini oluştur"}</button></div>
    </form>}
    {loading ? <p role="status" className="rounded-xl border border-[var(--border)] p-6 text-sm text-[var(--text-muted)]">Kurumlar yükleniyor…</p> : schools.length === 0 ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center"><Building2 className="mx-auto text-[var(--text-muted)]"/><p className="mt-3 font-semibold text-[var(--text)]">Henüz kurum kaydı yok</p></section> : <div className="grid gap-4 lg:grid-cols-2">{schools.map(school => <article key={school.id} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-[var(--brand-soft)] p-2.5 text-[var(--link)]"><Building2 size={18}/></span><div className="min-w-0 flex-1"><h2 className="font-extrabold text-[var(--text)]">{school.name}</h2><p className="mt-1 text-xs text-[var(--text-muted)]">{[school.district, school.city].filter(Boolean).join(", ") || "Konum belirtilmemiş"}{school.source === "demo" ? " · Demo erişimi" : ""}</p></div><span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-bold text-[var(--text-muted)]">{statusLabel[school.status]}</span></div>
      <div className="grid grid-cols-2 gap-3 border-y border-[var(--border)] py-3 text-sm"><div><p className="text-xs text-[var(--text-muted)]">Plan</p><p className="mt-1 font-semibold text-[var(--text)]">{school.plan?.name ?? "—"}</p></div><div><p className="text-xs text-[var(--text-muted)]">Lisans bedeli</p><p className="mt-1 font-semibold text-[var(--text)]">{school.source === "demo" ? "0 TL · Demo" : moneyLabel(school.amountKurus)}</p></div><div><p className="text-xs text-[var(--text-muted)]">Öğrenci kullanımı</p><p className="mt-1 font-semibold text-[var(--text)]">{school.studentCount}{school.studentLimit ? ` / ${school.studentLimit}` : ""}</p></div><div><p className="text-xs text-[var(--text-muted)]">Başlangıç</p><p className="mt-1 font-semibold text-[var(--text)]">{dateLabel(school.startsAt)}</p></div><div><p className="text-xs text-[var(--text-muted)]">Bitiş</p><p className="mt-1 font-semibold text-[var(--text)]">{dateLabel(school.endsAt)}</p></div></div>
      {school.agreementReference && <p className="text-xs text-[var(--text-muted)]">Referans: <span className="font-semibold text-[var(--text)]">{school.agreementReference}</span></p>}
      <div className="flex flex-wrap gap-2"><button onClick={() => openForm(school)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3.5 py-2.5 text-sm font-bold text-[var(--text)] hover:bg-[var(--surface-3)]"><Plus size={15}/>{school.plan ? "Yeni lisans teklifi" : "Lisans tanımla"}</button>{school.plan && <button disabled={saving} onClick={() => void grantDemo(school)} className="rounded-xl border border-amber-500/30 px-3.5 py-2.5 text-sm font-bold text-amber-700 disabled:opacity-50 dark:text-amber-300">14 günlük demo ver</button>}{school.status === "awaiting_payment" && (school.amountKurus ?? 0) > 0 && <button disabled={saving} onClick={() => void confirmPayment(school)} className="rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Ödeme doğrula ve lisansı aç</button>}{(school.status === "active" || school.status === "scheduled" || school.status === "pending" || school.status === "awaiting_payment") && <button disabled={saving} onClick={() => void cancel(school)} className="rounded-xl border border-[var(--err)]/25 px-3.5 py-2.5 text-sm font-bold text-[var(--err)] disabled:opacity-50">{school.status === "pending" ? "Teklifi iptal et" : school.status === "awaiting_payment" ? "Ödeme talebini iptal et" : "Erişimi iptal et"}</button>}</div>
    </article>)}</div>}
  </main>;
}
